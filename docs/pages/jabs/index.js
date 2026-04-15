import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import { DocsNav } from "../../src/components/docs-nav.js"

const noRefreshExample = `const StableBadge = maoka.html.span(({ use }) => {
	use(maoka.jabs.noRefresh)

	return () => "Ready"
})`

const noRefreshExampleTs = `const StableBadge = maoka.html.span(({ use }) => {
	use(maoka.jabs.noRefresh)

	return (): string => "Ready"
})`

const shouldComponentRefreshExample = `const Price = maoka.html.span(({ props$, use }) => {
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)

	return () => \`$\${props$().value}\`
})`

const shouldComponentRefreshExampleTs = `const Price = maoka.html.span<{ value: number }>(({ props$, use }) => {
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)

	return (): string => \`$\${props$().value}\`
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

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(() => () => [
				Hero(),
				Section(() => ({
					id: "overview",
					title: "Behavior beside components",
					body: "Jabs are small functions that run through params.use(jab). They receive the same params as the component, so lifecycle hooks, props$(), refresh$(), and nested use() calls stay available without moving policy into the render function.",
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
					id: "custom-jabs",
					title: "Custom jabs",
					body: "A custom jab is just a function from component params to whatever you need. Return state, register lifecycle hooks, wrap refresh policy, or compose other jabs through params.use().",
					code: {
						js: customJabExample,
						ts: customJabExampleTs,
					},
				})),
			]),
		]
	})(),
])

const Hero = maoka.html.header(() => () => [
	maoka.html.p(({ value }) => {
		value.className = "eyebrow"

		return () => "Maoka jabs"
	})(),
	maoka.html.h1(() => () => "Jabs"),
	maoka.html.p(({ value }) => {
		value.className = "lede"

		return () =>
			"Attach refresh policy, lifecycle work, and recovery behavior without folding those decisions into component bodies."
	})(),
])

const Section = maoka.html.section(({ props$, value }) => {
	value.id = props$().id

	return () => [
		maoka.html.h2(() => () => props$().title),
		maoka.html.p(() => () => props$().body),
		props$().code
			? CodeBlock(() => ({
					js: props$().code.js,
					ts: props$().code.ts,
				}))
			: null,
	]
})

render(document.body, Page())
