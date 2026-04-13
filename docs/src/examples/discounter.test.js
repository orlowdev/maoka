import { describe, expect, test } from "bun:test"

import { render } from "../../../test/index.js"
import { Discounter } from "./discounter.js"

describe("Discounter", () => {
	test("does not refresh unchanged higher digit counters", () => {
		const screen = render(Discounter)
		const button = screen.findByTag("button")

		for (let click = 0; click < 10; click++) button.onclick()
		screen.flush()

		const tens = screen.findAllByTag("div")[0]

		expect(tens.text).toBe("1")

		button.onclick()
		screen.flush()

		expect(screen.findAllByTag("div")[0]).toBe(tens)
	})
})
