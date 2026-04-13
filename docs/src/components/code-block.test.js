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
})
