import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import {
	DocsArticle,
	DocsLayout,
	DocsPageBoundary,
} from "../../src/components/docs-page.js"
import { NotebookSheet } from "../../src/components/notebook-sheet.js"
import { SiteFooter } from "../../src/components/site-footer.js"
import { ThemeToggle } from "../../src/components/theme-toggle.js"

const markRefreshGoodExample = `const useRemoteProfile$ = ({ lifecycle, props, refresh$ }) => {
	let loadedId = null
	let profile = null

	lifecycle.beforeRefresh(() => {
		const { id } = props()

		if (loadedId === id) return true

		return async () => {
			profile = await fetch(\`/api/profiles/\${id}\`).then(response =>
				response.json(),
			)
			loadedId = id

			return true
		}
	})

	return { profile }
}

const useProfilePanel$ = params => {
	return params.use(useRemoteProfile$)
}`

const markRefreshBadExample = `const useRemoteProfile = ({ lifecycle, props, refresh$ }) => {
	lifecycle.beforeRefresh(() => {
		const { id } = props()

		return async () => {
			await fetch(\`/api/profiles/\${id}\`)
			refresh$()

			return true
		}
	})
}`

const blueprintsBadExample = `const Dashboard = maoka.create(({ props }) => {
	const StatusLine = maoka.html.p(({ value }) => {
		value.className = props().tone

		return () => props().message
	})

	return () => StatusLine()
})`

const blueprintsGoodExample = `const StatusLine = maoka.html.p(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => props().tone))

	return () => props().message
})

const Dashboard = maoka.create(({ props }) => {
	return () => {
		const { message, tone } = props()

		return StatusLine(() => ({
			message,
			tone,
		}))
	}
})`

const asyncGoodExample = `const Profile = maoka.html.article(({ lifecycle, props, refresh$ }) => {
	let profile = null
	let isLoading = false
	let loadedId = null

	lifecycle.beforeRefresh(() => {
		const { id } = props()

		if (loadedId === id) return true

		if (!isLoading) {
			isLoading = true
			refresh$()

			return false
		}

		return async () => {
			profile = await fetch(\`/api/profiles/\${id}\`).then(response =>
				response.json(),
			)
			loadedId = id
			isLoading = false

			return true
		}
	})

	return () => (isLoading ? "Loading..." : profile?.name ?? "No profile")
})`

const asyncBadExample = `const Profile = maoka.html.article(({ props, refresh$, value }) => {
	let profile = null

	value.onclick = async () => {
		const { id } = props()

		profile = await fetch(\`/api/profiles/\${id}\`)
			.then(response => response.json())

		refresh$()
	}

	return () => profile?.name ?? "Loading profile..."
})`

const responsibleTamingExample = `import maokaDom from "maoka/dom"

const useWindowWidth$ = ({ lifecycle, refresh$, use }) => {
	const win = use(
		maokaDom.jabs.ifInDOM(({ value }) => value.ownerDocument.defaultView),
	)
	let width = win?.innerWidth ?? 0

	lifecycle.afterMount(() => {
		if (!win) return

		const onResize = () => {
			width = win.innerWidth
			refresh$()
		}

		win.addEventListener("resize", onResize)

		return () => {
			win.removeEventListener("resize", onResize)
		}
	})

	return () => width
}`

const childrenGoodExample = `const IncrementButton = maoka.html.button(({ props, use, value }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	value.onclick = () => props().increment()

	return () => "+"
})

const CounterValue = maoka.html.output(({ props }) => {
	return () => String(props().count)
})

const Counter = maoka.create(({ refresh$ }) => {
	let count = 0
	const increment = () => {
		count++
		refresh$()
	}

	return () => [
		CounterValue(() => ({ count })),
		IncrementButton(() => ({ increment })),
	]
})

const OrdersTitle = maoka.html.h2(() => () => "Orders")

const Dashboard = maoka.create(() => {
	return () => [OrdersTitle(), Counter(() => ({ key: "orders-counter" }))]
})`

const childrenBadExample = `const OrdersCount = maoka.html.output(({ props }) => {
	return () => String(props().count)
})

const IncrementOrders = maoka.html.button(({ props, value }) => {
	value.onclick = () => props().increment()

	return () => "+"
})

const Dashboard = maoka.create(({ refresh$ }) => {
	let count = 0
	const OrdersTitle = maoka.html.h2(() => () => "Orders")
	const increment = () => {
		count++
		refresh$()
	}

	return () => [
		OrdersTitle(),
		OrdersCount(() => ({ count })),
		IncrementOrders(() => ({ increment })),
	]
})`

const arraysGoodExample = `const TodoList = maoka.create(({ props }) => {
	return () =>
		props().items.map(item =>
			TodoRow(() => ({
				key: item.id,
				item,
			})),
		)
})`

const arraysBadExample = `const TodoList = maoka.create(({ props }) => {
	return () =>
		props().items.map(item =>
			TodoRow(() => ({
				item,
			})),
		)
})`

const ResultCount = maoka.html.output(({ props }) => {
	return () => props().label
})

const orderedCreateExample = `const SearchPanel = maoka.html.section(({ lifecycle, props, refresh$, use }) => {
	// Define state variables

	let query = ""
	let results = []
	let isLoading = false

	// Define component behavior

	const updateQuery = nextQuery => {
		query = nextQuery
		refresh$()
	}

	const shouldLoad = () => query.length >= props().minLength

	// Extract values provided by jabs

	const getResultCount = use(({ props }) => () => props().resultCountLabel(results.length))

	// Use self-contained jabs

	use(maoka.jabs.errorBoundary(error => {
		console.error("Search panel failed", error)
	}))

	// Define lifecycle

	lifecycle.beforeRefresh(() => {
		if (!shouldLoad()) return true

		return undefined
	})

	// Optionally return render phase

	return () => [query, ResultCount(() => ({ label: getResultCount() }))]
})`

const refreshInRenderBadExample = `const Loop = maoka.html.output(({ refresh$ }) => {
	return () => {
		refresh$()

		return "Still rendering"
	}
})`

const refreshInRenderGoodExample = `const Button = maoka.html.button(({ refresh$, value }) => {
	let count = 0

	value.onclick = () => {
		count++
		refresh$()
	}

	return () => \`Count: \${count}\`
})`

const errorBoundaryExample = `const AppBoundary = maoka.html.main(({ use }) => {
	use(
		maoka.jabs.errorBoundary(error => {
			console.error("App subtree failed", error)
		}),
	)

	return () => App()
})`

const rendererSpecificExample = `import maokaDom from "maoka/dom"

const ClickTracker = maoka.html.button(({ use, value }) => {
	use(
		maokaDom.jabs.ifInDOM(({ value }) => {
			value.addEventListener("click", () => {
				console.info("clicked")
			})
		}),
	)

	return () => "Track click"
})`

const sections = [
	{
		id: "tldr",
		title: "TL;DR",
		body: [
			"These are best practices, not parser-enforced rules. Still, they reflect the intended shape of Maoka code: explicit refresh behavior, stable blueprint identity, lifecycle-owned side effects, and renderer-aware value access.",
			"When a section shows both Good and Bad, treat that as the practical default: the good version is the convention Maoka code should converge toward.",
		],
	},
	{
		id: "refresh-capable-jabs",
		title: "Mark refresh-capable jabs with $",
		body: [
			"If a jab can trigger refresh on its own path of execution, its name should end with $. The same applies to wrapper jabs that call another $-suffixed jab, because they also transparently expose subtree refresh capability.",
			"This is a declaration convention. It lets readers see that the jab may re-enter refresh flow without auditing the full call graph first.",
		],
		examples: [
			{ tone: "bad", title: "Bad", code: markRefreshBadExample },
			{ tone: "good", title: "Good", code: markRefreshGoodExample },
		],
	},
	{
		id: "blueprints-outside-components",
		title: "Declare blueprints outside components",
		body: [
			"Blueprints should live outside component bodies. Defining them inside create or render recreates factories in the wrong place and usually couples their behavior to parent closures.",
			"If a blueprint needs data, pass that data through props. Do not smuggle values in through captured closure state from the parent component.",
		],
		examples: [
			{ tone: "bad", title: "Bad", code: blueprintsBadExample },
			{ tone: "good", title: "Good", code: blueprintsGoodExample },
		],
	},
	{
		id: "before-refresh-for-async",
		title: "Prefer beforeRefresh for async work",
		body: [
			"beforeRefresh is the designed spot for async continuations tied to rendering state. It keeps refresh policy close to the component lifecycle and lets Maoka route rejected continuations through its error handling.",
			"You may perform async work elsewhere, but then error handling and refresh discipline move from Maoka onto the developer. That tradeoff should be explicit, not accidental.",
		],
		examples: [
			{ tone: "bad", title: "Bad", code: asyncBadExample },
			{ tone: "good", title: "Good", code: asyncGoodExample },
		],
		links: [
			{
				href: "/component-lifecycle#patterns",
				label: "Component lifecycle: Patterns",
			},
		],
	},
	{
		id: "responsible-taming",
		title: "Practice responsible taming",
		body: [
			"A jab should follow responsible taming: every side effect it introduces must be handled in the proper lifecycle locations of the component it tames.",
			"Setup belongs with setup, teardown belongs with teardown, and both should stay visible in the same behavioral unit. A jab should not leave hidden listeners, subscriptions, timers, or observers behind.",
		],
		examples: [
			{ tone: "good", title: "Recommended", code: responsibleTamingExample },
		],
		links: [
			{
				href: "/component-lifecycle#after-mount",
				label: "Component lifecycle: afterMount",
			},
			{
				href: "/component-lifecycle#before-unmount",
				label: "Component lifecycle: beforeUnmount",
			},
		],
	},
	{
		id: "prefer-children",
		title: "Prefer children in parent-child refresh conflicts",
		body: [
			"When deciding whether a parent or child should own a refresh, prefer the child. Maoka components try not to refresh when they do not have to, but that optimization works best when stateful descendants own their own churn.",
			"Let grumbly ancestors stay quiet and let gadget-heavy children refresh only when their own state truly demands it.",
		],
		examples: [
			{ tone: "bad", title: "Bad", code: childrenBadExample },
			{ tone: "good", title: "Good", code: childrenGoodExample },
		],
	},
	{
		id: "arrays-as-render-candidates",
		title: "Arrays are first-class render candidates",
		body: [
			"Arrays are valid render output in Maoka. Reconciliation is strongest when array items carry keys, because keyed children preserve identity even when order changes.",
			"Without keys, array diffing falls back to positional matching. That is acceptable for fixed-order output, but much less stable for insertions, removals, and reordering.",
		],
		examples: [
			{ tone: "bad", title: "Bad", code: arraysBadExample },
			{ tone: "good", title: "Good", code: arraysGoodExample },
		],
	},
	{
		id: "keep-create-ordered",
		title: "Keep create phase ordered",
		body: [
			"A clean create phase is easier to scan. A good default order is: state let bindings first, then derived variables and handlers, then jabs that return values you will use, then void jabs that only register behavior.",
			"This is a readability convention rather than a hard rule, but it makes large components far easier to maintain.",
		],
		examples: [
			{ tone: "good", title: "Recommended order", code: orderedCreateExample },
		],
	},
	{
		id: "never-refresh-during-render",
		title: "Never refresh during render",
		body: [
			"Do not call refresh$() from render. Render should describe output, not schedule new work for the same node.",
			"Refreshing from render blurs phase boundaries and can quickly turn into a self-sustaining loop. Move refresh triggers into event handlers, lifecycle hooks, or other explicit control points.",
		],
		examples: [
			{ tone: "bad", title: "Bad", code: refreshInRenderBadExample },
			{ tone: "good", title: "Good", code: refreshInRenderGoodExample },
		],
	},
	{
		id: "always-have-a-boundary",
		title: "Always have an error boundary",
		body: [
			"Use at least one error boundary. At minimum, place one near application entry and log the failure. That is still better than throwing raw subtree errors directly into the user's face.",
			"A higher-level boundary gives the tree one predictable place to recover, report, or render a fallback when a descendant explodes.",
		],
		examples: [
			{ tone: "good", title: "Recommended", code: errorBoundaryExample },
		],
		links: [{ href: "/jabs#error-boundary", label: "Jabs: errorBoundary" }],
	},
	{
		id: "guard-renderer-specific-value-access",
		title: "Guard renderer-specific value access",
		body: [
			"Before manipulating value, make sure the component is initialized in the renderer you expect. Renderer-specific assumptions should be guarded at the boundary where they become relevant.",
			"For example, DOM-only imperative work should sit behind ifInDOM so the component keeps a clear contract about when DOM APIs are actually available.",
		],
		examples: [{ tone: "good", title: "Good", code: rendererSpecificExample }],
		links: [{ href: "/api#maoka-dom", label: "API: maoka/dom" }],
	},
]

const Page = maoka.create(() =>
	() =>
		DocsLayout(() => ({
			children: DocsArticle(() => ({
				children: [
					Hero(),
					...sections.map(section => Section(() => section)),
					SiteFooter(),
				],
			})),
		})),
)

const BestPracticesTitle = maoka.html.h1(() => () => "Best practices")

const Hero = maoka.html.header(() => () => [
	ThemeToggle(),
	HeroEyebrow(),
	BestPracticesTitle(),
	HeroLead(),
])

const Section = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))

	return () => [
		SectionTitle(() => ({ text: props().title })),
		...props().body.map(body => SectionBodyParagraph(() => ({ text: body }))),
		props().examples?.length
			? PracticeExamples(() => ({ examples: props().examples }))
			: null,
		props().links?.length
			? PracticeLinks(() => ({ links: props().links }))
			: null,
	]
})

const ExampleCard = maoka.create(({ props }) => {
	return () =>
		NotebookSheet(() => ({
			variant: "note",
			className: `practice-example practice-example-${props().tone}`,
			children: [
				PracticeExampleHeading(() => ({
					title: props().title,
					tone: props().tone,
				})),
				CodeBlock(() => ({ js: props().code })),
			],
		}))
})

const HeroEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow"))

	return () => "Practical Maoka"
})

const HeroLead = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("lede"))

	return () =>
		"Conventions for writing Maoka components and jabs that stay explicit, predictable, and easy to maintain as refresh behavior grows more involved."
})

const SectionTitle = maoka.html.h2(({ props }) => () => props().text)

const SectionBodyParagraph = maoka.html.p(({ props }) => () => props().text)

const PracticeExamples = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("practice-examples"))

	return () =>
		props().examples.map(example => ExampleCard(() => ({ ...example })))
})

const PracticeLinks = maoka.html.p(({ props, use }) => {
	use(maoka.jabs.classes.set("practice-links"))

	return () => [
		"See also: ",
		...props().links.flatMap((link, index) => [
			index ? ", " : "",
			InlineLink(() => link),
		]),
	]
})

const PracticeExampleHeading = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("practice-example-heading"))

	return () => [
		PracticeBadge(() => ({
			title: props().title,
			tone: props().tone,
		})),
	]
})

const PracticeBadge = maoka.html.span(({ props, use }) => {
	use(
		maoka.jabs.classes.assign(
			() => `practice-badge practice-badge-${props().tone}`,
		),
	)

	return () => props().title
})

const InlineLink = maoka.html.a(({ props, use }) => {
	use(maoka.jabs.attributes.assign("href", () => props().href))

	return () => props().label
})

render(
	document.body,
	DocsPageBoundary(() => ({
		children: Page(),
	})),
)
