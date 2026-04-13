import { afterEach, describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import { render } from "../index.js"

const originalRequestAnimationFrame = globalThis.requestAnimationFrame
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame

afterEach(() => {
	globalThis.requestAnimationFrame = originalRequestAnimationFrame
	globalThis.cancelAnimationFrame = originalCancelAnimationFrame
})

class FakeDocument {
	createElement(tag) {
		return new FakeElement(this, tag, "html")
	}

	createElementNS(namespaceURI, tag) {
		return new FakeElement(this, tag, namespaceURI)
	}
}

class FakeElement {
	constructor(ownerDocument, tagName, namespaceURI) {
		this.ownerDocument = ownerDocument
		this.tagName = tagName
		this.namespaceURI = namespaceURI
		this.children = []
		this.parentNode = null
		this._textContent = ""
	}

	get textContent() {
		return this._textContent
	}

	set textContent(textContent) {
		for (const child of this.children) {
			child.parentNode = null
		}

		this.children = []
		this._textContent = textContent
	}

	appendChild(child) {
		this.children.push(child)
		child.parentNode = this

		return child
	}

	removeChild(child) {
		this.children = this.children.filter(candidate => candidate !== child)
		child.parentNode = null

		return child
	}
}

const createContainer = () => new FakeDocument().createElement("main")

describe("maokaDom.render", () => {
	test("renders component templates into a DOM container", () => {
		const container = createContainer()
		const Counter = maoka.create(() => () => [
			maoka.html.button(() => () => "Count: 0"),
			maoka.svg.circle(() => () => ""),
			maoka.math.mfrac(() => () => ""),
		])

		render(container, Counter)

		expect(container.children.map(child => child.tagName)).toEqual([
			"button",
			"circle",
			"mfrac",
		])
		expect(container.children[0].textContent).toBe("Count: 0")
		expect(container.children[1].namespaceURI).toBe("http://www.w3.org/2000/svg")
		expect(container.children[2].namespaceURI).toBe(
			"http://www.w3.org/1998/Math/MathML",
		)
	})

	test("uses animation frame scheduling and refreshes children without remounting", () => {
		const scheduledFrames = []
		const canceledFrames = []

		globalThis.requestAnimationFrame = flush => {
			scheduledFrames.push(flush)

			return scheduledFrames.length
		}
		globalThis.cancelAnimationFrame = frameId => void canceledFrames.push(frameId)

		const container = createContainer()
		let count = 0
		let inc
		const Count = maoka.html.button(({ props$ }) => () => `Count: ${props$().count}`)
		const Inc = maoka.html.button(({ value, lifecycle }) => {
			value.onclick = () => inc()
			lifecycle.onRefresh(() => {})

			return () => "+"
		})
		const Counter = maoka.create(({ refresh$ }) => {
			inc = () => {
				count++
				refresh$()
			}

			return () => [
				Count(() => ({ count })),
				Inc(),
			]
		})

		render(container, Counter)

		const countButton = container.children[0]
		const incButton = container.children[1]

		expect(countButton.textContent).toBe("Count: 0")
		expect(incButton.textContent).toBe("+")

		incButton.onclick()
		incButton.onclick()

		expect(scheduledFrames).toHaveLength(1)
		expect(countButton.textContent).toBe("Count: 0")

		scheduledFrames[0]()

		expect(container.children[0]).toBe(countButton)
		expect(container.children[1]).toBe(incButton)
		expect(countButton.textContent).toBe("Count: 2")
		expect(incButton.textContent).toBe("+")
		expect(canceledFrames).toEqual([1])
	})
})
