import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import { DocsNav } from "../../src/components/docs-nav.js"

const rendererSkeletonExample = `import { createRoot } from "maoka/rendering"

export const renderWidget = (value, component, options = {}) => {
	const root = createRoot({
		value,
		createKey: options.createKey,
		createValue,
		refreshNode,
		insertNode,
		removeNode,
		scheduleRefresh,
		cancelRefresh,
	})
	const parent = createRootNode(root, value)
	const initialized =
		component.length >= 2 ? component : component(undefined)
	const node = initialized(root, parent)

	root.mountNode(node)

	return root
}

const createRootNode = (root, value) => ({
	key: root.key,
	value,
	props: () => ({ key: root.key }),
	root,
	render: () => root.children,
	lastRenderResult: root.children,
	parent: null,
	children: root.children,
	refresh$: () => root.refreshNode(root.children[0]),
	lifecycleHandlers: {
		afterMount: [],
		beforeRefresh: [],
		error: [],
		beforeUnmount: [],
		afterUnmount: [],
	},
	mounted: true,
})`

const adapterComparisonExample = `// DOM adapter
createRoot({
	value: container,
	createValue: tag => document.createElement(tag),
	refreshNode: node => {
		node.value.textContent = String(node.lastRenderResult ?? "")
	},
	insertNode: (parent, node, index) => {
		parent.value.insertBefore(node.value, parent.value.childNodes[index] ?? null)
	},
	removeNode: node => {
		node.value.parentNode?.removeChild(node.value)
	},
	scheduleRefresh: flush => requestAnimationFrame(flush),
	cancelRefresh: handle => cancelAnimationFrame(handle),
})

// Test adapter
createRoot({
	value: createValue("root"),
	createValue,
	refreshNode: node => {
		node.value.text = String(node.lastRenderResult ?? "")
	},
	insertNode: (parent, node, index) => {
		parent.value.children.splice(index, 0, node.value)
		node.value.parent = parent.value
	},
	removeNode: node => {
		node.value.parent = null
	},
	scheduleRefresh: flush => flush,
	cancelRefresh: () => {},
})`

const implicitNodeExample = `const Title = maoka.html.h2(({ props }) => () => props().label)

const CardBody = maoka.create(({ props }) => {
	// This node is implicit: it has no own renderer value.
	// It reuses the parent value and only returns child templates.
	return () => [
		Title(() => ({ key: "title", label: props().title })),
		props().content,
	]
})

const Card = maoka.html.article(({ props }) => {
	// This node is concrete: maoka.html.article creates a renderer value.
	return () => CardBody(() => ({
		key: "body",
		title: props().title,
		content: props().content,
	}))
})`

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(() => () => [
				Hero(),
				Section(() => ({
					id: "why-rendering-exists",
					title: "Why rendering exists",
					body: [
						"Maoka components do not create DOM nodes, test objects, or renderer-specific handles directly. They create Maoka nodes and describe output in renderer-agnostic templates.",
						"A renderer adapter turns that abstract tree into concrete values and concrete mutations. This is why the same component can be rendered by `maoka/dom`, `maoka/test`, or your own adapter without changing the component definition.",
					],
				})),
				FlowSection(),
				Section(() => ({
					id: "root-as-mediator",
					title: "Root as mediator",
					body: [
						"`createRoot(...)` is the bridge between the runtime tree and the renderer implementation. It owns the renderer-facing root value, the shared child list, the key factory, and the refresh queue.",
						"That makes root the mediator in practice: components talk to `refresh$()` and lifecycle hooks, renderers provide node operations, and root coordinates when values are created, refreshed, inserted, removed, and scheduled.",
					],
				})),
				ContractSection(),
				Section(() => ({
					id: "how-nodes-meet-renderer-values",
					title: "How nodes meet renderer values",
					body: [
						"A concrete Maoka node gets its renderer value through `root.createValue(tag)`. After that, root mounts the node, applies its template, and asks the adapter to insert, refresh, or remove the concrete value as reconciliation proceeds.",
						"Not every node owns a value. Some nodes are implicit: they keep structure, keys, lifecycle, and reconciliation behavior, but their `value` is the same object as the parent value, so no new renderer object is created for that layer.",
					],
				})),
				CodeBlock(() => ({ js: implicitNodeExample })),
				Section(() => ({
					id: "concrete-vs-implicit",
					title: "Concrete vs implicit nodes",
					body: [
						"Use a concrete node when a component must own a renderer object such as an element, text node, or platform handle. Tagged factories like `maoka.html.article(...)` do that by giving root a renderer-facing tag.",
						"Use an implicit node when a component is only grouping behavior or returning child templates. The node still exists in the Maoka tree, but it does not force an extra object into the renderer tree.",
					],
				})),
				Section(() => ({
					id: "build-a-custom-renderer",
					title: "How to build a custom renderer",
					body: [
						"Start from a value model that matches your target platform. Then plug that model into `createRoot(...)` by teaching Maoka how to create values, refresh text output, insert children, remove children, and optionally schedule refreshes.",
						"The DOM and test adapters are useful references because they implement the same root contract against two very different targets: browser nodes and a tiny in-memory tree.",
					],
				})),
				CodeBlock(() => ({ js: rendererSkeletonExample })),
				CompareSection(),
				CodeBlock(() => ({ js: adapterComparisonExample })),
				ChecklistSection(),
				ReferenceSection(),
			]),
		]
	})(),
])

const Hero = maoka.html.header(() => () => [
	maoka.html.p(({ value }) => {
		value.className = "eyebrow"

		return () => "Maoka rendering"
	})(),
	maoka.html.h1(() => () => "How roots mediate rendering"),
	maoka.html.div(({ value }) => {
		value.className = "rendering-callout"

		return () =>
			"The root is where Maoka's runtime tree meets a renderer's concrete value model. Components stay renderer-agnostic; the adapter teaches root how to create, place, refresh, and remove values."
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
		...props().body.map(body => maoka.html.p(() => () => body)()),
	]
})

const FlowSection = maoka.html.section(({ value }) => {
	value.id = "node-lifecycle"

	return () => [
		maoka.html.h3(() => () => "Node to renderer flow"),
		maoka.html.p(() => () =>
			"At runtime the handoff from component code to renderer code follows the same path no matter which adapter you use.",
		)(),
		maoka.html.ul(({ value }) => {
			value.className = "flow-list"

			return () =>
				[
					{
						title: "1. Blueprint or component is instantiated",
						body: "The adapter initializes the incoming blueprint or component and passes `root` plus a synthetic root parent node.",
					},
					{
						title: "2. Node creation decides value ownership",
						body: "Tagged nodes ask `root.createValue(tag)` for a concrete renderer value. Implicit nodes reuse their parent value.",
					},
					{
						title: "3. root.mountNode(node) applies the first template",
						body: "Mounting runs the first render and lets reconciliation decide whether the node yields text, child nodes, or nothing.",
					},
					{
						title: "4. Adapter callbacks mutate the real target",
						body: "Root calls `refreshNode`, `insertNode`, and `removeNode` so the adapter can update the target platform.",
					},
				].map(item => FlowItem(() => item))
		})(),
	]
})

const FlowItem = maoka.html.li(({ props, value }) => {
	value.className = "flow-item"

	return () => [
		maoka.html.strong(() => () => props().title),
		maoka.html.span(() => () => props().body),
	]
})

const ContractSection = maoka.html.section(({ value }) => {
	value.id = "root-contract"

	return () => [
		maoka.html.h3(() => () => "Root contract"),
		maoka.html.p(() => () =>
			"These are the main adapter hooks that `createRoot(...)` collects into one renderer contract. The `/api` page documents the types; this page focuses on why each one exists.",
		)(),
		maoka.html.ul(({ value }) => {
			value.className = "contract-list"

			return () =>
				[
					{
						title: "value",
						body: "The renderer-facing root value, such as a DOM container or an in-memory root object.",
					},
					{
						title: "createValue(tag)",
						body: "Creates a concrete renderer value for a tagged node.",
					},
					{
						title: "refreshNode(node)",
						body: "Applies text-like render output to a concrete value.",
					},
					{
						title: "insertNode(parent, node, index)",
						body: "Places a concrete child value into its renderer parent at the reconciled position.",
					},
					{
						title: "removeNode(node)",
						body: "Detaches a concrete value when reconciliation decides the node is stale.",
					},
					{
						title: "scheduleRefresh(flush) and cancelRefresh(handle)",
						body: "Optional scheduling hooks for batching refresh work on the target platform.",
					},
				].map(item => ContractItem(() => item))
		})(),
	]
})

const ContractItem = maoka.html.li(({ props }) => () => [
	maoka.html.strong(() => () => props().title),
	maoka.html.span(() => () => props().body),
])

const CompareSection = maoka.html.section(({ value }) => {
	value.id = "dom-vs-test"

	return () => [
		maoka.html.h3(() => () => "DOM and test adapters, same contract"),
		maoka.html.p(() => () =>
			"`maoka/dom` and `maoka/test` prove that the renderer interface is small but expressive: both adapters mount, refresh, insert, and remove through root, but they map those operations to very different targets.",
		)(),
		maoka.html.div(({ value }) => {
			value.className = "compare-grid"

			return () => [
				CompareCard(() => ({
					title: "maoka/dom",
					body: [
						"Concrete values are browser nodes created from tags and namespaces.",
						"Refresh updates `textContent`, insertion uses DOM ordering, and removal detaches from `parentNode`.",
						"Refresh scheduling prefers `requestAnimationFrame` so browser work can batch naturally.",
					],
				})),
				CompareCard(() => ({
					title: "maoka/test",
					body: [
						"Concrete values are small JavaScript objects with `tag`, `text`, `parent`, and `children`.",
						"Refresh writes a plain `text` field, insertion mutates arrays, and removal clears the parent link.",
						"Refresh scheduling can be synchronous because the target is only an in-memory test tree.",
					],
				})),
			]
		})(),
	]
})

const CompareCard = maoka.html.section(({ props, value }) => {
	value.className = "compare-card"

	return () => [
		maoka.html.h3(() => () => props().title),
		...props().body.map(body => maoka.html.p(() => () => body)()),
	]
})

const ChecklistSection = maoka.html.section(({ value }) => {
	value.id = "renderer-checklist"

	return () => [
		maoka.html.h2(() => () => "Renderer checklist"),
		maoka.html.p(() => () =>
			"If you are writing a renderer, these decisions should be explicit before you wire the adapter into `createRoot(...)`.",
		)(),
		maoka.html.ul(({ value }) => {
			value.className = "checklist"

			return () =>
				[
					{
						title: "value model",
						body: "What object represents a renderer value, and what does the root container look like?",
					},
					{
						title: "createValue",
						body: "How does a renderer-facing tag become a concrete value?",
					},
					{
						title: "insertion and removal semantics",
						body: "How do child values attach, move, and detach while preserving reconciled order?",
					},
					{
						title: "text refresh semantics",
						body: "How should string or scalar render output update an existing concrete value?",
					},
					{
						title: "refresh scheduling strategy",
						body: "Should refresh flush immediately, on a microtask, on an animation frame, or through another scheduler?",
					},
				].map(item => ContractItem(() => item))
		})(),
	]
})

const ReferenceSection = maoka.html.section(({ value }) => {
	value.id = "reference-points"

	return () => [
		maoka.html.h2(() => () => "Reference points"),
		maoka.html.p(() => () =>
			"Use `maoka/rendering` when you need the low-level integration primitives, and treat `createRoot(...)` as the center of the adapter design. For concrete examples, read `maoka/dom` and `maoka/test`; for the full exported types, use the API reference.",
		)(),
		maoka.html.a(({ value }) => {
			value.href = "/api#types-renderer"
			value.className = "reference-link"

			return () => "Open renderer type reference"
		})(),
	]
})

render(document.body, Page())
