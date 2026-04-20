import "./style.css"
import maoka from "../../../index.js"
import maokaDom from "../../../dom/index.js"
import { render } from "../../../dom/index.js"
import { CodeDemo } from "../../src/components/code-demo.js"
import {
	DocsArticle,
	DocsLayout,
	DocsPageBoundary,
} from "../../src/components/docs-page.js"
import { NotebookSheet } from "../../src/components/notebook-sheet.js"
import { RainbowCard } from "../../src/components/rainbow-card.js"
import { SiteFooter } from "../../src/components/site-footer.js"
import { ThemeToggle } from "../../src/components/theme-toggle.js"
import { Discounter } from "../../src/examples/discounter.js"
import { Konnichiwa } from "../../src/examples/konnichiwa.js"

const helloExample = `import maoka from "maoka"
import { render } from "maoka/dom"

const Konnichiwa = maoka.html.div(({ props }) => {
	return () => \`こんにちは、\${props().name}\`
})

render(document.body, Konnichiwa(() => ({ name: "真岡" })))`

const helloExampleTs = `import maoka from "maoka"
import { render } from "maoka/dom"

const Konnichiwa = maoka.html.div<{ name: string }>(({ props }) => {
	return () => \`こんにちは、\${props().name}\`
})

render(document.body, Konnichiwa(() => ({ name: "真岡" })))`

const discounterExample = `import maoka from "maoka"
import { render } from "maoka/dom"

const createDigits = (count, place) => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace
			? createDigits(count, nextPlace)
			: []),
		DiscounterDigit(() => ({
			key: place,
			digit: Math.floor(Math.abs(count) / place) % 10,
		})),
	]
}

const DiscounterDigit = maoka.html.div(({ props }) => {
	return () => props().digit
})

const DiscounterButton = maoka.html.button(({ props, use, value }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	value.onclick = () => props().decrement()

	return () => "−"
})

const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const decrement = () => {
		count--
		refresh$()
	}

	return () => [
		DiscounterButton(() => ({ key: "decrement", decrement })),
		...createDigits(count, 1),
	]
})

render(document.body, Discounter())`

const discounterExampleTs = `import maoka from "maoka"
import { render } from "maoka/dom"
import { type Maoka } from "maoka"

const createDigits = (count: number, place: number): Maoka.Component[] => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace
			? createDigits(count, nextPlace)
			: []),
		DiscounterDigit(() => ({
			key: place,
			digit: Math.floor(Math.abs(count) / place) % 10,
		})),
	]
}

const DiscounterDigit = maoka.html.div<{ digit: number }>(({ props }) => {
	return () => props().digit
})

const DiscounterButton = maoka.html.button<{ decrement: () => void }>(
	({ props, use, value }) => {
		use(maoka.jabs.attributes.set("type", "button"))
		value.onclick = () => props().decrement()

		return () => "−"
	},
)

const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const decrement = () => {
		count--
		refresh$()
	}

	return () => [
		DiscounterButton(() => ({ key: "decrement", decrement })),
		...createDigits(count, 1),
	]
})

render(document.body, Discounter())`

const runtimeFeatures = [
	{
		slot: "is-pos-1",
		tilt: "is-tilt-left",
		title: "Renderer-agnostic components",
		highlight:
			"rendered by the DOM adapter, the test adapter, or a custom renderer",
		body: "Components create Maoka nodes, not DOM nodes. The same component can be rendered by the DOM adapter, the test adapter, or a custom renderer without changing the component itself.",
	},
	{
		slot: "is-pos-2",
		tilt: "is-tilt-right",
		title: "Creation and render are separate",
		body: "The component definition runs once. It may return a render function when the component needs output; otherwise the component can stay create-only. State, lifecycle handlers, and behavior are captured during creation.",
	},
	{
		slot: "is-pos-3",
		tilt: "is-tilt-soft-left",
		title: "Pure nodes diff their props",
		highlight: "Maoka reuses its node and updates its props source.",
		body: "When a child keeps the same key and component type, Maoka reuses its node and updates its props source. props() detects changed values and queues refresh without remounting.",
	},
	{
		slot: "is-pos-4",
		tilt: "is-tilt-soft-right",
		title: "Children reconcile by identity",
		body: "Rendered children are matched by key when a key exists, or by position otherwise. Matching nodes stay mounted while Maoka moves, inserts, or removes renderer values.",
	},
	{
		slot: "is-pos-5",
		tilt: "is-tilt-left",
		title: "Jabs are direct hooks",
		highlight: "use(jab) runs the jab immediately with the component params.",
		body: "use(jab) runs the jab immediately with the component params. A jab captures the state and lifecycle behavior it creates instead of leaving hidden cleanup work behind.",
	},
	{
		slot: "is-pos-6",
		tilt: "is-tilt-right",
		title: "Tests run without a browser",
		body: "The test renderer builds an in-memory tree, so components and jabs can be tested without jsdom or a browser while keeping lifecycle, props diffing, and reconciliation behavior intact.",
	},
]

const Page = maoka.create(() =>
	() =>
		DocsLayout(() => ({
			children: DocsArticle(() => ({
				className: "demo-page",
				children: [
					PageHeader(),
					CodeDemo(() => ({
						compact: true,
						js: helloExample,
						ts: helloExampleTs,
						preview: [Konnichiwa(() => ({ name: "真岡" }))],
					})),
					ExampleSection(),
					Philosophy(),
					InstallCta(),
					Features(),
					ApiCta(),
					SiteFooter(),
				],
			})),
		})),
)

const LandingTitle = maoka.html.h1(() => () => "Maoka")

const CoreConceptsTitle = maoka.html.h2(() => () => "Core Concepts")

const ExampleSectionTitle = maoka.html.h2(
	() => () => "The Infamous Counter Example",
)

const ApiCtaTitle = maoka.html.h2(() => () => "See the API surface")

const ApiCtaBody = maoka.html.p(
	() => () =>
		"Types, renderers, test tools, lifecycle hooks, and the exact places where the weirdness becomes useful.",
)

const InstallTitle = maoka.html.h2(() => () => "Install")

const InstallBody = maoka.html.p(
	() => () =>
		"Maoka is written in JavaScript and ships with types included, so you can hop onto the adventure right away.",
)

const PhilosophyLineTitle = maoka.html.h3(({ props }) => () => props().text)

const PhilosophyLineBody = maoka.html.p(({ props }) => () => props().text)

const PhilosophyLineText = maoka.html.div(({ props }) => () => [
	PhilosophyLineTitle(() => ({ text: props().title })),
	PhilosophyLineBody(() => ({ text: props().body })),
])

const PhilosophyLines = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("philosophy-lines"))

	return () => props().children
})

const InstallCommandLabel = maoka.html.span(({ props }) => () => props().text)

const Philosophy = maoka.html.section(({ use }) => {
	use(maoka.jabs.classes.set("landing-section", "philosophy-section"))

	return () => [
		SectionEyebrow(() => ({ text: "Philosophy" })),
		CoreConceptsTitle(),
		PhilosophyLines(() => ({
			children: [
				PhilosophyLine(() => ({
					index: "01",
					title: "Creating is separate from being",
					body: "Maoka components are split into two phases. Genesis - the create phase - defines the destiny of the component: its potential, limits, and powers. Emanation - the render phase - shifts the component's presence within the reality it inhabits, forcing it to adapt under the capabilities genesis provides.",
				})),
				PhilosophyLine(() => ({
					index: "02",
					title: "Extension is pervasive",
					body: "Maoka lets components use jabs to share creation traits. Unlike other schools of thought, Maoka promotes radical responsibility in its complete and holistic form. Every jab should be treated like a gene, affecting genesis and emanation in their totality.",
				})),
				PhilosophyLine(() => ({
					index: "03",
					title: "Lifecycle is fatal",
					body: "Lifecycle is defined at the moment of creation, as emanation is only a photograph of life in the eyes of the beholder. Any attempt to outsmart destiny may wake the grim God of infinite loops. Consider yourself warned.",
				})),
				PhilosophyLine(() => ({
					index: "04",
					title: "Value is the body, Node is the soul",
					body: "Most of the time, working really hard does not make you a billionaire. In the same way, Maoka components do not become billionaires if they were destined to be divs. This perpetual binding happens in the Nodes that Maoka components create. You can't reach them, you can't prove they are there, but no matter what body they are rendered as, they live within the lifelines the Creator predefines.",
				})),
			],
		})),
	]
})

const ExampleSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.classes.set("landing-section", "example-section"))

	return () => [
		SectionEyebrow(() => ({ text: "Maoka by Example" })),
		ExampleSectionTitle(),
		ExampleLead(),
		CodeDemo(() => ({
			js: discounterExample,
			ts: discounterExampleTs,
			preview: [Discounter()],
		})),
	]
})

const PhilosophyLine = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("philosophy-line"))

	return () => [
		PhilosophyIndex(() => ({ text: props().index })),
		PhilosophyLineText(() => ({
			title: props().title,
			body: props().body,
		})),
	]
})

const InstallCta = maoka.html.section(({ lifecycle, refresh$, use }) => {
	const command = "npm i maoka"
	let toastVisible = false
	let toastTimeout = null

	use(maoka.jabs.setId("install"))
	use(maoka.jabs.classes.set("landing-section", "install-section"))

	const showToast = () => {
		toastVisible = true
		refresh$()

		if (toastTimeout) clearTimeout(toastTimeout)

		toastTimeout = setTimeout(() => {
			toastVisible = false
			toastTimeout = null
			refresh$()
		}, 3000)
	}

	lifecycle.beforeUnmount(() => {
		if (toastTimeout) clearTimeout(toastTimeout)
	})

	return () => [
		InstallCopy(),
		InstallAction(() => ({ command, showToast, toastVisible })),
	]
})

const InstallCommand = maoka.html.button(({ props, use }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	use(maoka.jabs.classes.set("install-command"))
	use(maoka.jabs.aria.set("label", "Copy install command"))
	use(
		maokaDom.jabs.ifInDOM(({ value, lifecycle }) => {
			const doc = value.ownerDocument
			const win = doc?.defaultView

			if (!doc || !win) return

			const browser = {
				document: doc,
				window: win,
			}
			const sync = () => {
				value.onclick = async () => {
					await copyText(browser, props().command)
					props().showToast()
				}
			}

			sync()
			lifecycle.beforeRefresh(() => {
				sync()

				return false
			})
		}),
	)

	return () => [InstallCommandLabel(() => ({ text: props().command }))]
})

const InstallToast = maoka.html.div(({ use }) => {
	use(maoka.jabs.classes.set("install-toast"))
	use(maoka.jabs.attributes.set("role", "status"))
	use(maoka.jabs.aria.set("live", "polite"))

	return () => "Copied. So lazy of you!"
})

const copyText = async (dom, text) => {
	if (dom?.window.navigator?.clipboard?.writeText) {
		try {
			await dom.window.navigator.clipboard.writeText(text)
			return
		} catch {}
	}

	if (!dom) return

	const textarea = dom.document.createElement("textarea")

	textarea.value = text
	textarea.setAttribute("readonly", "")
	textarea.style.position = "fixed"
	textarea.style.opacity = "0"
	dom.document.body.append(textarea)
	textarea.select()
	dom.document.execCommand("copy")
	textarea.remove()
}

const Features = maoka.html.section(({ use }) => {
	use(maoka.jabs.classes.set("landing-section", "features-section"))

	return () => [
		NotebookSheet(() => ({
			variant: "note",
			className: "feature-stage",
			children: [
				FeaturesEyebrow(),
				FeaturesTitle(),
				FeatureGrid(),
			],
		})),
	]
})

const ApiCta = maoka.html.section(({ use }) => {
	use(maoka.jabs.classes.set("landing-section", "api-callout"))

	return () => [
		SectionEyebrow(() => ({ text: "Next transmission" })),
		ApiCtaTitle(),
		ApiCtaBody(),
		CtaLink(() => ({
			href: "/api",
			icon: "api",
			label: "Open API docs",
		})),
	]
})

const Feature = maoka.create(({ props }) => {
	return () =>
		RainbowCard(() => ({
			className: ["feature-card", props().slot, props().tilt].filter(Boolean).join(" "),
			children: [
				FeatureCardTitle(() => ({ text: props().title })),
				FeatureBody(() => ({
					body: props().body,
					highlight: props().highlight,
				})),
			],
		}))
})

const FeatureBody = maoka.html.p(({ props }) => {
	return () => {
		const { body, highlight } = props()
		const parts = body.split(highlight)

		if (parts.length < 2) return body

		return [
			parts[0],
			FeatureHighlight(() => ({ text: highlight })),
			parts.slice(1).join(highlight),
		]
	}
})

const FeatureHighlight = maoka.html.mark(({ props, use }) => {
	use(maoka.jabs.classes.set("feature-highlight"))

	return () => props().text
})

const CtaLink = maoka.html.a(({ props, use }) => {
	use(maoka.jabs.attributes.assign("href", () => props().href))
	use(
		maoka.jabs.classes.assign(() =>
			props().secondary ? "cta-link is-secondary" : "cta-link",
		),
	)

	return () => {
		return [
			CtaIcon(() => ({ icon: props().icon })),
			CtaLabel(() => ({ text: props().label })),
		]
	}
})

const CtaIcon = maoka.svg.svg(({ props, use }) => {
	use(maoka.jabs.aria.set("hidden", "true"))
	use(maoka.jabs.classes.set("cta-icon"))
	use(maoka.jabs.attributes.set("fill", "none"))
	use(maoka.jabs.attributes.set("viewBox", "0 0 64 64"))

	return () => (props().icon === "pacifier" ? PacifierCatIcon() : ApiCatIcon())
})

const PacifierCatIcon = () => [
	...CatFace(),
	SvgCircle(() => ({
		className: "cat-face-calm",
		cx: "32",
		cy: "43",
		fill: "currentColor",
		r: "2.6",
		strokeWidth: "0",
	})),
	SvgPath(() => ({
		className: "cat-face-calm",
		d: "M25 43C25 38.5 39 38.5 39 43S25 47.5 25 43ZM32 45.5V48",
		strokeWidth: "2.4",
	})),
]

const ApiCatIcon = () => [
	...CatFace(),
	SvgPath(() => ({
		className: "cat-face-calm",
		d: "M28 37C30 39 34 39 36 37",
		strokeWidth: "1.7",
	})),
	SvgPath(() => ({
		className: "cat-face-calm",
		d: "M18 43C22 41 27 41.5 32 44V55C27 52.5 22 52 18 54Z",
		fill: "var(--cta-icon-fill)",
		strokeWidth: "2.2",
	})),
	SvgPath(() => ({
		className: "cat-face-calm",
		d: "M32 44C37 41.5 42 41 46 43V54C42 52 37 52.5 32 55Z",
		fill: "var(--cta-icon-fill)",
		strokeWidth: "2.2",
	})),
	SvgPath(() => ({
		className: "cat-face-calm",
		d: "M32 44V55M23 46.5H28M36 46.5H41",
		strokeWidth: "1.5",
	})),
]

const CatFace = () => [
	SvgPath(() => ({
		d: "M18 28C16.5 22 15.5 14 20 12.5 25 13.2 30 18 32 18S39 13.2 44 12.5C48.5 14 47.5 22 46 28 50 37 45 50 32 50S14 37 18 28Z",
		fill: "var(--cta-icon-fill)",
	})),
	SvgPath(() => ({
		d: "M23 32C24.5 29.8 27.5 29.8 29 32M35 32C36.5 29.8 39.5 29.8 41 32",
		className: "cat-face-calm",
		strokeWidth: "2",
	})),
	SvgCircle(() => ({
		className: "cat-face-calm",
		cx: "32",
		cy: "35.5",
		fill: "currentColor",
		r: "1.6",
		strokeWidth: "0",
	})),
	SvgCircle(() => ({
		className: "cat-face-scared",
		cx: "25",
		cy: "32",
		r: "4",
		strokeWidth: "2",
	})),
	SvgCircle(() => ({
		className: "cat-face-scared",
		cx: "39",
		cy: "32",
		r: "4",
		strokeWidth: "2",
	})),
	SvgCircle(() => ({
		className: "cat-face-scared",
		cx: "27",
		cy: "32",
		fill: "currentColor",
		r: "1.6",
		strokeWidth: "0",
	})),
	SvgCircle(() => ({
		className: "cat-face-scared",
		cx: "41",
		cy: "32",
		fill: "currentColor",
		r: "1.6",
		strokeWidth: "0",
	})),
	SvgCircle(() => ({
		className: "cat-face-scared",
		cx: "33",
		cy: "42",
		r: "3.2",
		strokeWidth: "2",
	})),
]

const SvgPath = maoka.svg.path(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => props().className ?? ""))
	use(maoka.jabs.attributes.assign("d", () => props().d))
	use(maoka.jabs.attributes.assign("fill", () => props().fill ?? "none"))
	use(maoka.jabs.attributes.set("stroke-linecap", "round"))
	use(maoka.jabs.attributes.set("stroke-linejoin", "round"))
	use(
		maoka.jabs.attributes.assign(
			"stroke-width",
			() => props().strokeWidth ?? "2.4",
		),
	)

	return () => {
	}
})

const SvgCircle = maoka.svg.circle(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => props().className ?? ""))
	use(maoka.jabs.attributes.assign("cx", () => props().cx))
	use(maoka.jabs.attributes.assign("cy", () => props().cy))
	use(maoka.jabs.attributes.assign("fill", () => props().fill ?? "none"))
	use(maoka.jabs.attributes.assign("r", () => props().r))
	use(
		maoka.jabs.attributes.assign(
			"stroke-width",
			() => props().strokeWidth ?? "2.4",
		),
	)

	return () => {
	}
})

const HeroEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow"))

	return () => "사할린"
})

const HeroLead = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("lede"))

	return () => "A UI library for on-demand rendering of user interfaces."
})

const HeroActions = maoka.html.div(({ use }) => {
	use(maoka.jabs.classes.set("hero-actions"))

	return () => [
		CtaLink(() => ({
			href: "/api",
			icon: "api",
			label: "Read API",
			secondary: true,
		})),
	]
})

const SectionEyebrow = maoka.html.p(({ props, use }) => {
	use(maoka.jabs.classes.set("eyebrow"))

	return () => props().text
})

const ExampleLead = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("lede", "example-lede"))

	return () => "But it actually discounts."
})

const PhilosophyIndex = maoka.html.span(({ props, use }) => {
	use(maoka.jabs.classes.set("philosophy-index"))

	return () => props().text
})

const InstallCopy = maoka.html.div(({ use }) => {
	use(maoka.jabs.classes.set("install-copy"))

	return () => [
		SectionEyebrow(() => ({ text: "Поехали!" })),
		InstallTitle(),
		InstallBody(),
	]
})

const InstallAction = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("install-action"))

	return () => [
		InstallCommand(() => ({
			command: props().command,
			showToast: props().showToast,
		})),
		props().toastVisible ? InstallToast() : null,
	]
})

const FeaturesEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow", "feature-eyebrow"))

	return () => "Runtime features"
})

const FeaturesTitle = maoka.html.h2(({ use }) => {
	use(maoka.jabs.classes.set("feature-title"))

	return () => "What Maoka actually does"
})

const FeatureGrid = maoka.html.div(({ use }) => {
	use(maoka.jabs.classes.set("feature-grid"))

	return () => runtimeFeatures.map(feature => Feature(() => feature))
})

const FeatureCardTitle = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("feature-card-title"))

	return () => props().text
})

const CtaLabel = maoka.html.span(({ props }) => () => props().text)

const PageHeader = maoka.html.header(({ use }) => {
	use(maoka.jabs.classes.set("demo-header"))

	return () => [
		ThemeToggle(),
		HeroEyebrow(),
		LandingTitle(),
		HeroLead(),
		HeroActions(),
	]
})

render(
	document.body,
	DocsPageBoundary(() => ({
		children: Page(),
	})),
)
