import { describe, expect, test } from "bun:test"

import maoka from "../../index.js"
import { renderJab } from "../../test/index.js"
import maokaString, { render } from "../index.js"

describe("maoka string renderer", () => {
	test("exposes a default namespace with string guards", () => {
		expect(maokaString.jabs.ifInString).toEqual(expect.any(Function))
		expect(maokaString.guards.isStringNode).toEqual(expect.any(Function))
		expect(maokaString.guards.isStringValue).toEqual(expect.any(Function))
	})

	test("ifInString runs for string renderer values", () => {
		let result
		const Probe = maoka.html.div(({ use }) => {
			result = use(
				maokaString.jabs.ifInString(({ value }) => {
					result = value.tag

					return value.tag
				}),
			)

			return () => "Hello"
		})

		expect(render(Probe())).toBe("<div>Hello</div>")
		expect(result).toBe("div")
	})

	test("ifInString returns undefined for non-string values", () => {
		const probe = renderJab(maokaString.jabs.ifInString(({ value }) => {
			void value

			return "nope"
		}))

		expect(probe.result()).toBe(undefined)
	})

	test("string jabs set and read attributes, data attributes, aria, and id", () => {
		const observed = {}
		const Probe = maoka.html.button(({ use }) => {
			use(maokaString.jabs.setId("hero"))
			use(maokaString.jabs.attributes.set("title", "Launch"))
			use(maokaString.jabs.dataAttributes.set("kind", "primary"))
			use(maokaString.jabs.aria.set("label", "Launch button"))

			observed.id = use(maokaString.jabs.attributes.get("id"))
			observed.title = use(maokaString.jabs.attributes.get("title"))
			observed.kind = use(maokaString.jabs.dataAttributes.get("kind"))
			observed.label = use(maokaString.jabs.aria.get("label"))

			return () => "Launch"
		})

		expect(render(Probe())).toBe(
			'<button id="hero" title="Launch" data-kind="primary" aria-label="Launch button">Launch</button>',
		)
		expect(observed).toEqual({
			id: "hero",
			title: "Launch",
			kind: "primary",
			label: "Launch button",
		})
	})

	test("string class jabs manage classes", () => {
		let hasBeta
		const Probe = maoka.html.div(({ use }) => {
			use(maokaString.jabs.classes.set("alpha"))
			use(maokaString.jabs.classes.add("beta"))
			use(maokaString.jabs.classes.remove("alpha"))
			hasBeta = use(maokaString.jabs.classes.has("beta"))

			return () => "Classy"
		})

		expect(render(Probe())).toBe('<div class="beta">Classy</div>')
		expect(hasBeta).toBe(true)
	})

	test("string classes.set clears class when called without tokens", () => {
		const Probe = maoka.html.div(({ use, value }) => {
			value.className = "alpha beta"
			use(maokaString.jabs.classes.set())

			return () => "Classy"
		})

		expect(render(Probe())).toBe("<div>Classy</div>")
	})

	test("string assign jabs update only when computed values change", () => {
		let title = "Idle"
		let enabled = false
		let renderCalls = 0
		const Probe = maoka.html.div(({ lifecycle, refresh$, use }) => {
			use(maokaString.jabs.attributes.assign("title", () => title))
			use(maokaString.jabs.dataAttributes.assign("state", () => title))
			use(maokaString.jabs.aria.assign("label", () => title))
			use(maokaString.jabs.assignId(() => title.toLowerCase()))
			use(
				maokaString.jabs.classes.assign(() =>
					enabled ? "is-ready is-mounted" : "is-mounted",
				),
			)

			lifecycle.afterMount(() => {
				title = "Ready"
				enabled = true
				refresh$()
			})

			return () => {
				renderCalls++

				return "Assign"
			}
		})

		expect(render(Probe())).toBe(
			'<div title="Ready" data-state="Ready" aria-label="Ready" id="ready" class="is-ready is-mounted">Assign</div>',
		)
		expect(renderCalls).toBe(1)
	})

	test("string attribute assign removes attributes for undefined values", () => {
		let title = "Idle"
		const Probe = maoka.html.div(({ lifecycle, refresh$, use }) => {
			use(maokaString.jabs.attributes.assign("title", () => title))

			lifecycle.afterMount(() => {
				title = undefined
				refresh$()
			})

			return () => "Assign"
		})

		expect(render(Probe())).toBe("<div>Assign</div>")
	})

	test("string class toggle syncs across refreshes", () => {
		let active = false
		const Probe = maoka.html.div(({ lifecycle, refresh$, use }) => {
			use(maokaString.jabs.classes.toggle(() => active, "is-active"))

			lifecycle.afterMount(() => {
				active = true
				refresh$()
			})

			return () => "Toggle"
		})

		expect(render(Probe())).toBe('<div class="is-active">Toggle</div>')
	})

	test("string class jabs reject invalid class tokens", () => {
		const Invalid = maoka.html.div(({ use }) => {
			use(maokaString.jabs.classes.add("not valid"))

			return () => "Invalid"
		})

		expect(() => render(Invalid())).toThrow(
			"Class name must not contain whitespace",
		)
	})

	test("guards rendered string nodes", () => {
		const createValue = tag => ({
			tag: typeof tag === "string" ? tag : tag.tag,
			namespace: typeof tag === "string" ? "html" : tag.namespace,
			text: "",
			children: [],
			parent: null,
			attrs: new Map(),
		})
		const rootValue = createValue("#root")
		const root = {
			key: "root",
			value: rootValue,
			children: [],
			createKey: () => "key-1",
			createValue,
			mountNode: () => {},
			refreshNode: () => {},
			flushRefreshQueue: () => {},
		}
		const parent = {
			key: "parent",
			value: rootValue,
			props: () => ({ key: "parent" }),
			root,
			render: () => root.children,
			lastRenderResult: root.children,
			parent: null,
			children: root.children,
			refresh$: () => {},
			lifecycleHandlers: {
				afterMount: [],
				beforeRefresh: [],
				error: [],
				beforeUnmount: [],
				afterUnmount: [],
			},
			mounted: true,
		}
		const node = maoka.html.div(() => () => "Hello")()(root, parent)

		expect(maokaString.guards.isStringNode(node)).toBe(true)
		expect(maokaString.guards.isStringNode(parent)).toBe(false)
		expect(maokaString.guards.isStringNode(root)).toBe(false)
		expect(maokaString.guards.isStringNode(null)).toBe(false)
	})

	test("guards string renderer values", () => {
		const value = {
			tag: "div",
			namespace: "html",
			text: "",
			children: [],
			parent: null,
			attrs: new Map(),
		}

		expect(maokaString.guards.isStringValue(value)).toBe(true)
		expect(maokaString.guards.isStringValue({ ...value, namespace: "svg" })).toBe(
			true,
		)
		expect(maokaString.guards.isStringValue({ ...value, namespace: "math" })).toBe(
			true,
		)
		expect(maokaString.guards.isStringValue({ ...value, namespace: null })).toBe(
			true,
		)
		expect(maokaString.guards.isStringValue({ ...value, namespace: "x" })).toBe(
			false,
		)
		expect(maokaString.guards.isStringValue({ tag: "div", text: "", children: [], attrs: new Map() })).toBe(false)
		expect(maokaString.guards.isStringValue({ ...value, attrs: {} })).toBe(false)
		expect(maokaString.guards.isStringValue(null)).toBe(false)
	})

	test("renders a simple html component to a string", () => {
		const App = maoka.html.div(() => () => "Hello")

		expect(render(App())).toBe("<div>Hello</div>")
	})

	test("renders mixed text and child components", () => {
		const App = maoka.create(() => () => [
			maoka.html.span(() => () => "Hello")(),
			", Maoka",
		])

		expect(render(App())).toBe("<span>Hello</span>, Maoka")
	})

	test("renders nested implicit create components", () => {
		const Title = maoka.html.h1(({ props }) => () => props().label)
		const Body = maoka.create(({ props }) => () => [
			Title(() => ({ key: "title", label: props().title })),
			props().content,
		])
		const App = maoka.html.article(({ props }) => () =>
			Body(() => ({
				title: props().title,
				content: props().content,
			})),
		)

		expect(
			render(App(() => ({ title: "Greetings", content: "Rendered" }))),
		).toBe("<article><h1>Greetings</h1>Rendered</article>")
	})

	test("serializes supported SSR-safe attributes", () => {
		const App = maoka.html.label(({ value }) => {
			value.className = "field"
			value.htmlFor = "email"
			value.dataset.kind = "primary"
			value.title = `Label "quoted"`

			return () => "Email"
		})

		expect(render(App())).toBe(
			'<label class="field" for="email" data-kind="primary" title="Label &quot;quoted&quot;">Email</label>',
		)
	})

	test("supports string value proxy reads, dataset assignment, and attribute deletion", () => {
		const observed = {}
		const App = maoka.html.label(({ value }) => {
			value.title = "Label"
			value.dataset.kind = "primary"
			observed.title = value.title
			observed.kind = value.dataset.kind
			observed.textContent = value.textContent
			value.dataset = { readyState: "ready" }
			delete value.dataset.kind
			delete value.title

			return () => "Email"
		})

		expect(render(App())).toBe('<label data-ready-state="ready">Email</label>')
		expect(observed).toEqual({
			title: "Label",
			kind: "primary",
			textContent: "",
		})
	})

	test("serializes boolean attributes and omits falsey ones", () => {
		const App = maoka.html.input(({ value }) => {
			value.type = "checkbox"
			value.checked = true
			value.disabled = false
			value.placeholder = undefined

			return () => null
		})

		expect(render(App())).toBe('<input type="checkbox" checked>')
	})

	test("ignores functions and object values while keeping primitive attrs", () => {
		const App = maoka.html.button(({ value }) => {
			value.type = "button"
			value.onclick = () => {}
			value.style = { color: "red" }
			value.role = "button"

			return () => "Push"
		})

		expect(render(App())).toBe('<button type="button" role="button">Push</button>')
	})

	test("escapes text and attribute values", () => {
		const App = maoka.html.div(({ value }) => {
			value.title = `A&B "quoted"`

			return () => `<unsafe & text>`
		})

		expect(render(App())).toBe(
			'<div title="A&amp;B &quot;quoted&quot;">&lt;unsafe &amp; text&gt;</div>',
		)
	})

	test("serializes svg and math components", () => {
		const App = maoka.create(() => () => [
			maoka.svg.svg(() => () => maoka.svg.circle(() => () => "")())(),
			maoka.math.math(() => () => maoka.math.mfrac(() => () => "")())(),
		])

		expect(render(App())).toBe("<svg><circle></circle></svg><math><mfrac></mfrac></math>")
	})

	test("resolves plain string tags for svg, math, and custom elements", () => {
		const PlainSvg = maoka.pure("svg", () => () => maoka.pure("circle", () => () => "")())
		const PlainMath = maoka.pure("math", () => () => maoka.pure("mfrac", () => () => "")())
		const Custom = maoka.pure("fancy-box", () => () => "Hi")
		const App = maoka.create(() => () => [PlainSvg(), PlainMath(), Custom()])

		expect(render(App())).toBe(
			"<svg><circle></circle></svg><math><mfrac></mfrac></math><fancy-box>Hi</fancy-box>",
		)
	})

	test("reorders and removes keyed string children", () => {
		let items = ["a", "b", "c"]
		const Row = maoka.html.span(({ props }) => () => props().id)
		const App = maoka.create(({ lifecycle, refresh$ }) => {
			lifecycle.afterMount(() => {
				items = ["c", "a"]
				refresh$()
			})

			return () => items.map(id => Row(() => ({ key: id, id })))
		})

		expect(render(App())).toBe("<span>c</span><span>a</span>")
	})

	test("updates string output after a synchronous refresh queued during mount", () => {
		let label = "Idle"
		const calls = []
		const App = maoka.html.div(({ lifecycle, refresh$ }) => {
			lifecycle.afterMount(() => {
				calls.push("afterMount")
				label = "Ready"
				refresh$()
			})

			return () => label
		})

		expect(render(App())).toBe("<div>Ready</div>")
		expect(calls).toEqual(["afterMount"])
	})

	test("throws when render receives a blueprint", () => {
		const App = maoka.html.div(() => () => "Direct")

		expect(() => render(App)).toThrow(
			"render expects a component instance; call the blueprint first",
		)
	})
})
