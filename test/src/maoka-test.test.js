import { describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import maokaTest, { render, renderJab, setup } from "../index.js"

describe("maoka test renderer", () => {
	test("exposes test jabs", () => {
		expect(maokaTest.jabs.ifInTest).toEqual(expect.any(Function))
		expect(maokaTest.jabs.attributes.get).toEqual(expect.any(Function))
		expect(maokaTest.jabs.classes.assign).toEqual(expect.any(Function))
	})

	test("ifInTest runs for test values and skips foreign values", () => {
		let seenTag
		const Good = maoka.create(({ use }) => {
			seenTag = use(maokaTest.jabs.ifInTest(({ value }) => value.tag))

			return () => null
		})
		const skipped = renderJab(
			maokaTest.jabs.ifInTest(({ value }) => value.tag),
			{ value: { noTag: true } },
		)

		render(Good())

		expect(seenTag).toBe("root")
		expect(skipped.result()).toBe(undefined)
	})

	test("test jabs set and read attributes, data attributes, aria, and id", () => {
		const Probe = maoka.html.div(({ use }) => {
			use(maokaTest.jabs.setId("hero"))
			use(maokaTest.jabs.attributes.set("title", "Launch"))
			use(maokaTest.jabs.dataAttributes.set("kind", "primary"))
			use(maokaTest.jabs.aria.set("label", "Launch button"))

			return () => "Launch"
		})
		const renderer = render(Probe())

		expect(renderer.node.value.attrs).toEqual(
			new Map([
				["id", "hero"],
				["title", "Launch"],
				["data-kind", "primary"],
				["aria-label", "Launch button"],
			]),
		)
	})

	test("test attribute getters initialize attrs on custom test values", () => {
		const value = {
			tag: "root",
			text: "",
			parent: null,
			children: [],
		}
		const renderer = renderJab(maokaTest.jabs.attributes.get("title"), { value })

		expect(renderer.result()).toBe(undefined)
		expect(value.attrs).toBeInstanceOf(Map)
		expect(value.attrs.size).toBe(0)
	})

	test("test class jabs manage classes", () => {
		let hasBeta
		const Probe = maoka.html.div(({ use }) => {
			use(maokaTest.jabs.classes.set("alpha"))
			use(maokaTest.jabs.classes.add("beta"))
			use(maokaTest.jabs.classes.remove("alpha"))
			hasBeta = use(maokaTest.jabs.classes.has("beta"))

			return () => "Classy"
		})
		const renderer = render(Probe())

		expect(renderer.node.value.attrs.get("class")).toBe("beta")
		expect(hasBeta).toBe(true)
	})

	test("test assign jabs update only when computed values change", () => {
		let title = "Idle"
		let enabled = false
		let renderCalls = 0
		let refresh
		const Probe = maoka.html.div(({ refresh$, use }) => {
			refresh = refresh$
			use(maokaTest.jabs.attributes.assign("title", () => title))
			use(maokaTest.jabs.dataAttributes.assign("state", () => title))
			use(maokaTest.jabs.aria.assign("label", () => title))
			use(maokaTest.jabs.assignId(() => title.toLowerCase()))
			use(
				maokaTest.jabs.classes.assign(() =>
					enabled ? "is-ready is-mounted" : "is-mounted",
				),
			)

			return () => {
				renderCalls++

				return "Assign"
			}
		})
		const renderer = render(Probe())
		const initialAttrs = new Map(renderer.node.value.attrs)

		expect(initialAttrs).toEqual(
			new Map([
				["title", "Idle"],
				["data-state", "Idle"],
				["aria-label", "Idle"],
				["id", "idle"],
				["class", "is-mounted"],
			]),
		)

		refresh()
		renderer.flush()
		expect(renderer.node.value.attrs).toEqual(initialAttrs)
		expect(renderCalls).toBe(1)

		title = "Ready"
		enabled = true
		refresh()
		renderer.flush()

		expect(renderer.node.value.attrs).toEqual(
			new Map([
				["title", "Ready"],
				["data-state", "Ready"],
				["aria-label", "Ready"],
				["id", "ready"],
				["class", "is-ready is-mounted"],
			]),
		)
		expect(renderCalls).toBe(1)
	})

	test("test attribute assign removes attributes for undefined values", () => {
		let title = "Idle"
		let refresh
		const Probe = maoka.html.div(({ refresh$, use }) => {
			refresh = refresh$
			use(maokaTest.jabs.attributes.assign("title", () => title))

			return () => "Assign"
		})
		const renderer = render(Probe())

		expect(renderer.node.value.attrs.get("title")).toBe("Idle")

		title = undefined
		refresh()
		renderer.flush()

		expect(renderer.node.value.attrs.has("title")).toBe(false)
	})

	test("test classes.set clears class when called without tokens", () => {
		const Probe = maoka.html.div(({ use, value }) => {
			value.attrs = new Map([["class", "alpha beta"]])
			use(maokaTest.jabs.classes.set())

			return () => "Classy"
		})
		const renderer = render(Probe())

		expect(renderer.node.value.attrs.has("class")).toBe(false)
	})

	test("test class toggle syncs across refreshes", () => {
		let active = false
		let refresh
		const Probe = maoka.html.div(({ refresh$, use }) => {
			refresh = refresh$
			use(maokaTest.jabs.classes.toggle(() => active, "is-active"))

			return () => "Toggle"
		})
		const renderer = render(Probe())

		expect(renderer.node.value.attrs.has("class")).toBe(false)

		active = true
		refresh()
		renderer.flush()
		expect(renderer.node.value.attrs.get("class")).toBe("is-active")
	})

	test("test class jabs reject invalid class tokens", () => {
		const Invalid = maoka.html.div(({ use }) => {
			use(maokaTest.jabs.classes.add("not valid"))

			return () => "Invalid"
		})

		expect(() => render(Invalid())).toThrow(
			"Class name must not contain whitespace",
		)
	})

	test("renders and refreshes components in an in-memory tree", () => {
		let count = 0
		const Count = maoka.html.div(
			({ props }) =>
				() =>
					`Count: ${props().count}`,
		)
		const Counter = maoka.create(() => () => [
			Count(() => ({ count }), { key: "count" }),
			count > 0 ? maoka.html.button(() => () => "+")({ key: "inc" }) : null,
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

			return () => (visible ? Child({ key: "child" }) : null)
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
				Count(() => ({ count }), { key: "count" }).beforeCreate(params => {
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

			return () => items.map(id => Row(() => ({ id }), { key: id }))
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

	test("reuses no-props keyed components when metadata is passed as the second argument", () => {
		const calls = []
		let items = ["a", "b"]
		let refresh
		const Row = maoka.html.div(({ lifecycle, key }) => {
			lifecycle.afterMount(() => {
				calls.push(`afterMount:${key}`)
			})

			return () => key
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => items.map(id => Row(undefined, { key: id }))
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
			Silent({ key: "silent" }),
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

		expect(renderer.node.parent.props()).toEqual({})
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
