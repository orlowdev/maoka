import { describe, expect, test } from "bun:test"

import maoka from "../index.js"
import { render } from "../test/index.js"

describe("maoka jabs", () => {
	test("noRefresh prevents a component from rendering on refresh", () => {
		let count = 0
		let refresh
		let renders = 0
		const Counter = maoka.html.div(({ use }) => {
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
		const renderer = render(App)

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
		const Counter = maoka.html.div(({ props$, use }) => {
			use(
				maoka.jabs.shouldComponentRefresh(
					(prevProps, nextProps) => prevProps.important !== nextProps.important,
				),
			)

			return () => {
				const { important, ignored } = props$()

				renders++

				return `${important}:${ignored}`
			}
		})
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => Counter(() => ({ key: "counter", ...props }))
		})
		const renderer = render(App)

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

		expect(() => render(Boundary)).not.toThrow()
		expect(handledErrors).toEqual([error])
	})
})
