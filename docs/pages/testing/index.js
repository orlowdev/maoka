import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import { DocsNav } from "../../src/components/docs-nav.js"

const componentExample = `import { expect, test } from "bun:test"

import "./style.css"
import maoka from "maoka"
import { render } from "maoka/test"

test("Counter refreshes without DOM", () => {
	let count = 0

	const Count = maoka.html.div(({ props }) => () => \`Count: \${props().count}\`)
	const Counter = maoka.create(({ refresh$ }) => {
		const inc = () => {
			count++
			refresh$()
		}

		return () => [
			Count(() => ({ key: "count", count })),
			maoka.html.button(({ value }) => {
				value.onclick = inc

				return () => "+"
			})(() => ({ key: "inc" })),
		]
	})
	const screen = render(Counter)

	screen.findByTag("button").onclick()
	screen.flush()

	expect(screen.text()).toBe("Count: 1+")
	expect(screen.toJSON()).toEqual({
		tag: "root",
		children: [
			{ tag: "div", text: "Count: 1" },
			{ tag: "button", text: "+" },
		],
	})
})`

const componentExampleTs = `import { expect, test } from "bun:test"

import "./style.css"
import maoka from "maoka"
import { render } from "maoka/test"

test("Counter refreshes without DOM", () => {
	let count: number = 0

	const Count = maoka.html.div<{ count: number }>(
		({ props }) => () => \`Count: \${props().count}\`,
	)
	const Counter = maoka.create(({ refresh$ }) => {
		const inc = (): void => {
			count++
			refresh$()
		}

		return () => [
			Count(() => ({ key: "count", count })),
			maoka.html.button(({ value }) => {
				value.onclick = inc

				return () => "+"
			})(() => ({ key: "inc" })),
		]
	})
	const screen = render(Counter)

	screen.findByTag("button").onclick()
	screen.flush()

	expect(screen.text()).toBe("Count: 1+")
})`

const jabExample = `import { expect, test } from "bun:test"

import { renderJab } from "maoka/test"

test("useCounter exposes state and refreshes", () => {
	let count = 0
	const useCounter = ({ lifecycle, props, refresh$ }) => {
		const state = {
			refreshes: 0,
			get label() {
				return props().label
			},
		}

		lifecycle.beforeRefresh(() => {
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
	const probe = renderJab(useCounter, {
		props: () => ({ label: \`Count: \${count}\` }),
		template: result => result.state.label,
	})

	probe.result().inc()
	probe.flush()

	expect(probe.result().state.refreshes).toBe(1)
	expect(probe.result().state.label).toBe("Count: 1")
	expect(probe.text()).toBe("Count: 1")
})`

const jabExampleTs = `import { expect, test } from "bun:test"

import { renderJab } from "maoka/test"

test("useCounter exposes state and refreshes", () => {
	let count: number = 0
	const useCounter = ({ lifecycle, props, refresh$ }) => {
		const state = {
			refreshes: 0,
			get label(): string {
				return props().label
			},
		}

		lifecycle.beforeRefresh((): boolean => {
			state.refreshes++

			return true
		})

		return {
			state,
			inc: (): void => {
				count++
				refresh$()
			},
		}
	}
	const probe = renderJab(useCounter, {
		props: () => ({ label: \`Count: \${count}\` }),
		template: result => result.state.label,
	})

	probe.result().inc()
	probe.flush()

	expect(probe.result().state.refreshes).toBe(1)
	expect(probe.text()).toBe("Count: 1")
})`

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(() => () => [
				Hero(),
				Section(() => ({
					id: "overview",
					title: "What the test renderer is for",
					body: "The test renderer runs Maoka against an in-memory tree. It is useful when you want to test component behavior, refresh semantics, keyed children, and jabs without booting a browser or jsdom.",
				})),
				Section(() => ({
					id: "components",
					title: "Component tests",
					body: "Use render(component) when you want a lightweight screen object. It gives you refresh(), flush(), text(), toJSON(), find(), findAll(), findByTag(), and findAllByTag().",
				})),
				CodeBlock(() => ({ js: componentExample, ts: componentExampleTs })),
				Section(() => ({
					id: "jabs",
					title: "Jab tests",
					body: "Use renderJab(jab, options) when the unit you care about is a jab. The jab still receives real Maoka params, so lifecycle handlers, props(), refresh$(), and use() behave like they do inside a component.",
				})),
				CodeBlock(() => ({ js: jabExample, ts: jabExampleTs })),
				ApiList(),
			]),
		]
	})(),
])

const Hero = maoka.html.header(() => () => [
	maoka.html.p(({ value }) => {
		value.className = "eyebrow"

		return () => "Maoka testing"
	})(),
	maoka.html.h1(() => () => "Test components and jabs without a browser"),
	maoka.html.p(({ value }) => {
		value.className = "lede"

		return () =>
			"The test renderer gives Maoka code a tiny in-memory stage: enough surface for behavior tests, no DOM ceremony, and no fake lifecycle model."
	})(),
	maoka.html.a(({ value }) => {
		value.href = "/"
		value.className = "home-link"

		return () => "Back to demo"
	})(),
])

const Section = maoka.html.section(({ props, value }) => {
	value.id = props().id

	return () => [
		maoka.html.h2(() => () => props().title),
		maoka.html.p(() => () => props().body),
	]
})

const ApiList = maoka.html.section(({ value }) => {
	value.id = "api"

	return () => [
		maoka.html.h2(() => () => "API cheatsheet"),
		maoka.html.ul(() => () => [
			ApiItem(() => ({
				title: "render(component, options?)",
				body: "Renders a Blueprint or InitializedComponent into a TestValue tree.",
			})),
			ApiItem(() => ({
				title: "renderJab(jab, options?)",
				body: "Runs a jab via params.use(jab) inside a probe component and returns its result.",
			})),
			ApiItem(() => ({
				title: "screen.flush()",
				body: "Flushes queued refresh work. Useful after calling a handler that used refresh$().",
			})),
			ApiItem(() => ({
				title: "screen.toJSON()",
				body: "Serializes the in-memory tree into { tag, text, children } for snapshots or exact assertions.",
			})),
		]),
	]
})

const ApiItem = maoka.html.li(({ props }) => () => [
	maoka.html.strong(() => () => props().title),
	maoka.html.span(() => () => props().body),
])

render(document.body, Page())
