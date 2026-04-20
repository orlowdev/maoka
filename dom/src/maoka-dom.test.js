import { afterEach, describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import { renderJab } from "../../test/index.js"
import maokaDom, { render } from "../index.js"

const originalRequestAnimationFrame = globalThis.requestAnimationFrame
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame
const originalElement = globalThis.Element
const originalHTMLElement = globalThis.HTMLElement

afterEach(() => {
	globalThis.requestAnimationFrame = originalRequestAnimationFrame
	globalThis.cancelAnimationFrame = originalCancelAnimationFrame
	globalThis.Element = originalElement
	globalThis.HTMLElement = originalHTMLElement
})

class FakeDocument {
	createElement(tag) {
		return new FakeHTMLElement(this, tag, "html")
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
		this._attrs = new Map()
		this._setAttributeCalls = 0
		this._removeAttributeCalls = 0
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

	get className() {
		return this.getAttribute("class") ?? ""
	}

	set className(className) {
		this.setAttribute("class", className)
	}

	get id() {
		return this.getAttribute("id") ?? ""
	}

	set id(id) {
		this.setAttribute("id", id)
	}

	getAttribute(name) {
		return this._attrs.get(name) ?? null
	}

	setAttribute(name, value) {
		this._setAttributeCalls++
		this._attrs.set(name, String(value))
	}

	removeAttribute(name) {
		this._removeAttributeCalls++
		this._attrs.delete(name)
	}

	hasAttribute(name) {
		return this._attrs.has(name)
	}

	appendChild(child) {
		this.insertBefore(child, null)

		return child
	}

	insertBefore(child, before) {
		if (child === this || isAncestorOf(child, this)) {
			throw new DOMException(
				"Node.insertBefore: The new child is an ancestor of the parent",
			)
		}

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

class FakeHTMLElement extends FakeElement {}

class FakeText {
	constructor(ownerDocument, textContent) {
		this.ownerDocument = ownerDocument
		this.parentNode = null
		this.nodeType = 3
		this.textContent = textContent
	}
}

const createContainer = () => new FakeDocument().createElement("main")

const isAncestorOf = (ancestor, child) => {
	let parent = child.parentNode

	while (parent) {
		if (parent === ancestor) return true

		parent = parent.parentNode
	}

	return false
}

describe("maokaDom.render", () => {
	test("exposes a dom node guard", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		const App = maoka.html.button(() => () => "Hello")
		const root = render(container, App())
		const node = root.children[0]

		expect(maokaDom.guards.isDomNode(node)).toBe(true)
		expect(maokaDom.guards.isDomNode(node.parent)).toBe(true)
		expect(maokaDom.guards.isDomNode(root)).toBe(false)
		expect(maokaDom.guards.isDomNode({ value: { nodeType: 1 } })).toBe(false)
	})

	test("exposes a dom value guard", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		const root = render(container, maoka.html.button(() => () => "Hello")())
		const node = root.children[0]

		expect(maokaDom.guards.isDomValue(node.value)).toBe(true)
		expect(maokaDom.guards.isDomValue(container)).toBe(true)
		expect(maokaDom.guards.isDomValue(root)).toBe(false)
		expect(maokaDom.guards.isDomValue({ nodeType: 1 })).toBe(false)
	})

	test("ifInDOM runs for any DOM element", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const seenTags = []
		const HtmlProbe = maoka.html.button(({ use }) => {
			use(
				maokaDom.jabs.ifInDOM(({ value }) => {
					seenTags.push(value.tagName)
				}),
			)

			return () => "HTML"
		})
		const SvgProbe = maoka.svg.circle(({ use }) => {
			use(
				maokaDom.jabs.ifInDOM(({ value }) => {
					seenTags.push(value.tagName)
				}),
			)

			return () => ""
		})

		render(createContainer(), HtmlProbe())
		render(createContainer(), SvgProbe())

		expect(seenTags).toEqual(["button", "circle"])
	})

	test("ifInDOM returns the callback result", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		let result
		const Probe = maoka.html.button(({ use }) => {
			result = use(maokaDom.jabs.ifInDOM(({ value }) => value.tagName))

			return () => "HTML"
		})

		render(container, Probe())

		expect(result).toBe("button")
	})

	test("ifInDOM is safe outside browser globals", () => {
		globalThis.Element = undefined
		globalThis.HTMLElement = undefined

		let called = false
		const probe = renderJab(
			maokaDom.jabs.ifInDOM(() => {
				called = true
			}),
		)

		expect(probe.result()).toBe(undefined)
		expect(called).toBe(false)
	})

	test("dom jabs set and read attributes, data attributes, aria, and id", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		const observed = {}
		const Probe = maoka.html.button(({ use }) => {
			use(maokaDom.jabs.setId("hero"))
			use(maokaDom.jabs.attributes.set("title", "Launch"))
			use(maokaDom.jabs.dataAttributes.set("kind", "primary"))
			use(maokaDom.jabs.aria.set("label", "Launch button"))

			observed.id = use(maokaDom.jabs.attributes.get("id"))
			observed.title = use(maokaDom.jabs.attributes.get("title"))
			observed.kind = use(maokaDom.jabs.dataAttributes.get("kind"))
			observed.label = use(maokaDom.jabs.aria.get("label"))

			return () => "Launch"
		})

		render(container, Probe())

		const button = container.children[0]

		expect(button.getAttribute("id")).toBe("hero")
		expect(button.getAttribute("title")).toBe("Launch")
		expect(button.getAttribute("data-kind")).toBe("primary")
		expect(button.getAttribute("aria-label")).toBe("Launch button")
		expect(observed).toEqual({
			id: "hero",
			title: "Launch",
			kind: "primary",
			label: "Launch button",
		})
	})

	test("dom class jabs manage classes", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		let hasBeta
		const Probe = maoka.html.div(({ use }) => {
			use(maokaDom.jabs.classes.set("alpha"))
			use(maokaDom.jabs.classes.add("beta"))
			use(maokaDom.jabs.classes.remove("alpha"))
			hasBeta = use(maokaDom.jabs.classes.has("beta"))

			return () => "Classy"
		})

		render(container, Probe())

		expect(container.children[0].getAttribute("class")).toBe("beta")
		expect(hasBeta).toBe(true)
	})

	test("dom classes.set clears class when called without tokens", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		const Probe = maoka.html.div(({ use, value }) => {
			value.setAttribute("class", "alpha beta")
			use(maokaDom.jabs.classes.set())

			return () => "Classy"
		})

		render(container, Probe())

		expect(container.children[0].hasAttribute("class")).toBe(false)
	})

	test("dom assign jabs update only when computed values change", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		let title = "Idle"
		let enabled = false
		let refresh
		let renderCalls = 0
		const Probe = maoka.html.div(({ refresh$, use }) => {
			refresh = refresh$
			use(maokaDom.jabs.attributes.assign("title", () => title))
			use(maokaDom.jabs.dataAttributes.assign("state", () => title))
			use(maokaDom.jabs.aria.assign("label", () => title))
			use(maokaDom.jabs.assignId(() => title.toLowerCase()))
			use(
				maokaDom.jabs.classes.assign(() =>
					enabled ? "is-ready is-mounted" : "is-mounted",
				),
			)

			return () => {
				renderCalls++

				return "Assign"
			}
		})
		const root = render(container, Probe())
		const node = root.children[0]

		expect(node.value.getAttribute("title")).toBe("Idle")
		expect(node.value.getAttribute("data-state")).toBe("Idle")
		expect(node.value.getAttribute("aria-label")).toBe("Idle")
		expect(node.value.getAttribute("id")).toBe("idle")
		expect(node.value.getAttribute("class")).toBe("is-mounted")

		const initialSetCalls = node.value._setAttributeCalls
		const initialRemoveCalls = node.value._removeAttributeCalls
		const initialRenderCalls = renderCalls

		refresh()
		root.flushRefreshQueue()

		expect(node.value._setAttributeCalls).toBe(initialSetCalls)
		expect(node.value._removeAttributeCalls).toBe(initialRemoveCalls)
		expect(renderCalls).toBe(initialRenderCalls)

		title = "Ready"
		enabled = true
		refresh()
		root.flushRefreshQueue()

		expect(node.value.getAttribute("title")).toBe("Ready")
		expect(node.value.getAttribute("data-state")).toBe("Ready")
		expect(node.value.getAttribute("aria-label")).toBe("Ready")
		expect(node.value.getAttribute("id")).toBe("ready")
		expect(node.value.getAttribute("class")).toBe("is-ready is-mounted")
		expect(node.value._setAttributeCalls).toBeGreaterThan(initialSetCalls)
		expect(renderCalls).toBe(initialRenderCalls)
	})

	test("dom attribute assign removes attributes for undefined values", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		let title = "Idle"
		let refresh
		const Probe = maoka.html.div(({ refresh$, use }) => {
			refresh = refresh$
			use(maokaDom.jabs.attributes.assign("title", () => title))

			return () => "Assign"
		})
		const root = render(container, Probe())
		const node = root.children[0]

		expect(node.value.getAttribute("title")).toBe("Idle")

		title = undefined
		refresh()
		root.flushRefreshQueue()

		expect(node.value.getAttribute("title")).toBe(null)
		expect(node.value._removeAttributeCalls).toBeGreaterThan(0)
	})

	test("dom class toggle syncs across refreshes", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		let active = false
		let refresh
		const Probe = maoka.html.div(({ refresh$, use }) => {
			refresh = refresh$
			use(maokaDom.jabs.classes.toggle(() => active, "is-active"))

			return () => "Toggle"
		})
		const root = render(container, Probe())
		const node = root.children[0]

		expect(node.value.getAttribute("class")).toBe(null)

		active = true
		refresh()
		root.flushRefreshQueue()
		expect(node.value.getAttribute("class")).toBe("is-active")

		active = false
		refresh()
		root.flushRefreshQueue()
		expect(node.value.getAttribute("class")).toBe(null)
	})

	test("dom class jabs reject invalid class tokens", () => {
		globalThis.Element = FakeElement
		globalThis.HTMLElement = FakeHTMLElement

		const container = createContainer()
		const Invalid = maoka.html.div(({ use }) => {
			use(maokaDom.jabs.classes.add("not valid"))

			return () => "Invalid"
		})

		expect(() => render(container, Invalid())).toThrow(
			"Class name must not contain whitespace",
		)
	})

	test("renders component templates into a DOM container", () => {
		const container = createContainer()
		const Counter = maoka.create(() => () => [
			maoka.html.a(() => () => "Testing"),
			maoka.html.button(() => () => "Count: 0"),
			maoka.svg.a(() => () => ""),
			maoka.svg.circle(() => () => ""),
			maoka.math.mfrac(() => () => ""),
		])

		render(container, Counter())

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
		expect(container.children[2].namespaceURI).toBe(
			"http://www.w3.org/2000/svg",
		)
		expect(container.children[3].namespaceURI).toBe(
			"http://www.w3.org/2000/svg",
		)
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
		globalThis.cancelAnimationFrame = frameId =>
			void canceledFrames.push(frameId)

		const container = createContainer()
		let count = 0
		let inc
		const Count = maoka.html.button(
			({ props }) =>
				() =>
					`Count: ${props().count}`,
		)
		const Inc = maoka.html.button(({ value, lifecycle }) => {
			value.onclick = () => inc()
			lifecycle.beforeRefresh(() => {})

			return () => "+"
		})
		const Counter = maoka.create(({ refresh$ }) => {
			inc = () => {
				count++
				refresh$()
			}

			return () => [Count(() => ({ count })), Inc()]
		})

		render(container, Counter())

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

	test("falls back to microtasks when requestAnimationFrame is unavailable", async () => {
		globalThis.requestAnimationFrame = undefined
		globalThis.cancelAnimationFrame = undefined

		const container = createContainer()
		let count = 0
		let refresh
		const Count = maoka.html.output(({ props }) => {
			return () => `Count: ${props().count}`
		})
		const Counter = maoka.create(params => {
			refresh = params.refresh$

			return () => Count(() => ({ count }))
		})

		render(container, Counter())

		expect(container.children[0].textContent).toBe("Count: 0")

		count = 1
		refresh()
		await Promise.resolve()

		expect(container.children[0].textContent).toBe("Count: 1")
	})

	test("allows refreshing through the synthetic root parent", () => {
		const scheduledFrames = []

		globalThis.requestAnimationFrame = flush => {
			scheduledFrames.push(flush)

			return scheduledFrames.length
		}
		globalThis.cancelAnimationFrame = () => {}

		const container = createContainer()
		let count = 0
		const Count = maoka.html.output(({ props }) => () => `Count: ${props().count}`)
		const App = maoka.create(() => () => Count(() => ({ count })))
		const root = render(container, App())

		expect(root.children[0].parent.props()).toEqual({})
		expect(root.children[0].parent.render()).toBe(root.children)

		count = 1
		root.children[0].parent.refresh$()

		expect(scheduledFrames).toHaveLength(1)
		expect(() => scheduledFrames[0]()).not.toThrow()
		expect(container.children).toHaveLength(1)
		expect(container.children[0].tagName).toBe("output")
		expect(container.children[0].textContent).toBe("Count: 1")
		expect(container.textContent).toBe("")
	})

	test("creates svg and math elements from plain string tags", () => {
		const container = createContainer()
		const SvgCircle = maoka.pure("circle", () => () => "")
		const MathFraction = maoka.pure("mfrac", () => () => "")
		const HtmlLink = maoka.pure("a", () => () => "")
		const App = maoka.create(() => () => [SvgCircle(), MathFraction()])

		render(container, App())

		expect(container.children[0].tagName).toBe("circle")
		expect(container.children[0].namespaceURI).toBe(
			"http://www.w3.org/2000/svg",
		)
		expect(container.children[1].tagName).toBe("mfrac")
		expect(container.children[1].namespaceURI).toBe(
			"http://www.w3.org/1998/Math/MathML",
		)

		const linkContainer = createContainer()

		render(linkContainer, HtmlLink())
		expect(linkContainer.children[0].tagName).toBe("a")
		expect(linkContainer.children[0].namespaceURI).toBe("html")
	})

	test("keeps surrounding sibling order when an implicit child refreshes", () => {
		const scheduledFrames = []

		globalThis.requestAnimationFrame = flush => {
			scheduledFrames.push(flush)

			return scheduledFrames.length
		}
		globalThis.cancelAnimationFrame = () => {}

		const container = createContainer()
		const Title = maoka.html.h3(() => () => "Add Todo")
		const Input = maoka.html.input(({ props, value }) => {
			return () => {
				value.value = props().value
				value.oninput = event => props().onInput(event.currentTarget.value)

				return null
			}
		})
		const Form = maoka.html.div(
			({ props }) =>
				() =>
					Input(() => ({
						value: props().value,
						onInput: props().onInput,
					})),
		)
		const EditableForm = maoka.create(({ refresh$ }) => {
			let draft = ""

			return () =>
				Form(() => ({
					value: draft,
					onInput: value => {
						draft = value
						refresh$()
					},
				}))
		})
		const Note = maoka.html.p(() => () => "Type to preview")
		const Section = maoka.html.section(() => () => [
			Title(),
			EditableForm(),
			Note(),
		])
		const App = maoka.create(() => () => Section())

		render(container, App())

		const section = container.children[0]
		const title = section.children[0]
		const form = section.children[1]
		const note = section.children[2]
		const input = form.children[0]
		const originalInsertBefore = form.insertBefore.bind(form)
		let reinserts = 0

		form.insertBefore = (child, before) => {
			reinserts++

			return originalInsertBefore(child, before)
		}

		expect(section.children.map(child => child.tagName)).toEqual([
			"h3",
			"div",
			"p",
		])

		input.oninput({ currentTarget: { value: "a" } })
		scheduledFrames[0]()

		expect(section.children).toEqual([title, form, note])
		expect(section.children.map(child => child.tagName)).toEqual([
			"h3",
			"div",
			"p",
		])
		expect(form.children[0]).toBe(input)
		expect(form.children[0].value).toBe("a")
		expect(reinserts).toBe(0)
	})

	test("keeps ancestor sibling order when an implicit nested child appears", () => {
		const scheduledFrames = []

		globalThis.requestAnimationFrame = flush => {
			scheduledFrames.push(flush)

			return scheduledFrames.length
		}
		globalThis.cancelAnimationFrame = () => {}

		const container = createContainer()
		let showDetails = false
		let refresh
		const Title = maoka.html.h2(() => () => "Orders")
		const Summary = maoka.html.output(() => () => "Summary")
		const Details = maoka.html.output(() => () => "Details")
		const Nested = maoka.create(({ props }) => () =>
			props().showDetails ? Details() : null,
		)
		const Wrapper = maoka.create(({ props }) => () =>
			Nested(() => ({ showDetails: props().showDetails })),
		)
		const App = maoka.create(params => {
			refresh = params.refresh$

			return () => [
				Title(),
				Wrapper(() => ({ showDetails })),
				Summary(),
			]
		})

		render(container, App())

		expect(container.children.map(child => child.textContent)).toEqual([
			"Orders",
			"Summary",
		])

		showDetails = true
		refresh()
		scheduledFrames[0]()

		expect(container.children.map(child => child.textContent)).toEqual([
			"Orders",
			"Details",
			"Summary",
		])
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
		const Row = maoka.html.div(({ props }) => () => {
			const { id, label } = props()

			renderCounts.set(id, (renderCounts.get(id) ?? 0) + 1)

			return label
		})
		const List = maoka.create(({ refresh$ }) => {
			refresh = refresh$

			return () =>
				items.map(item =>
					Row(
						() => ({ id: item.id, label: item.label }),
						{ key: item.id },
					),
				)
		})

		render(container, List())

		const [a, b, c] = container.children

		expect(container.children.map(child => child.textContent)).toEqual([
			"A",
			"B",
			"C",
		])
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
		const Label = maoka.html.div(
			({ props }) =>
				() =>
					props().label,
		)
		const Example = maoka.create(({ refresh$, lifecycle }) => {
			refresh = refresh$
			lifecycle.beforeRefresh(() => true)

			return () => [
				Label(() => ({ label: "A" }), { key: "a" }),
				visible ? Label(() => ({ label: "B" }), { key: "b" }) : undefined,
				Label(() => ({ label: "C" }), { key: "c" }),
			]
		})

		render(container, Example())

		const [a, c] = container.children

		expect(container.textContent).toBe("")
		expect(container.children.map(child => child.textContent)).toEqual([
			"A",
			"C",
		])

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

		render(container, App())

		expect(container.childNodes).toHaveLength(2)
		expect(container.childNodes[0].tagName).toBe("span")
		expect(container.childNodes[0].textContent).toBe("Hello")
		expect(container.childNodes[1].nodeType).toBe(3)
		expect(container.childNodes[1].textContent).toBe(", Maoka")
	})

	test("renders nested create components without inserting parent DOM nodes into themselves", () => {
		const container = createContainer()
		const Hero = maoka.html.header(() => () => "Hero")
		const Section = maoka.html.section(() => () => "Section")
		const Page = maoka.create(() => () => [
			maoka.html.main(() => () => [
				maoka.create(() => () => [Hero(), Section()])(),
			])(),
		])

		expect(() => render(container, Page())).not.toThrow()
		expect(container.children.map(child => child.tagName)).toEqual(["main"])
		expect(container.children[0].children.map(child => child.tagName)).toEqual([
			"header",
			"section",
		])
	})

	test("renders top-level direct component instances into the container", () => {
		const container = createContainer()
		const App = maoka.html.div(() => () => "Direct")

		render(container, App())

		expect(container.children).toHaveLength(1)
		expect(container.children[0].tagName).toBe("div")
		expect(container.children[0].textContent).toBe("Direct")
	})

	test("throws when render receives a blueprint", () => {
		const container = createContainer()
		const App = maoka.html.div(() => () => "Direct")

		expect(() => render(container, App)).toThrow(
			"render expects a component instance; call the blueprint first",
		)
	})
})
