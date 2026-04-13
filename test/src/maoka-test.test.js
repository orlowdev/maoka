import { describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import { render, renderJab } from "../index.js"

describe("maoka test renderer", () => {
	test("renders and refreshes components in an in-memory tree", () => {
		let count = 0
		const Count = maoka.html.div(({ props$ }) => () => `Count: ${props$().count}`)
		const Counter = maoka.create(() => () => [
			Count(() => ({ key: "count", count })),
			count > 0 ? maoka.html.button(() => () => "+")(() => ({ key: "inc" })) : null,
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

	test("runs jabs with real params, props, lifecycle, and refresh", () => {
		let count = 1
		const useCounter = ({ lifecycle, props$, refresh$ }) => {
			const state = {
				refreshes: 0,
				get label() {
					return props$().label
				},
			}

			lifecycle.onRefresh(() => {
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
		expect(renderer.params().props$().label).toBe("Count: 2")
	})
})
