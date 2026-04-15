import { describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import { render, renderJab } from "../index.js"

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
		const renderer = render(Counter)

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
		const renderer = render(App)

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
		const renderer = render(App)

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
		const renderer = render(App)

		expect(renderer.text()).toBe("Child")

		visible = false
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("")
		expect(calls).toEqual(["beforeUnmount:child"])
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
		const renderer = render(App)

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
		const renderer = render(App)

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
		const renderer = render(App)

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
		const renderer = render(App)

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
})
