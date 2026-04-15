import { describe, expect, test } from "bun:test"

import maoka from "../../../index.js"
import { render } from "../../../test/index.js"
import { CodeBlock } from "./code-block.js"

describe("CodeBlock", () => {
	test("switches between JavaScript and TypeScript examples", () => {
		const App = maoka.create(() => () =>
			CodeBlock(() => ({
				js: "const count = 1",
				ts: "const count: number = 1",
			})),
		)
		const screen = render(App)
		const [, tsTab] = screen.findAllByTag("button")

		expect(screen.text()).toContain("const count = 1")
		expect(screen.text()).not.toContain("number")

		tsTab.onclick()
		screen.flush()

		expect(screen.text()).toContain("const count: number = 1")
	})

	test("shares the selected language across code blocks", () => {
		const App = maoka.create(() => () => [
			CodeBlock(() => ({
				key: "a",
				js: "const alpha = 1",
				ts: "const alpha: number = 1",
			})),
			CodeBlock(() => ({
				key: "b",
				js: "const beta = 2",
				ts: "const beta: number = 2",
			})),
		])
		const screen = render(App)
		const [, firstTsTab] = screen.findAllByTag("button")

		firstTsTab.onclick()
		screen.flush()

		expect(screen.text()).toContain("const alpha: number = 1")
		expect(screen.text()).toContain("const beta: number = 2")

		screen.findAllByTag("button")[0].onclick()
		screen.flush()
	})

	test("renders diff line classes without including markers in text", () => {
		const App = maoka.create(() => () =>
			CodeBlock(() => ({
				js: "  +const added = true\n  -const removed = false",
			})),
		)
		const screen = render(App)
		const lines = screen.findAllByTag("span")
		const lineClasses = lines.map(line => line.className).filter(Boolean)

		expect(lineClasses).toContain("code-line is-added")
		expect(lineClasses).toContain("code-line is-removed")
		expect(screen.text()).toContain("const added = true")
		expect(screen.text()).toContain("const removed = false")
		expect(screen.text()).not.toContain("+const added = true")
		expect(screen.text()).not.toContain("-const removed = false")
	})
})
