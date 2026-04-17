import { describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import { render, renderJab, setup } from "../index.js"

describe("maoka test renderer", () => {
	test("renders and refreshes components in an in-memory tree", () => {
		let count = 0
		const Count = maoka.html.div(
			({ props }) =>
				() =>
					`Count: ${props().count}`,
		)
		const Counter = maoka.create(() => () => [
			Count(() => ({ key: "count", count })),
			count > 0
				? maoka.html.button(() => () => "+")(() => ({ key: "inc" }))
				: null,
		])
		const renderer = render(Counter())

		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{
					tag: "div",
					text: "Count: 0",
				},
			],
		})

		count = 1
		renderer.refresh()

		expect(renderer.text()).toBe("Count: 1+")
		expect(renderer.findByTag("button").text).toBe("+")
		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{
					tag: "div",
					text: "Count: 1",
				},
				{
					tag: "button",
					text: "+",
				},
			],
		})
	})

	test("renders mixed component and text children", () => {
		const App = maoka.create(() => () => [
			maoka.html.div(() => () => "Hello")(),
			", Maoka",
		])
		const renderer = render(App())

		expect(renderer.text()).toBe("Hello, Maoka")
		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{
					tag: "div",
					text: "Hello",
				},
				{
					tag: "#text",
					text: ", Maoka",
				},
			],
		})
	})

	test("remounts unkeyed children when the component type changes", () => {
		let asButton = false
		let refresh
		const Div = maoka.html.div(() => () => "Div")
		const Button = maoka.html.button(() => () => "Button")
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => [asButton ? Button() : Div()]
		})
		const renderer = render(App())

		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{
					tag: "div",
					text: "Div",
				},
			],
		})

		asButton = true
		refresh()
		renderer.flush()

		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{
					tag: "button",
					text: "Button",
				},
			],
		})
	})

	test("runs component beforeUnmount handlers when children are removed", () => {
		const calls = []
		let visible = true
		let refresh
		const Child = maoka.html.div(({ lifecycle }) => {
			lifecycle.beforeUnmount(() => calls.push("beforeUnmount:child"))

			return () => "Child"
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => (visible ? Child() : null)
		})
		const renderer = render(App())

		expect(renderer.text()).toBe("Child")

		visible = false
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("")
		expect(calls).toEqual(["beforeUnmount:child"])
	})

	test("ignores stale child refreshes after unmount and cancels pending async continuations", async () => {
		let resolveRefresh
		const pendingRefresh = new Promise(resolve => {
			resolveRefresh = resolve
		})
		const calls = []
		let childRefresh
		let visible = true
		let refresh
		const Child = maoka.html.div(({ lifecycle, refresh$ }) => {
			childRefresh = refresh$
			lifecycle.beforeRefresh(() => async () => {
				await pendingRefresh
				calls.push("continuation")

				return true
			})

			return () => {
				calls.push("render")

				return "Child"
			}
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => (visible ? Child(() => ({ key: "child" })) : null)
		})
		const renderer = render(App())

		childRefresh()
		renderer.flush()

		visible = false
		refresh()
		renderer.flush()

		childRefresh()
		renderer.flush()

		resolveRefresh()
		await pendingRefresh
		await Promise.resolve()

		expect(renderer.toJSON()).toEqual({ tag: "root" })
		expect(calls).toEqual(["render", "render", "continuation"])
	})

	test("does not rerun beforeCreate handlers when components are reused", () => {
		const calls = []
		let count = 0
		let refresh
		const Count = maoka.html.div(
			({ props }) =>
				() =>
					`Count: ${props().count}`,
		)
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () =>
				Count(() => ({ key: "count", count })).beforeCreate(params => {
					calls.push(`before:${params.key}`)
				})
		})
		const renderer = render(App())

		expect(renderer.text()).toBe("Count: 0")
		expect(calls).toEqual(["before:count"])

		count = 1
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("Count: 1")
		expect(calls).toEqual(["before:count"])
	})

	test("does not rerun afterMount handlers when keyed components are reordered", () => {
		const calls = []
		let items = ["a", "b"]
		let refresh
		const Row = maoka.html.div(({ lifecycle, props }) => {
			lifecycle.afterMount(() => {
				calls.push(`afterMount:${props().id}`)
			})

			return () => props().id
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => items.map(id => Row(() => ({ key: id, id })))
		})
		const renderer = render(App())

		expect(renderer.text()).toBe("ab")
		expect(calls).toEqual(["afterMount:a", "afterMount:b"])

		items = ["b", "a"]
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("ba")
		expect(calls).toEqual(["afterMount:a", "afterMount:b"])
	})

	test("runs afterMount handlers for root create components that share parent values", () => {
		const calls = []
		const App = maoka.create(({ lifecycle }) => {
			lifecycle.afterMount(() => {
				calls.push("afterMount:app")
			})

			return () => "App"
		})
		const renderer = render(App())

		expect(renderer.text()).toBe("App")
		expect(calls).toEqual(["afterMount:app"])
	})

	test("supports components without a render phase", () => {
		const calls = []
		const Silent = maoka.create(({ lifecycle }) => {
			lifecycle.afterMount(() => {
				calls.push("afterMount:silent")
			})
		})
		const App = maoka.create(() => () => [
			maoka.html.div(() => () => "A")(),
			Silent(() => ({ key: "silent" })),
			maoka.html.div(() => () => "B")(),
		])
		const renderer = render(App())

		expect(renderer.text()).toBe("AB")
		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{
					tag: "div",
					text: "A",
				},
				{
					tag: "div",
					text: "B",
				},
			],
		})
		expect(calls).toEqual(["afterMount:silent"])
	})

	test("runs jabs with real params, props, lifecycle, and refresh", () => {
		let count = 1
		const useCounter = ({ lifecycle, props, refresh$ }) => {
			const state = {
				refreshes: 0,
				get label() {
					return props().label
				},
			}

			lifecycle.beforeRefresh(() => {
				state.refreshes++

				return true
			})

			return {
				state,
				inc: () => {
					count++
					refresh$()
				},
			}
		}
		const renderer = renderJab(useCounter, {
			props: () => ({ label: `Count: ${count}` }),
			template: result => result.state.label,
		})

		expect(renderer.result().state.label).toBe("Count: 1")
		expect(renderer.text()).toBe("Count: 1")

		renderer.result().inc()
		renderer.flush()

		expect(renderer.result().state.refreshes).toBe(1)
		expect(renderer.result().state.label).toBe("Count: 2")
		expect(renderer.text()).toBe("Count: 2")
		expect(renderer.params().props().label).toBe("Count: 2")
	})

	test("exposes helper query methods and setup alias", () => {
		const First = maoka.html.div(() => () => "First")
		const Second = maoka.html.div(() => () => "Second")
		const App = maoka.create(() => () => [First(), Second(), " tail"])
		const renderer = render(App())
		const probe = setup(() => ({ ok: true }))

		expect(renderer.find(value => value.text === "First")?.tag).toBe("div")
		expect(renderer.findAll(value => value.tag === "div")).toHaveLength(2)
		expect(renderer.findAllByTag("div")).toHaveLength(2)
		expect(renderer.findByTag("div")?.text).toBe("First")
		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [
				{ tag: "div", text: "First" },
				{ tag: "div", text: "Second" },
				{ tag: "#text", text: " tail" },
			],
		})
		expect(probe.result()).toEqual({ ok: true })
	})

	test("allows refreshing through the synthetic root parent", () => {
		let count = 0
		const Count = maoka.html.div(({ props }) => () => `Count: ${props().count}`)
		const App = maoka.create(() => () => Count(() => ({ count })))
		const renderer = render(App())

		expect(renderer.node.parent.props()).toEqual({ key: renderer.root.key })
		expect(renderer.node.parent.render()).toBe(renderer.root.children)

		count = 1
		renderer.node.parent.refresh$()
		renderer.flush()

		expect(renderer.text()).toBe("Count: 1")
	})

	test("accepts direct component instances", () => {
		const App = maoka.html.div(() => () => "Direct")
		const renderer = render(App())

		expect(renderer.node.lastRenderResult).toBe("Direct")
		expect(renderer.node.hasRenderPhase).toBe(true)
		expect(renderer.text()).toBe("Direct")
		expect(renderer.toJSON()).toEqual({
			tag: "root",
			children: [{ tag: "div", text: "Direct" }],
		})
	})

	test("throws when render receives a blueprint", () => {
		const App = maoka.html.div(() => () => "Direct")

		expect(() => render(App)).toThrow(
			"render expects a component instance; call the blueprint first",
		)
	})

})
