import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeDemo } from "../../src/components/code-demo.js"
import { DocsNav } from "../../src/components/docs-nav.js"
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

const DiscounterButton = maoka.html.button(({ props, value }) => {
	value.type = "button"
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
	({ props, value }) => {
		value.type = "button"
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

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(({ value }) => {
				value.className = "demo-page"

				return () => [
					maoka.html.header(({ value }) => {
						value.className = "demo-header"

						return () => [
							ThemeToggle(),
							maoka.html.p(({ value }) => {
								value.className = "eyebrow"

								return () => "사할린"
							})(),
							maoka.html.h1(() => () => "Maoka"),
							maoka.html.p(({ value }) => {
								value.className = "lede"

								return () =>
									"A UI library for on-demand rendering of user interfaces."
							})(),
							maoka.html.div(({ value }) => {
								value.className = "hero-actions"

								return () => [
									CtaLink(() => ({
										href: "/api",
										icon: "api",
										label: "Read API",
										secondary: true,
									})),
								]
							})(),
						]
					})(),
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
				]
			})(),
		]
	})(),
])

const Philosophy = maoka.html.section(({ value }) => {
	value.className = "landing-section philosophy-section"

	return () => [
		maoka.html.p(({ value }) => {
			value.className = "eyebrow"

			return () => "Philosophy"
		})(),
		maoka.html.h2(() => () => "Core Concepts"),
		maoka.html.div(({ value }) => {
			value.className = "philosophy-lines"

			return () => [
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
			]
		})(),
	]
})

const ExampleSection = maoka.html.section(({ value }) => {
	value.className = "landing-section example-section"

	return () => [
		maoka.html.p(({ value }) => {
			value.className = "eyebrow"

			return () => "Maoka by Example"
		})(),
		maoka.html.h2(() => () => "The Infamous Counter Example"),
		maoka.html.p(({ value }) => {
			value.className = "lede example-lede"

			return () => "But it actually discounts."
		})(),
		CodeDemo(() => ({
			js: discounterExample,
			ts: discounterExampleTs,
			preview: [Discounter()],
		})),
	]
})

const PhilosophyLine = maoka.html.div(({ props, value }) => {
	value.className = "philosophy-line"

	return () => [
		maoka.html.span(({ value }) => {
			value.className = "philosophy-index"

			return () => props().index
		})(),
		maoka.html.div(() => () => [
			maoka.html.h3(() => () => props().title),
			maoka.html.p(() => () => props().body),
		])(),
	]
})

const InstallCta = maoka.html.section(({ lifecycle, refresh$, value }) => {
	const command = "npm i maoka"
	let toastVisible = false
	let toastTimeout = null

	value.id = "install"
	value.className = "landing-section install-section"

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
		maoka.html.div(({ value }) => {
			value.className = "install-copy"

			return () => [
				maoka.html.p(({ value }) => {
					value.className = "eyebrow"

					return () => "Поехали!"
				})(),
				maoka.html.h2(() => () => "Install"),
				maoka.html.p(
					() => () =>
						"Maoka is written in JavaScript and ships with types included, so you can hop onto the adventure right away.",
				),
			]
		})(),
		maoka.html.div(({ value }) => {
			value.className = "install-action"

			return () => [
				InstallCommand(() => ({ command, showToast })),
				toastVisible ? InstallToast() : null,
			]
		})(),
	]
})

const InstallCommand = maoka.html.button(({ props, value }) => {
	value.type = "button"
	value.className = "install-command"
	value.setAttribute("aria-label", "Copy install command")
	value.onclick = async () => {
		await copyText(props().command)
		props().showToast()
	}

	return () => [maoka.html.span(() => () => props().command)]
})

const InstallToast = maoka.html.div(({ value }) => {
	value.className = "install-toast"
	value.setAttribute("role", "status")
	value.setAttribute("aria-live", "polite")

	return () => "Copied. So lazy of you!"
})

const copyText = async text => {
	if (globalThis.navigator?.clipboard?.writeText) {
		try {
			await globalThis.navigator.clipboard.writeText(text)
			return
		} catch {}
	}

	const textarea = document.createElement("textarea")

	textarea.value = text
	textarea.setAttribute("readonly", "")
	textarea.style.position = "fixed"
	textarea.style.opacity = "0"
	document.body.append(textarea)
	textarea.select()
	document.execCommand("copy")
	textarea.remove()
}

const Features = maoka.html.section(({ value }) => {
	value.className = "landing-section features-section"

	return () => [
		NotebookSheet(() => ({
			variant: "note",
			className: "feature-stage",
			children: [
				maoka.html.p(({ value }) => {
					value.className = "eyebrow feature-eyebrow"

					return () => "Runtime features"
				})(),
				maoka.html.h2(({ value }) => {
					value.className = "feature-title"

					return () => "What Maoka actually does"
				})(),
				maoka.html.div(({ value }) => {
					value.className = "feature-grid"

					return () => runtimeFeatures.map(feature => Feature(() => feature))
				})(),
			],
		})),
	]
})

const ApiCta = maoka.html.section(({ value }) => {
	value.className = "landing-section api-callout"

	return () => [
		maoka.html.p(({ value }) => {
			value.className = "eyebrow"

			return () => "Next transmission"
		})(),
		maoka.html.h2(() => () => "See the API surface"),
		maoka.html.p(
			() => () =>
				"Types, renderers, test tools, lifecycle hooks, and the exact places where the weirdness becomes useful.",
		),
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
				maoka.html.div(({ value }) => {
					value.className = "feature-card-title"

					return () => props().title
				})(),
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

const FeatureHighlight = maoka.html.mark(({ props, value }) => {
	value.className = "feature-highlight"

	return () => props().text
})

const CtaLink = maoka.html.a(({ props, value }) => {
	return () => {
		value.href = props().href
		value.className = props().secondary ? "cta-link is-secondary" : "cta-link"

		return [
			CtaIcon(() => ({ icon: props().icon })),
			maoka.html.span(() => () => props().label)(),
		]
	}
})

const CtaIcon = maoka.svg.svg(({ props, value }) => {
	value.setAttribute("aria-hidden", "true")
	value.setAttribute("class", "cta-icon")
	value.setAttribute("fill", "none")
	value.setAttribute("viewBox", "0 0 64 64")

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

const SvgPath = maoka.svg.path(({ props, value }) => {
	return () => {
		if (props().className) value.setAttribute("class", props().className)
		value.setAttribute("d", props().d)
		value.setAttribute("fill", props().fill ?? "none")
		value.setAttribute("stroke-linecap", "round")
		value.setAttribute("stroke-linejoin", "round")
		value.setAttribute("stroke-width", props().strokeWidth ?? "2.4")
	}
})

const SvgCircle = maoka.svg.circle(({ props, value }) => {
	return () => {
		if (props().className) value.setAttribute("class", props().className)
		value.setAttribute("cx", props().cx)
		value.setAttribute("cy", props().cy)
		value.setAttribute("fill", props().fill ?? "none")
		value.setAttribute("r", props().r)
		value.setAttribute("stroke-width", props().strokeWidth ?? "2.4")
	}
})

render(document.body, Page())
