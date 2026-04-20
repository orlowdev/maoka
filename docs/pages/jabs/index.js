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

const noRefreshExample = `const StableBadge = maoka.html.span(({ use }) => {
	use(maoka.jabs.noRefresh)

	return () => "Ready"
})`

const noRefreshExampleTs = `const StableBadge = maoka.html.span(({ use }) => {
	use(maoka.jabs.noRefresh)

	return (): string => "Ready"
})`

const shouldComponentRefreshExample = `const Price = maoka.html.span(({ props, use }) => {
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)

	return () => \`$\${props().value}\`
})`

const shouldComponentRefreshExampleTs = `const Price = maoka.html.span<{ value: number }>(({ props, use }) => {
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)

	return (): string => \`$\${props().value}\`
})`

const errorBoundaryExample = `const ProfileBoundary = maoka.html.section(({ refresh$, use }) => {
	let errorMessage = ""

	use(
		maoka.jabs.errorBoundary(error => {
			errorMessage = error.message
			refresh$()
		}),
	)

	return () => {
		if (errorMessage) return \`Profile failed: \${errorMessage}\`

		return Profile()
	}
})`

const errorBoundaryExampleTs = `import { type Maoka } from "maoka"

const ProfileBoundary = maoka.html.section(({ refresh$, use }) => {
	let errorMessage: string = ""

	use(
		maoka.jabs.errorBoundary((error: Error): void => {
			errorMessage = error.message
			refresh$()
		}),
	)

	return (): Maoka.Template => {
		if (errorMessage) return \`Profile failed: \${errorMessage}\`

		return Profile()
	}
})`

const attributesExample = `const Notice = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.setId("notice"))
	use(maoka.jabs.attributes.assign("title", () => props().title))
	use(maoka.jabs.dataAttributes.assign("kind", () => props().kind))
	use(maoka.jabs.aria.assign("label", () => props().title))

	return () => props().title
})`

const attributesExampleTs = `const Notice = maoka.html.section<{
	title: string
	kind: "info" | "warning"
}>(({ props, use }) => {
	use(maoka.jabs.setId("notice"))
	use(maoka.jabs.attributes.assign("title", () => props().title))
	use(maoka.jabs.dataAttributes.assign("kind", () => props().kind))
	use(maoka.jabs.aria.assign("label", () => props().title))

	return (): string => props().title
})`

const classesExample = `const Badge = maoka.html.span(({ props, use }) => {
	use(maoka.jabs.classes.set("badge"))
	use(
		maoka.jabs.classes.assign(() =>
			props().active ? "badge is-active" : "badge",
		),
	)

	return () => props().label
})`

const classesExampleTs = `const Badge = maoka.html.span<{
	active: boolean
	label: string
}>(({ props, use }) => {
	use(maoka.jabs.classes.set("badge"))
	use(
		maoka.jabs.classes.assign(() =>
			props().active ? "badge is-active" : "badge",
		),
	)

	return (): string => props().label
})`

const ifInDomExample = `import maokaDom from "maoka/dom"

const FocusInput = maoka.html.input(({ lifecycle, use }) => {
	use(maoka.jabs.attributes.set("type", "text"))

	const input = use(maokaDom.jabs.ifInDOM(({ value }) => value))

	lifecycle.afterMount(() => {
		input?.focus()
	})
})`

const ifInDomExampleTs = `import maokaDom from "maoka/dom"

const FocusInput = maoka.html.input(({ lifecycle, use }) => {
	use(maoka.jabs.attributes.set("type", "text"))

	const input = use(maokaDom.jabs.ifInDOM<HTMLInputElement>(({ value }) => value))

	lifecycle.afterMount(() => {
		input?.focus()
	})
})`

const ifInStringExample = `import maokaString from "maoka/string"

const TagProbe = maoka.html.div(({ use }) => {
	const tag = use(
		maokaString.jabs.ifInString(({ value }) => value.tag),
	)

	return () => tag ?? "no string renderer"
})`

const ifInStringExampleTs = `import maokaString from "maoka/string"

const TagProbe = maoka.html.div(({ use }) => {
	const tag = use(
		maokaString.jabs.ifInString(({ value }) => value.tag),
	)

	return (): string => tag ?? "no string renderer"
})`

const ifInTestExample = `import maokaTest, { renderJab } from "maoka/test"

const probe = renderJab(
	maokaTest.jabs.ifInTest(({ value }) => value.tag),
)

probe.result() // "root"`

const ifInTestExampleTs = `import maokaTest, { renderJab } from "maoka/test"

const probe = renderJab(
	maokaTest.jabs.ifInTest(({ value }) => value.tag),
)

const tag: string | undefined = probe.result()`

const customJabExample = `const withMountLog =
	label =>
	({ lifecycle }) => {
		lifecycle.afterMount(() => {
			console.info(\`\${label} mounted\`)

			return () => console.info(\`\${label} will unmount\`)
		})
	}

const Panel = maoka.html.section(({ use }) => {
	use(withMountLog("Panel"))

	return () => "Panel"
})`

const customJabExampleTs = `import { type Maoka } from "maoka"

const withMountLog =
	(label: string): Maoka.Jab =>
	({ lifecycle }) => {
		lifecycle.afterMount(() => {
			console.info(\`\${label} mounted\`)

			return () => console.info(\`\${label} will unmount\`)
		})
	}

const Panel = maoka.html.section(({ use }) => {
	use(withMountLog("Panel"))

	return (): string => "Panel"
})`

const Page = maoka.create(() =>
	() =>
		DocsLayout(() => ({
			children: DocsArticle(() => ({
				children: [
					Hero(),
					Section(() => ({
						id: "overview",
						title: "Behavior beside components",
						body: "Jabs are small functions that run through params.use(jab). They receive the same params as the component, so lifecycle hooks, props(), refresh$(), and nested use() calls stay available without moving policy into the render function.",
					})),
					Section(() => ({
						id: "no-refresh",
						title: "noRefresh",
						body: "noRefresh registers a beforeRefresh handler that always returns false. Use it when a component performs setup but its rendered output should not change after creation.",
						code: {
							js: noRefreshExample,
							ts: noRefreshExampleTs,
						},
					})),
					Section(() => ({
						id: "should-component-update",
						title: "shouldComponentRefresh",
						body: "shouldComponentRefresh stores the previous props and calls your comparator on refresh. Return true when the component should render with the next props; return false when the old output can stay in place.",
						code: {
							js: shouldComponentRefreshExample,
							ts: shouldComponentRefreshExampleTs,
						},
					})),
					Section(() => ({
						id: "error-boundary",
						title: "errorBoundary",
						body: "errorBoundary handles errors that bubble from descendants without their own onError handler. It receives the original Error, marks the descendant error as handled, and stops the bubble at this component.",
						code: {
							js: errorBoundaryExample,
							ts: errorBoundaryExampleTs,
						},
					})),
					Section(() => ({
						id: "shared-attributes",
						title: "maoka.jabs.attributes, dataAttributes, aria, setId, assignId",
						body: "The shared attribute-oriented jabs compose the renderer-specific DOM, string, and test implementations for you. Use them when you want declarative ids, ARIA, data attributes, or generic attributes without dropping into renderer-specific guards.",
						code: {
							js: attributesExample,
							ts: attributesExampleTs,
						},
					})),
					Section(() => ({
						id: "shared-classes",
						title: "maoka.jabs.classes",
						body: "The shared class jabs expose set, add, remove, has, toggle, and assign with the same renderer-agnostic entry point. They are the right default for declarative class work in components and docs UI code.",
						code: {
							js: classesExample,
							ts: classesExampleTs,
						},
					})),
					Section(() => ({
						id: "if-in-dom",
						title: "maokaDom.jabs.ifInDOM",
						body: "ifInDOM only runs its callback when the current renderer value is a real DOM element. Use it for imperative browser-only work like focus, measurements, or native DOM APIs.",
						code: {
							js: ifInDomExample,
							ts: ifInDomExampleTs,
						},
					})),
					Section(() => ({
						id: "if-in-string",
						title: "maokaString.jabs.ifInString",
						body: "ifInString only runs when the current renderer value is the internal string-renderer value shape. Use it when a jab or component needs string-renderer-specific inspection without affecting DOM or test renderers.",
						code: {
							js: ifInStringExample,
							ts: ifInStringExampleTs,
						},
					})),
					Section(() => ({
						id: "if-in-test",
						title: "maokaTest.jabs.ifInTest",
						body: "ifInTest only runs when the current renderer value is the in-memory test value shape. It is useful for behavior probes and test-only helpers that should stay inert outside the test renderer.",
						code: {
							js: ifInTestExample,
							ts: ifInTestExampleTs,
						},
					})),
					Section(() => ({
						id: "custom-jabs",
						title: "Custom jabs",
						body: "A custom jab is just a function from component params to whatever you need. Return state, register lifecycle hooks, wrap refresh policy, or compose other jabs through params.use().",
						code: {
							js: customJabExample,
							ts: customJabExampleTs,
						},
					})),
					SiteFooter(),
				],
			})),
		})),
)

const JabsTitle = maoka.html.h1(() => () => "Jabs")

const Hero = maoka.html.header(() => () => [
	ThemeToggle(),
	HeroEyebrow(),
	JabsTitle(),
	HeroLead(),
])

const Section = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))

	return () => [
		SectionTitle(() => ({ text: props().title })),
		SectionBody(() => ({ text: props().body })),
		props().code
			? CodeBlock(() => ({
					js: props().code.js,
					ts: props().code.ts,
				}))
			: null,
	]
})

const HeroEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow"))

	return () => "Maoka jabs"
})

const HeroLead = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("lede"))

	return () =>
		"Attach refresh policy, lifecycle work, and recovery behavior without folding those decisions into component bodies."
})

const SectionTitle = maoka.html.h2(({ props }) => () => props().text)

const SectionBody = maoka.html.p(({ props }) => () => props().text)

render(
	document.body,
	DocsPageBoundary(() => ({
		children: Page(),
	})),
)
