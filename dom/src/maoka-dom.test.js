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

	createTextNode(textContent) {
		return new FakeText(this, textContent)
	}
}

class FakeElement {
	constructor(ownerDocument, tagName, namespaceURI) {
		this.ownerDocument = ownerDocument
		this.tagName = tagName
		this.namespaceURI = namespaceURI
		this.childNodes = []
		this.parentNode = null
		this.nodeType = 1
		this._textContent = ""
	}

	get children() {
		return this.childNodes.filter(child => child.nodeType === 1)
	}

	get textContent() {
		return this._textContent
	}

	set textContent(textContent) {
		for (const child of this.childNodes) {
			child.parentNode = null
		}

		this.childNodes = []
		this._textContent = textContent
	}

	appendChild(child) {
		this.insertBefore(child, null)

		return child
	}

	insertBefore(child, before) {
		if (child.parentNode) child.parentNode.removeChild(child)

		const index = before ? this.childNodes.indexOf(before) : -1

		if (index === -1) {
			this.childNodes.push(child)
		} else {
			this.childNodes.splice(index, 0, child)
		}

		child.parentNode = this

		return child
	}

	removeChild(child) {
		this.childNodes = this.childNodes.filter(candidate => candidate !== child)
		child.parentNode = null

		return child
	}
}

class FakeText {
	constructor(ownerDocument, textContent) {
		this.ownerDocument = ownerDocument
		this.parentNode = null
		this.nodeType = 3
		this.textContent = textContent
	}
}

const createContainer = () => new FakeDocument().createElement("main")

describe("maokaDom.render", () => {
	test("renders component templates into a DOM container", () => {
		const container = createContainer()
		const Counter = maoka.create(() => () => [
			maoka.html.a(() => () => "Testing"),
			maoka.html.button(() => () => "Count: 0"),
			maoka.svg.a(() => () => ""),
			maoka.svg.circle(() => () => ""),
			maoka.math.mfrac(() => () => ""),
		])

		render(container, Counter)

		expect(container.children.map(child => child.tagName)).toEqual([
			"a",
			"button",
			"a",
			"circle",
			"mfrac",
		])
		expect(container.children[0].namespaceURI).toBe("html")
		expect(container.children[0].textContent).toBe("Testing")
		expect(container.children[1].textContent).toBe("Count: 0")
		expect(container.children[2].namespaceURI).toBe("http://www.w3.org/2000/svg")
		expect(container.children[3].namespaceURI).toBe("http://www.w3.org/2000/svg")
		expect(container.children[4].namespaceURI).toBe(
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

	test("diffs keyed children by moving, removing, and inserting DOM nodes", () => {
		const scheduledFrames = []

		globalThis.requestAnimationFrame = flush => {
			scheduledFrames.push(flush)

			return scheduledFrames.length
		}
		globalThis.cancelAnimationFrame = () => {}

		const container = createContainer()
		const renderCounts = new Map()
		let items = [
			{ id: "a", label: "A" },
			{ id: "b", label: "B" },
			{ id: "c", label: "C" },
		]
		let refresh
		const Row = maoka.html.div(({ props$ }) => () => {
			const { id, label } = props$()

			renderCounts.set(id, (renderCounts.get(id) ?? 0) + 1)

			return label
		})
		const List = maoka.create(({ refresh$ }) => {
			refresh = refresh$

			return () =>
				items.map(item =>
					Row(() => ({ key: item.id, id: item.id, label: item.label })),
				)
		})

		render(container, List)

		const [a, b, c] = container.children

		expect(container.children.map(child => child.textContent)).toEqual(["A", "B", "C"])
		expect(renderCounts).toEqual(
			new Map([
				["a", 1],
				["b", 1],
				["c", 1],
			]),
		)

		items = [
			{ id: "c", label: "C" },
			{ id: "a", label: "A" },
			{ id: "b", label: "B" },
		]
		refresh()
		scheduledFrames.shift()()

		expect(container.children).toEqual([c, a, b])
		expect(renderCounts).toEqual(
			new Map([
				["a", 1],
				["b", 1],
				["c", 1],
			]),
		)

		items = [
			{ id: "c", label: "C" },
			{ id: "a", label: "A" },
		]
		refresh()
		scheduledFrames.shift()()

		expect(container.children).toEqual([c, a])
		expect(b.parentNode).toBe(null)
		expect(renderCounts).toEqual(
			new Map([
				["a", 1],
				["b", 1],
				["c", 1],
			]),
		)

		items = [
			{ id: "c", label: "C" },
			{ id: "d", label: "D" },
			{ id: "a", label: "A" },
		]
		refresh()
		scheduledFrames.shift()()

		const d = container.children[1]

		expect(container.children).toEqual([c, d, a])
		expect(d).not.toBe(a)
		expect(d).not.toBe(b)
		expect(d).not.toBe(c)
		expect(d.textContent).toBe("D")
		expect(renderCounts).toEqual(
			new Map([
				["a", 1],
				["b", 1],
				["c", 1],
				["d", 1],
			]),
		)
	})

	test("ignores empty conditional children in component lists", () => {
		const scheduledFrames = []

		globalThis.requestAnimationFrame = flush => {
			scheduledFrames.push(flush)

			return scheduledFrames.length
		}
		globalThis.cancelAnimationFrame = () => {}

		const container = createContainer()
		let visible = false
		let refresh
		const Label = maoka.html.div(({ props$ }) => () => props$().label)
		const Example = maoka.create(({ refresh$, lifecycle }) => {
			refresh = refresh$
			lifecycle.onRefresh(() => true)

			return () => [
				Label(() => ({ key: "a", label: "A" })),
				visible ? Label(() => ({ key: "b", label: "B" })) : undefined,
				Label(() => ({ key: "c", label: "C" })),
			]
		})

		render(container, Example)

		const [a, c] = container.children

		expect(container.textContent).toBe("")
		expect(container.children.map(child => child.textContent)).toEqual(["A", "C"])

		visible = true
		refresh()
		scheduledFrames.shift()()

		const b = container.children[1]

		expect(container.children).toEqual([a, b, c])
		expect(container.children.map(child => child.textContent)).toEqual([
			"A",
			"B",
			"C",
		])
	})

	test("renders mixed component and text children as DOM child nodes", () => {
		const container = createContainer()
		const App = maoka.create(() => () => [
			maoka.html.span(() => () => "Hello")(),
			", Maoka",
		])

		render(container, App)

		expect(container.childNodes).toHaveLength(2)
		expect(container.childNodes[0].tagName).toBe("span")
		expect(container.childNodes[0].textContent).toBe("Hello")
		expect(container.childNodes[1].nodeType).toBe(3)
		expect(container.childNodes[1].textContent).toBe(", Maoka")
	})
})
