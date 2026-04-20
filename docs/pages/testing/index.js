import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import {
	DocsArticle,
	DocsLayout,
	DocsPageBoundary,
} from "../../src/components/docs-page.js"
import { SiteFooter } from "../../src/components/site-footer.js"
import { ThemeToggle } from "../../src/components/theme-toggle.js"

const componentExample = `import { expect, test } from "bun:test"

import "./style.css"
import maoka from "maoka"
import { render } from "maoka/test"

const IncrementButton = maoka.html.button(({ props, use, value }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	value.onclick = props().onClick

	return () => "+"
})

test("Counter refreshes without DOM", () => {
	let count = 0

	const Count = maoka.html.div(({ props }) => () => \`Count: \${props().count}\`)
	const Counter = maoka.create(({ refresh$ }) => {
		const inc = () => {
			count++
			refresh$()
		}

		return () => [
			Count(() => ({ count }), { key: "count" }),
			IncrementButton(() => ({ onClick: inc }), { key: "inc" }),
		]
	})
	const screen = render(Counter())

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

const IncrementButton = maoka.html.button<{ onClick: () => void }>(
	({ props, use, value }) => {
		use(maoka.jabs.attributes.set("type", "button"))
		value.onclick = props().onClick

		return () => "+"
	},
)

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
			Count(() => ({ count }), { key: "count" }),
			IncrementButton(() => ({ onClick: inc }), { key: "inc" }),
		]
	})
	const screen = render(Counter())

	screen.findByTag("button").onclick()
	screen.flush()

	expect(screen.text()).toBe("Count: 1+")
})`

const jabExample = `import { expect, test } from "bun:test"

import { renderJab } from "maoka/test"

test("useCounter$ exposes state and refreshes", () => {
	let count = 0
	const useCounter$ = ({ lifecycle, props, refresh$ }) => {
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
	const probe = renderJab(useCounter$, {
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

test("useCounter$ exposes state and refreshes", () => {
	let count: number = 0
	const useCounter$ = ({ lifecycle, props, refresh$ }) => {
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
	const probe = renderJab(useCounter$, {
		props: () => ({ label: \`Count: \${count}\` }),
		template: result => result.state.label,
	})

	probe.result().inc()
	probe.flush()

	expect(probe.result().state.refreshes).toBe(1)
	expect(probe.text()).toBe("Count: 1")
})`

const Page = maoka.create(() =>
	() =>
		DocsLayout(() => ({
			children: DocsArticle(() => ({
				children: [
					Hero(),
					Section(() => ({
						id: "overview",
						title: "What the test renderer is for",
						body: "The test renderer runs Maoka against an in-memory tree. It is useful when you want to test component behavior, refresh semantics, keyed children, and jabs without booting a browser or jsdom.",
					})),
					Section(() => ({
						id: "components",
						title: "Component tests",
						body: "Use render(componentInstance) when you want a lightweight screen object. It gives you refresh(), flush(), text(), toJSON(), find(), findAll(), findByTag(), and findAllByTag().",
					})),
					CodeBlock(() => ({ js: componentExample, ts: componentExampleTs })),
					Section(() => ({
						id: "jabs",
						title: "Jab tests",
						body: "Use renderJab(jab, options) when the unit you care about is a jab. The jab still receives real Maoka params, so lifecycle handlers, props(), refresh$(), and use() behave like they do inside a component.",
					})),
					CodeBlock(() => ({ js: jabExample, ts: jabExampleTs })),
					ApiList(),
					SiteFooter(),
				],
			})),
		})),
)

const TestingTitle = maoka.html.h1(
	() => () => "Test components and jabs without a browser",
)

const Hero = maoka.html.header(() => () => [
	ThemeToggle(),
	HeroEyebrow(),
	TestingTitle(),
	HeroLead(),
	HomeLink(),
])

const Section = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))

	return () => [
		SectionTitle(() => ({ text: props().title })),
		SectionBody(() => ({ text: props().body })),
	]
})

const ApiItemsList = maoka.html.ul(({ props }) => () =>
	props().items.map(item => ApiItem(() => item, { key: item.title })),
)

const ApiList = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("api"))

	return () => [
		SectionTitle(() => ({ text: "API cheatsheet" })),
		ApiItemsList(() => ({
			items: [
				{
					title: "render(component, options?)",
					body: "Renders a component instance into a TestValue tree.",
				},
				{
					title: "renderJab(jab, options?)",
					body: "Runs a jab via params.use(jab) inside a probe component and returns its result.",
				},
				{
					title: "screen.flush()",
					body: "Flushes queued refresh work. Useful after calling a handler that used refresh$().",
				},
				{
					title: "screen.toJSON()",
					body: "Serializes the in-memory tree into { tag, text, children } for snapshots or exact assertions.",
				},
			],
		})),
	]
})

const HeroEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow"))

	return () => "Maoka testing"
})

const HeroLead = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("lede"))

	return () =>
		"The test renderer gives Maoka code a tiny in-memory stage: enough surface for behavior tests, no DOM ceremony, and no fake lifecycle model."
})

const HomeLink = maoka.html.a(({ use }) => {
	use(maoka.jabs.attributes.set("href", "/"))
	use(maoka.jabs.classes.set("home-link"))

	return () => "Back to demo"
})

const SectionTitle = maoka.html.h2(({ props }) => () => props().text)

const SectionBody = maoka.html.p(({ props }) => () => props().text)

const ApiItemTitle = maoka.html.strong(({ props }) => () => props().text)

const ApiItemBody = maoka.html.span(({ props }) => () => props().text)

const ApiItem = maoka.html.li(({ props }) => () => [
	ApiItemTitle(() => ({ text: props().title })),
	ApiItemBody(() => ({ text: props().body })),
])

render(
	document.body,
	DocsPageBoundary(() => ({
		children: Page(),
	})),
)
