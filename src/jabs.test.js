import { describe, expect, test } from "bun:test"

import maoka from "../index.js"
import { render } from "../test/index.js"
import { render as renderToString } from "../string/index.js"

describe("maoka jabs", () => {
	test("noRefresh prevents a component from rendering on refresh", () => {
		let count = 0
		let refresh
		let childRefresh
		let renders = 0
		const Counter = maoka.html.div(({ refresh$, use }) => {
			childRefresh = refresh$
			use(maoka.jabs.noRefresh)

			return () => {
				renders++

				return `Count: ${count}`
			}
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => Counter()
		})
		const renderer = render(App())

		expect(renderer.text()).toBe("Count: 0")
		expect(renders).toBe(1)

		count = 2
		childRefresh()
		renderer.flush()

		expect(renderer.text()).toBe("Count: 0")
		expect(renders).toBe(1)

		count = 1
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("Count: 0")
		expect(renders).toBe(1)
	})

	test("shouldComponentRefresh refreshes only when the comparison returns true", () => {
		let props = { important: 0, ignored: 0 }
		let refresh
		let renders = 0
		const Counter = maoka.html.div(({ props, use }) => {
			use(
				maoka.jabs.shouldComponentRefresh(
					(prevProps, nextProps) => prevProps.important !== nextProps.important,
				),
			)

			return () => {
				const { important, ignored } = props()

				renders++

				return `${important}:${ignored}`
			}
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => Counter(() => ({ key: "counter", ...props }))
		})
		const renderer = render(App())

		expect(renderer.text()).toBe("0:0")
		expect(renders).toBe(1)

		props = { important: 0, ignored: 1 }
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("0:0")
		expect(renders).toBe(1)

		props = { important: 1, ignored: 1 }
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("1:1")
		expect(renders).toBe(2)

		props = { important: 1, ignored: 2 }
		refresh()
		renderer.flush()

		expect(renderer.text()).toBe("1:1")
		expect(renders).toBe(2)
	})

	test("errorBoundary handles errors from descendants", () => {
		const error = new Error("Child failed")
		const handledErrors = []
		const BrokenChild = maoka.html.div(() => () => {
			throw error
		})
		const Boundary = maoka.create(({ use }) => {
			use(maoka.jabs.errorBoundary(error => handledErrors.push(error)))

			return () => BrokenChild()
		})

		expect(() => render(Boundary())).not.toThrow()
		expect(handledErrors).toEqual([error])
	})

	test("errorBoundary does not mount descendants that fail during initial render", () => {
		const handledErrors = []
		const mountCalls = []
		const BrokenChild = maoka.html.div(({ lifecycle }) => {
			lifecycle.afterMount(() => {
				mountCalls.push("afterMount")
			})

			return () => {
				throw new Error("Child failed")
			}
		})
		const Boundary = maoka.create(({ use }) => {
			use(maoka.jabs.errorBoundary(error => handledErrors.push(error.message)))

			return () => BrokenChild()
		})
		const renderer = render(Boundary())

		expect(handledErrors).toEqual(["Child failed"])
		expect(mountCalls).toEqual([])
		expect(renderer.toJSON()).toEqual({ tag: "root" })
	})

	test("errorBoundary ignores own errors", () => {
		const handledErrors = []
		const Boundary = maoka.html.div(({ use }) => {
			use(maoka.jabs.errorBoundary(error => handledErrors.push(error)))

			return () => {
				throw new Error("Boundary failed")
			}
		})

		expect(() => render(Boundary())).not.toThrow()
		expect(handledErrors).toEqual([])
	})

	test("generic jabs delegate to the test renderer jabs", () => {
		const observed = {}
		const Probe = maoka.html.button(({ use }) => {
			use(maoka.jabs.setId("hero"))
			use(maoka.jabs.attributes.set("title", "Launch"))
			use(maoka.jabs.dataAttributes.set("kind", "primary"))
			use(maoka.jabs.aria.set("label", "Launch button"))
			use(maoka.jabs.classes.set("alpha"))
			use(maoka.jabs.classes.add("beta"))
			use(maoka.jabs.classes.remove("alpha"))

			observed.id = use(maoka.jabs.attributes.get("id"))
			observed.title = use(maoka.jabs.attributes.get("title"))
			observed.kind = use(maoka.jabs.dataAttributes.get("kind"))
			observed.label = use(maoka.jabs.aria.get("label"))
			observed.hasBeta = use(maoka.jabs.classes.has("beta"))

			return () => "Launch"
		})
		const renderer = render(Probe())

		expect(renderer.node.value.attrs).toEqual(
			new Map([
				["id", "hero"],
				["title", "Launch"],
				["data-kind", "primary"],
				["aria-label", "Launch button"],
				["class", "beta"],
			]),
		)
		expect(observed).toEqual({
			id: "hero",
			title: "Launch",
			kind: "primary",
			label: "Launch button",
			hasBeta: true,
		})
	})

	test("generic jabs delegate to the string renderer jabs", () => {
		let title = "Idle"
		let active = false
		const Probe = maoka.html.div(({ lifecycle, refresh$, use }) => {
			use(maoka.jabs.attributes.assign("title", () => title))
			use(maoka.jabs.assignId(() => title.toLowerCase()))
			use(maoka.jabs.classes.toggle(() => active, "is-active"))

			lifecycle.afterMount(() => {
				title = "Ready"
				active = true
				refresh$()
			})

			return () => "Status"
		})

		expect(renderToString(Probe())).toBe(
			'<div title="Ready" id="ready" class="is-active">Status</div>',
		)
	})

	test("generic assign jabs delegate class, data, and aria updates", () => {
		let state = "idle"
		let label = "Idle"
		let className = "is-idle"
		const Probe = maoka.html.div(({ lifecycle, refresh$, use }) => {
			use(maoka.jabs.dataAttributes.assign("state", () => state))
			use(maoka.jabs.aria.assign("label", () => label))
			use(maoka.jabs.classes.assign(() => className))

			lifecycle.afterMount(() => {
				state = "ready"
				label = "Ready"
				className = "is-ready is-mounted"
				refresh$()
			})

			return () => "Assign"
		})

		expect(renderToString(Probe())).toBe(
			'<div data-state="ready" aria-label="Ready" class="is-ready is-mounted">Assign</div>',
		)
	})
})
