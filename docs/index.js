import maoka from "../index.js"
import { render } from "../dom/index.js"
import { CodeDemo } from "./src/components/code-demo.js"
import { DocsNav } from "./src/components/docs-nav.js"
import { Konnichiwa } from "./src/examples/konnichiwa.js"

const helloExample = `import maoka from "maoka"
import { render } from "maoka/dom"

const Konnichiwa = maoka.html.div(({ props$ }) => {
	return () => \`こんにちは、\${props$().name}\`
})

render(document.body, Konnichiwa(() => ({ name: "真岡" })))`

const helloExampleTs = `import maoka from "maoka"
import { render } from "maoka/dom"

const Konnichiwa = maoka.html.div<{ name: string }>(({ props$ }) => {
	return () => \`こんにちは、\${props$().name}\`
})

render(document.body, Konnichiwa(() => ({ name: "真岡" })))`

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
										href: "/getting-started.html",
										icon: "pacifier",
										label: "Start building",
									})),
									CtaLink(() => ({
										href: "/api.html",
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
						preview: [
							Konnichiwa(() => ({ name: "真岡" })),
						],
					})),
					Philosophy(),
					InstallCta(),
					KillerFeatures(),
					ApiCta(),
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
		maoka.html.h2(() => () => "The way"),
		maoka.html.div(({ value }) => {
			value.className = "philosophy-lines"

			return () => [
				PhilosophyLine(() => ({
					index: "01",
					title: "A view may be declared, but change must be invited.",
					body:
						"The tree is a statement of shape. Updating it is a conscious act: a signal that the old statement has become insufficient.",
				})),
				PhilosophyLine(() => ({
					index: "02",
					title: "Behavior grows beside the component, not inside its shadow.",
					body:
						"Effects, policies, and derived state should have room to attach horizontally, without turning the component into a corridor of hidden obligations.",
				})),
				PhilosophyLine(() => ({
					index: "03",
					title: "Lifecycle is not an afterthought.",
					body:
						"To react to change, refusal, and failure is not outside the life of a component. It is the life of the component.",
				})),
				PhilosophyLine(() => ({
					index: "04",
					title: "Rendering is the trace, not the source.",
					body:
						"What appears on screen is only one possible footprint of the model. The important thing is the shape of intent before it becomes pixels.",
				})),
			]
		})(),
	]
})

const PhilosophyLine = maoka.html.div(({ props$, value }) => {
	value.className = "philosophy-line"

	return () => [
		maoka.html.span(({ value }) => {
			value.className = "philosophy-index"

			return () => props$().index
		})(),
		maoka.html.div(() => () => [
			maoka.html.h3(() => () => props$().title),
			maoka.html.p(() => () => props$().body),
		])(),
	]
})

const InstallCta = maoka.html.section(({ value }) => {
	value.className = "landing-section install-section"

	return () => [
		maoka.html.div(({ value }) => {
			value.className = "install-copy"

			return () => [
				maoka.html.p(({ value }) => {
					value.className = "eyebrow"

					return () => "Install"
				})(),
				maoka.html.h2(() => () => "Drop it into a Bun project"),
			]
		})(),
		maoka.html.div(({ value }) => {
			value.className = "install-command"

			return () => [
				maoka.html.span(() => () => "bun i maoka"),
			]
		})(),
	]
})

const KillerFeatures = maoka.html.section(({ value }) => {
	value.className = "landing-section"

	return () => [
		maoka.html.p(({ value }) => {
			value.className = "eyebrow"

			return () => "Killer features"
		})(),
		maoka.html.h2(() => () => "Small surface, sharp edges"),
		maoka.html.div(({ value }) => {
			value.className = "feature-grid"

			return () => [
				Feature(() => ({
					title: "Two-phase components",
					body:
						"Definitions run once. Render functions rerun when refresh says the node should update.",
				})),
				Feature(() => ({
					title: "Keyed child diffing",
					body:
						"Move, add, and remove children without remounting the whole list just because order changed.",
				})),
				Feature(() => ({
					title: "Renderer-agnostic root",
					body:
						"The root queues refreshes and asks the renderer what to do, so DOM and tests share the same model.",
				})),
				Feature(() => ({
					title: "Jabs as behavior layers",
					body:
						"use() lets behavior grow sideways: lifecycle, refresh, and derived state can live outside the component body.",
				})),
			]
		})(),
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
		maoka.html.p(() => () =>
			"Types, renderers, test tools, lifecycle hooks, and the exact places where the weirdness becomes useful.",
		),
		CtaLink(() => ({
			href: "/api.html",
			icon: "api",
			label: "Open API docs",
		})),
	]
})

const Feature = maoka.html.article(({ props$, value }) => {
	value.className = "feature-card"

	return () => [
		maoka.html.h3(() => () => props$().title),
		maoka.html.p(() => () => props$().body),
	]
})

const CtaLink = maoka.html.a(({ props$, value }) => {
	return () => {
		value.href = props$().href
		value.className = props$().secondary ? "cta-link is-secondary" : "cta-link"

		return [
			CtaIcon(() => ({ icon: props$().icon })),
			maoka.html.span(() => () => props$().label)(),
		]
	}
})

const CtaIcon = maoka.svg.svg(({ props$, value }) => {
	value.setAttribute("aria-hidden", "true")
	value.setAttribute("class", "cta-icon")
	value.setAttribute("fill", "none")
	value.setAttribute("viewBox", "0 0 64 64")

	return () =>
		props$().icon === "pacifier" ? PacifierCatIcon() : ApiCatIcon()
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
		strokeWidth: "2.2",
	})),
	SvgPath(() => ({
		className: "cat-face-calm",
		d: "M32 44C37 41.5 42 41 46 43V54C42 52 37 52.5 32 55Z",
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

const SvgPath = maoka.svg.path(({ props$, value }) => {
	return () => {
		if (props$().className) value.setAttribute("class", props$().className)
		value.setAttribute("d", props$().d)
		value.setAttribute("fill", props$().fill ?? "none")
		value.setAttribute("stroke-linecap", "round")
		value.setAttribute("stroke-linejoin", "round")
		value.setAttribute("stroke-width", props$().strokeWidth ?? "2.4")
	}
})

const SvgCircle = maoka.svg.circle(({ props$, value }) => {
	return () => {
		if (props$().className) value.setAttribute("class", props$().className)
		value.setAttribute("cx", props$().cx)
		value.setAttribute("cy", props$().cy)
		value.setAttribute("fill", props$().fill ?? "none")
		value.setAttribute("r", props$().r)
		value.setAttribute("stroke-width", props$().strokeWidth ?? "2.4")
	}
})

render(document.body, Page())
