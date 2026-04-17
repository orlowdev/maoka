import "./style.css"
import maoka, { MAOKA } from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import { DocsNav } from "../../src/components/docs-nav.js"
import { NotebookSheet } from "../../src/components/notebook-sheet.js"
import { RainbowCard } from "../../src/components/rainbow-card.js"
import { SiteFooter } from "../../src/components/site-footer.js"
import { ThemeToggle } from "../../src/components/theme-toggle.js"

const importExample = `import maoka, { MAOKA, type Maoka } from "maoka"`

const counterValueJs = `const CounterValue = maoka.html.output(({ props }) => {
	return () => String(props().count)
})`

const incrementButtonJs = `const IncrementButton = maoka.html.button(({ props, value }) => {
	value.type = "button"
	value.onclick = () => props().increment()

	return () => "Increment"
})`

const incrementButtonTs = `const IncrementButton = maoka.html.button<{
	increment: () => void
}>(({ props, value }) => {
	value.type = "button"
	value.onclick = () => props().increment()

	return () => "Increment"
})`

const createExampleJs = `${counterValueJs}

${incrementButtonJs}

const Counter = maoka.create(({ props, refresh$ }) => {
	let count = props().initialCount
	const increment = () => {
		count++
		refresh$()
	}

	return () => [
		CounterValue(() => ({ key: "value", count })),
		IncrementButton(() => ({ key: "increment", increment })),
	]
})

Counter(() => ({ initialCount: 0, key: "counter" }))`

const createExampleTs = `const CounterValue = maoka.html.output<{ count: number }>(
	({ props }) => () => String(props().count),
)

${incrementButtonTs}

const Counter = maoka.create<{ initialCount: number }>(
	({ props, refresh$ }) => {
		let count = props().initialCount
		const increment = () => {
			count++
			refresh$()
		}

		return () => [
			CounterValue(() => ({ key: "value", count })),
			IncrementButton(() => ({ key: "increment", increment })),
		]
	},
)

Counter(() => ({ initialCount: 0, key: "counter" }))`

const pureExampleJs = `const Badge = maoka.pure("span", ({ props, value }) => {
	value.className = "badge"

	return () => props().label
})`

const pureExampleTs = `const Badge = maoka.pure<{ label: string }>("span", ({ props, value }) => {
	value.className = "badge"

	return () => props().label
})`

const taggedExampleJs = `const Notice = maoka.html.section(({ props, value }) => {
	value.dataset.kind = props().kind

	return () => props().message
})`

const taggedExampleTs = `const Notice = maoka.html.section<{
	kind: "info" | "warning"
	message: string
}>(({ props, value }) => {
	value.dataset.kind = props().kind

	return () => props().message
})`

const jabsExampleJs = `const Price = maoka.html.output(({ props, use }) => {
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)

	return () => \`$\${props().value}\`
})`

const jabsExampleTs = `const Price = maoka.html.output<{ value: number }>(({ props, use }) => {
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)

	return () => \`$\${props().value}\`
})`

const domRenderExampleTs = `import maoka from "maoka"
import maokaDom, { render, type MaokaDom } from "maoka/dom"

const FocusInput = maoka.html.input(({ use, value }) => {
	use(
		maokaDom.jabs.ifInDOM<HTMLElement>(({ value }) => {
			value.focus()
		}),
	)

	value.type = "text"
})

render(document.body, FocusInput())`

const testRenderExampleTs = `import maoka from "maoka"
import { render, renderJab } from "maoka/test"

const Label = maoka.html.span<{ text: string }>(
	({ props }) => () => props().text,
)

const screen = render(Label(() => ({ text: "Ready" })))
screen.text()

const probe = renderJab(({ refresh$ }) => ({
	trigger: refresh$,
}))
probe.result().trigger()
probe.flush()`

const exportsRows = [
	{
		exportName: "default",
		symbol: "maoka",
		kind: "runtime",
		importLine: `import maoka from "maoka"`,
		description:
			"Primary runtime namespace. It exposes component factories, tagged component maps, and built-in jabs.",
	},
	{
		exportName: "named",
		symbol: "MAOKA",
		kind: "runtime",
		importLine: `import { MAOKA } from "maoka"`,
		description:
			"Namespace of exported tag constant arrays for HTML, SVG, and MathML support.",
	},
	{
		exportName: "type",
		symbol: "Maoka",
		kind: "type-only",
		importLine: `import { type Maoka } from "maoka"`,
		description:
			"Top-level type surface for the root module, including the `Maoka` object type and the `namespace Maoka` type members.",
	},
]

const defaultMembers = [
	{
		id: "maoka-create",
		title: "maoka.create",
		signature: `create<
	$Props extends Maoka.BaseProps = Maoka.NoProps,
>(
	definition: Maoka.ComponentDefinition<$Props>,
): Maoka.Blueprint<$Props>`,
		body: [
			"Creates a component blueprint with no predefined renderer value. The returned blueprint is later called with a props provider and then instantiated by a renderer.",
			"The definition runs during the create phase and may optionally return a render function. Keys are supplied through the props provider and participate in child identity during reconciliation.",
		],
		usage: [
			"Use for structural or controller components that coordinate child output rather than binding themselves to a specific tag.",
			"Call the resulting blueprint as `Component(() => ({ ...props, key }))` to create a component instance.",
		],
		code: { js: createExampleJs, ts: createExampleTs },
	},
	{
		id: "maoka-pure",
		title: "maoka.pure",
		signature: `pure<
	$Props extends Maoka.BaseProps = Maoka.NoProps,
>(
	tag: string,
	definition: Maoka.ComponentDefinition<$Props>,
): Maoka.Blueprint<$Props>`,
		body: [
			"Creates a component blueprint that always owns a renderer value created from `tag`. The tag is passed to the active renderer through the root create-value pipeline.",
			"Use `pure` when the component has a fixed renderer identity but still needs create-phase state, lifecycle hooks, jabs, and refresh control.",
		],
		usage: [
			"`maoka.html.*`, `maoka.svg.*`, and `maoka.math.*` are specialized forms of `pure`.",
			"The `tag` argument is renderer-facing. In the DOM adapter it becomes an element name or namespace-qualified tag descriptor.",
		],
		code: { js: pureExampleJs, ts: pureExampleTs },
	},
	{
		id: "maoka-html",
		title: "maoka.html",
		signature: `html: Record<
	Maoka.HtmlTag,
	Maoka.TaggedComponent
>`,
		body: [
			"Map of HTML tagged component factories keyed by every exported HTML tag name.",
			"Each member such as `maoka.html.div` or `maoka.html.button` has the same API shape: it accepts a `ComponentDefinition` and returns a `Blueprint`.",
		],
		usage: [
			"Use when the component should create an HTML renderer value and expose the corresponding concrete DOM element through `params.value` in the DOM adapter.",
			"Supported keys match `HTMLElementTagNameMap` and are exported at runtime through `MAOKA.HTML_TAGS`.",
		],
		code: { js: taggedExampleJs, ts: taggedExampleTs },
		tags: MAOKA.HTML_TAGS,
	},
	{
		id: "maoka-svg",
		title: "maoka.svg",
		signature: `svg: Record<
	Maoka.SvgTag,
	Maoka.TaggedComponent
>`,
		body: [
			"Map of SVG tagged component factories keyed by every exported SVG tag name.",
			"Each member delegates to `pure` with an SVG namespace-qualified tag descriptor.",
		],
		usage: [
			"Use when the renderer value must be created in the SVG namespace.",
			"Supported keys match `SVGElementTagNameMap` and are exported at runtime through `MAOKA.SVG_TAGS`.",
		],
		tags: MAOKA.SVG_TAGS,
	},
	{
		id: "maoka-math",
		title: "maoka.math",
		signature: `math: Record<
	Maoka.MathMlTag,
	Maoka.TaggedComponent
>`,
		body: [
			"Map of MathML tagged component factories keyed by every exported MathML tag name.",
			"Each member delegates to `pure` with a MathML namespace-qualified tag descriptor.",
		],
		usage: [
			"Use when the renderer value must be created in the MathML namespace.",
			"Supported keys match `MathMLElementTagNameMap` and are exported at runtime through `MAOKA.MATH_TAGS`.",
		],
		tags: MAOKA.MATH_TAGS,
	},
]

const jabMembers = [
	{
		id: "maoka-jabs-no-refresh",
		title: "maoka.jabs.noRefresh",
		signature: `noRefresh: Maoka.Jab`,
		body: [
			"Registers a `beforeRefresh` lifecycle handler that always returns `false`.",
			"Use when the component performs setup in the create phase but should never re-render after refresh requests.",
		],
		usage: [
			"The jab does not return a value.",
			"Refresh requests still enter the queue, but this handler prevents render-phase execution for the component.",
		],
	},
	{
		id: "maoka-jabs-should-component-refresh",
		title: "maoka.jabs.shouldComponentRefresh",
		signature: `shouldComponentRefresh<
	$Props extends BaseProps = NoProps,
>(
	compare: (
		prevProps: $Props,
		nextProps: $Props,
	) => boolean,
): Maoka.Jab<any, $Props>`,
		body: [
			"Registers a `beforeRefresh` handler that compares previous and next props.",
			"The comparator result directly determines whether the component should render for that refresh cycle.",
		],
		usage: [
			"Use when refresh policy depends on selected props rather than every change in the props provider result.",
			"The comparator receives already materialized props objects, including any declared keys.",
		],
	},
	{
		id: "maoka-jabs-error-boundary",
		title: "maoka.jabs.errorBoundary",
		signature: `errorBoundary(handler: (error: Error) => void): Maoka.Jab`,
		body: [
			"Registers an `onError` handler that intercepts descendant errors bubbling through the current node.",
			"When a descendant error reaches this boundary, the supplied handler receives the original `Error` and the descendant error is marked as handled.",
		],
		usage: [
			"Use for subtree-level recovery or reporting logic.",
			"It does not handle unrelated errors automatically; it only reacts to descendant errors presented through lifecycle error bubbling.",
		],
	},
]

const constantGroups = [
	{
		id: "maoka-constants-html-tags",
		title: "MAOKA.HTML_TAGS",
		signature: "readonly string[]",
		body:
			"Ordered runtime list of HTML tag members exported by `maoka.html`. Useful for introspection, tooling, and documentation support code.",
		tags: MAOKA.HTML_TAGS,
	},
	{
		id: "maoka-constants-svg-tags",
		title: "MAOKA.SVG_TAGS",
		signature: "readonly string[]",
		body:
			"Ordered runtime list of SVG tag members exported by `maoka.svg`. It mirrors the supported SVG member names of the main module.",
		tags: MAOKA.SVG_TAGS,
	},
	{
		id: "maoka-constants-math-tags",
		title: "MAOKA.MATH_TAGS",
		signature: "readonly string[]",
		body:
			"Ordered runtime list of MathML tag members exported by `maoka.math`. Use it when code must enumerate supported MathML factories without hardcoded tag inventories.",
		tags: MAOKA.MATH_TAGS,
	},
]

const subpackages = [
	{
		id: "subpackage-dom",
		title: "`maoka/dom`",
		importLine: `import maokaDom, { render, type MaokaDom } from "maoka/dom"`,
		body: [
			"DOM adapter for Maoka components. It renders a root component into a concrete DOM container and exposes a small DOM-specific jab namespace through the default export.",
			"The package is intended for browser rendering. It bridges Maoka nodes to DOM elements, schedules refresh through `requestAnimationFrame` when available, and creates HTML, SVG, and MathML nodes with the correct namespace behavior.",
		],
		runtime: [
			"`render(container, component, options?) => Maoka.Root<Element>` mounts a blueprint or component into a DOM container.",
			"`default maokaDom` currently exposes `maokaDom.jabs.ifInDOM`, a DOM-only jab helper.",
		],
		types: [
			"`namespace MaokaDom` exports `IfInDom`, the type of the DOM guard jab factory.",
			"`MaokaDomRenderOptions` currently exposes `createKey?: () => Maoka.Key`.",
		],
		code: domRenderExampleTs,
	},
	{
		id: "subpackage-test",
		title: "`maoka/test`",
		importLine: `import { render, renderJab, setup } from "maoka/test"`,
		body: [
			"In-memory test renderer for Maoka components and jabs. It runs reconciliation, lifecycle, props updates, and refresh flow without a browser or DOM shim.",
			"The package is intended for unit tests and behavior probes. It returns renderer helpers for tree traversal, text extraction, JSON serialization, and direct jab execution inside a real component context.",
		],
		runtime: [
			"`createValue(tag) => MaokaTestValue` creates an in-memory renderer value.",
			"`render(component, options?) => MaokaTestRenderer` mounts a component and returns helpers such as `flush`, `text`, `find`, `findByTag`, and `toJSON`.",
			"`renderJab(jab, options?) => MaokaTestJabRenderer<$Return>` runs a jab inside a probe component and exposes both `params()` and `result()`.",
			"`setup` is an alias of `renderJab`.",
		],
		types: [
			"`MaokaTestValue` models a tree node with `tag`, `text`, `parent`, `children`, and arbitrary extra fields.",
			"`MaokaTestJson` is the serialized snapshot shape returned by `toJSON()`.",
			"`MaokaTestRenderer`, `MaokaTestJabRenderer<$Return>`, `MaokaTestRenderOptions`, and `MaokaTestJabOptions<$Return>` describe the test helpers and options surface.",
		],
		code: testRenderExampleTs,
	},
]

const typeGroups = [
	{
		id: "types-maoka-export",
		title: "type Maoka",
		body: [
			"The root object type of the default export. It describes the shape of the runtime `maoka` namespace as consumed from JavaScript or TypeScript.",
			"Most users consume this type indirectly, but it is useful when authoring wrapper utilities or preserving the library surface in higher-level abstractions.",
		],
		code: `export type Maoka = {
	create: Maoka.Create
	pure: Maoka.Pure
	html: Record<
		Maoka.HtmlTag,
		Maoka.TaggedComponent
	>
	svg: Record<
		Maoka.SvgTag,
		Maoka.TaggedComponent
	>
	math: Record<
		Maoka.MathMlTag,
		Maoka.TaggedComponent
	>
	jabs: Maoka.Jabs
}`,
	},
	{
		id: "types-core-identity",
		title: "Core identity types",
		body: [
			"These types define keys and renderer-facing tag identity. They are the basic vocabulary shared by roots, nodes, and tagged component factories.",
			"`Tag` is renderer-oriented: it may be a plain string or a namespace-qualified descriptor used by SVG and MathML factories.",
		],
		code: `type Key = string | number
type Namespace = "html" | "svg" | "math"
type Tag =
	| string
	| {
			namespace: Namespace
			tag: string
	  }`,
	},
	{
		id: "types-props",
		title: "Props model",
		body: [
			"Props are represented as provider functions rather than plain objects. This allows Maoka to read current props lazily and compare them across refresh cycles.",
			"`Props<$Props>` describes the external blueprint call shape; `DefinitionProps<$Props>` describes the normalized `params.props()` result seen inside a definition.",
		],
		code: `type KeyProps = { key?: Key }
type NoProps = void
type BaseProps = Record<string, any> | NoProps

type Props<
	$Props extends BaseProps = NoProps,
> = $Props extends NoProps
	? (() => KeyProps) | NoProps
	: $Props extends KeyProps
		? () => $Props
		: () => $Props & KeyProps

type DefinitionProps<
	$Props extends BaseProps,
> = $Props extends NoProps
	? () => Required<KeyProps>
	: $Props extends Required<KeyProps>
		? () => $Props
		: () => $Props & Required<KeyProps>`,
	},
	{
		id: "types-execution",
		title: "Component and jab execution types",
		body: [
			"`Params` is the central execution contract passed to component definitions and jabs. It exposes the current renderer value, lifecycle registration, refresh control, props access, and nested jab execution.",
			"`Template` is intentionally open-ended because Maoka is renderer-agnostic; the active renderer decides how render results are interpreted.",
		],
		code: `type Jab<
	$Type = any,
	$Props extends BaseProps = NoProps,
	$Return = void,
> = (
	params: Params<$Type, $Props>,
) => $Return

type Use<
	$Type = any,
	$Props extends BaseProps = NoProps,
	$Return = void,
> = (
	jab: Jab<$Type, $Props, $Return>,
) => $Return

type Params<
	$Type = any,
	$Props extends BaseProps = NoProps,
> = {
	key: Key
	rootKey: Key
	parentKey: Key
	use: Use<$Type, $Props>
	value: $Type
	refresh$: () => void
	props: DefinitionProps<$Props>
	lifecycle: Lifecycle
}

type Template = any
type Render = () => Template`,
	},
	{
		id: "types-construction",
		title: "Component construction types",
		body: [
			"These types describe how definitions become blueprints and how blueprints become component instances.",
			"`Component` is the instantiated callable entity consumed by a renderer. `Blueprint` is the user-facing factory returned by `create`, `pure`, and tagged component members.",
		],
		code: `type ComponentDefinition<
	$Props extends BaseProps = NoProps,
	$Type = any,
> = (
	params: Params<$Type, $Props>,
) => Render | void

type BeforeCreateHandler<
	$Type = any,
	$Props extends BaseProps = NoProps,
> = (
	params: Params<$Type, $Props>,
) => void

type Component<
	$Type = any,
	$Props extends BaseProps = NoProps,
> = ((
	root: Root<$Type>,
	parent: Node,
) => Node<$Type, $Props>) & {
	beforeCreate: (
		handler: BeforeCreateHandler<$Type, $Props>,
	) => Component<$Type, $Props>
}

type Blueprint<
	$Props extends BaseProps = NoProps,
> = $Props extends NoProps
	? (props?: Props<$Props>) => Maoka.Component<any, $Props>
	: (props<$Props>) => Maoka.Component<any, $Props>

type Create = <$Props extends Maoka.BaseProps = Maoka.NoProps>(
	definition: Maoka.ComponentDefinition<$Props>,
) => Blueprint<$Props>

type Pure = <$Props extends Maoka.BaseProps = Maoka.NoProps>(
	tag: string,
	definition: Maoka.ComponentDefinition<$Props>,
) => Blueprint<$Props>

type TaggedComponent = <
	$Props extends Maoka.BaseProps = Maoka.NoProps,
>(
	definition: Maoka.ComponentDefinition<$Props>,
) => Blueprint<$Props>`,
	},
	{
		id: "types-lifecycle",
		title: "Lifecycle and error types",
		body: [
			"Lifecycle handlers are registered during the create phase. Their return types determine refresh control, cleanup timing, and async continuation behavior.",
			"`DescendantError` represents a bubbled child failure that can be marked as handled by an ancestor error handler.",
		],
		code: `type BeforeRefreshContinuation = () =>
	| boolean
	| void
	| Promise<boolean | void>

type BeforeRefreshHandler = () =>
	| boolean
	| void
	| BeforeRefreshContinuation

type DescendantError = {
	error: Error
	handled: boolean
	handle: () => void
}

type ErrorHandler = (
	error?: Error,
	descendantError?: DescendantError,
) => void
type AfterUnmountHandler = () => void
type AfterMountHandler = () => AfterUnmountHandler | void
type BeforeUnmountHandler = () => void

type Lifecycle = {
	afterMount: (handler: AfterMountHandler) => void
	beforeRefresh: (handler: BeforeRefreshHandler) => void
	onError: (handler: ErrorHandler) => void
	beforeUnmount: (handler: BeforeUnmountHandler) => void
	afterUnmount: (handler: AfterUnmountHandler) => void
}`,
	},
	{
		id: "types-renderer",
		title: "Renderer and root types",
		body: [
			"These types describe the renderer contract used internally by adapters and advanced integrations.",
			"They are part of the exported type surface, but most application code uses them indirectly through `maoka/dom`, `maoka/test`, or custom renderer implementations.",
		],
		code: `type Root<$Type = any> = {
	key: Key
	value: $Type
	children: Node<$Type, any>[]
	createKey: () => Key
	createValue: (tag: Tag) => $Type
	mountNode: (node: Node<$Type, any>) => void
	refreshNode: (node: Node<$Type, any>) => void
	flushRefreshQueue: () => void
}

type RootOptions<$Type = any> = {
	key?: Key
	value: $Type
	createKey?: () => Key
	createValue: (tag: Tag) => $Type
	refreshNode: (node: Node<$Type, any>) => void
	insertNode?: (
		parent: Node<$Type, any>,
		node: Node<$Type, any>,
		index: number,
	) => void
	removeNode?: (node: Node<$Type, any>) => void
	scheduleRefresh?: (flush: () => void) => any
	cancelRefresh?: (scheduledRefresh: any) => void
}

type DomRenderOptions = {
	createKey?: () => Key
}

type Node<
	$Type = any,
	$Props extends BaseProps = NoProps,
> = {
	key: Key
	value: $Type
	props: DefinitionProps<$Props>
	root: Root<$Type>
	render: Render
	lastRenderResult: Template
	parent: Node<$Type, any>
	children: Node<$Type, any>[]
	refresh$: () => void
	lifecycleHandlers: {
		afterMount: AfterMountHandler[]
		beforeRefresh: BeforeRefreshHandler[]
		error: ErrorHandler[]
		beforeUnmount: BeforeUnmountHandler[]
		afterUnmount: AfterUnmountHandler[]
	}
	mounted: boolean
}`,
	},
	{
		id: "types-tags",
		title: "Tag unions and built-in jabs",
		body: [
			"These aliases connect the public tag maps and built-in jab namespace to the wider type surface.",
			"The tag unions mirror the corresponding platform element maps, while `Jabs` is the type of `maoka.jabs`.",
		],
		code: `type Jabs = {
	noRefresh: Jab
	shouldComponentRefresh: <
		$Props extends BaseProps = NoProps,
	>(
		compare: (prevProps: $Props, nextProps: $Props) => boolean,
	) => Jab<any, $Props>
	errorBoundary: (handler: (error: Error) => void) => Jab
}

type HtmlTag = keyof HTMLElementTagNameMap
type SvgTag = keyof SVGElementTagNameMap
type MathMlTag = keyof MathMLElementTagNameMap`,
	},
]

const behaviorNotes = [
	"Component definitions run once per node and may omit the render phase when they do not need to produce output.",
	"`props()` is a provider that yields the current normalized props object, not a snapshot captured at blueprint creation time.",
	"`refresh$()` schedules a refresh through the active root or renderer rather than forcing immediate synchronous rendering.",
	"`use(jab)` executes the jab during the create phase and returns the jab result immediately.",
	"Child identity is resolved by explicit `key` when present, otherwise by position.",
	"`beforeCreate` mutates a concrete component instance returned from a blueprint call, not the blueprint factory itself.",
]

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(({ value }) => {
				value.className = "api-page"

				return () => [
					Hero(),
					ScopeSection(),
					SubpackagesSection(),
					ExportsSection(),
					DefaultExportSection(),
					ConstantsSection(),
					TypesSection(),
					BehaviorSection(),
					SiteFooter(),
				]
			})(),
		]
	})(),
])

const Hero = maoka.html.header(() => () => [
	ThemeToggle(),
	maoka.html.p(({ value }) => {
		value.className = "eyebrow"

		return () => "Root package reference"
	})(),
	maoka.html.h1(() => () => "API Reference"),
	maoka.html.p(({ value }) => {
		value.className = "lede"

		return () =>
			"Formal reference for the public surface of the `maoka` root entrypoint, including runtime exports, type exports, nested members, and the behavioral rules that shape their use."
	})(),
])

const ScopeSection = maoka.html.section(({ value }) => {
	value.id = "scope"

	return () => [
		maoka.html.h2(() => () => "Scope"),
		NotebookSheet(() => ({
			variant: "note",
			className: "scope-note",
			children: [
				maoka.html.p(
					() => () =>
						"This page documents the public API of the package root entrypoint `maoka`. It covers the default export `maoka`, the named export `MAOKA`, the exported `type Maoka`, and the exported `namespace Maoka` declarations.",
				)(),
				maoka.html.p(
					() => () =>
						"The main reference below remains focused on the root entrypoint. A separate section on this page summarizes the related `maoka/dom` and `maoka/test` subpackages, while `maoka/rendering` remains excluded. Type signatures are aligned with `maoka.d.ts`, `dom/maoka-dom.d.ts`, and `test/maoka-test.d.ts` where applicable.",
				)(),
				maoka.html.div(({ value }) => {
					value.className = "imports-block"

					return () => CodeBlock(() => ({ ts: importExample, noShadow: true }))
				})(),
			],
		})),
	]
})

const SubpackagesSection = maoka.html.section(({ value }) => {
	value.id = "subpackages"

	return () => [
		maoka.html.h2(() => () => "Related subpackages"),
		maoka.html.p(({ value }) => {
			value.className = "section-intro"

			return () =>
				"`maoka/dom` and `maoka/test` are separate entrypoints built on top of the root API. They are documented here as companion packages rather than as part of the root module surface."
		})(),
		maoka.html.div(({ value }) => {
			value.className = "api-grid"

			return () => subpackages.map(pkg => SubpackageCard(() => pkg))
		})(),
	]
})

const ExportsSection = maoka.html.section(({ value }) => {
	value.id = "exports"

	return () => [
		maoka.html.h2(() => () => "Exports"),
		maoka.html.p(({ value }) => {
			value.className = "section-intro"

			return () =>
				"The root module exposes one primary runtime namespace, one runtime constant namespace, and one top-level type namespace."
		})(),
		maoka.html.table(({ value }) => {
			value.className = "exports-table"

			return () => [
				maoka.html.thead(() => () =>
					maoka.html.tr(() => () => [
						maoka.html.th(() => () => "Export")(),
						maoka.html.th(() => () => "Kind")(),
						maoka.html.th(() => () => "Import")(),
						maoka.html.th(() => () => "Purpose")(),
					])(),
				)(),
				maoka.html.tbody(() => () =>
					exportsRows.map(row =>
						maoka.html.tr(() => () => [
							maoka.html.td(() => () => maoka.html.code(() => () => row.symbol)())(),
							maoka.html.td(() => () => row.kind)(),
							maoka.html.td(() => () => maoka.html.code(() => () => row.importLine)())(),
							maoka.html.td(() => () => row.description)(),
						])(),
					),
				)(),
			]
		})(),
	]
})

const DefaultExportSection = maoka.html.section(({ value }) => {
	value.id = "default-export"

	return () => [
		maoka.html.h2(() => () => "Default export `maoka`"),
		maoka.html.p(({ value }) => {
			value.className = "section-intro"

			return () =>
				"`maoka` is the primary runtime namespace. Its members either create blueprints directly, provide pre-bound tagged blueprint factories, or attach built-in behavior through jabs."
		})(),
		maoka.html.div(({ value }) => {
			value.className = "api-grid"

			return () => defaultMembers.map(member => ApiMember(() => member))
		})(),
		maoka.html.h3(() => () => "maoka.jabs"),
		maoka.html.div(({ value }) => {
			value.className = "api-card"

			return () => [
				maoka.html.p(
					() => () =>
						"`maoka.jabs` groups the built-in jabs exported from the root module. Each member is a `Maoka.Jab` or a factory that returns a `Maoka.Jab`.",
				)(),
				CodeBlock(() => ({
					js: jabsExampleJs,
					ts: jabsExampleTs,
					noShadow: true,
				})),
			]
		})(),
		maoka.html.div(({ value }) => {
			value.className = "api-grid"

			return () => jabMembers.map(member => ApiMember(() => member))
		})(),
	]
})

const ConstantsSection = maoka.html.section(({ value }) => {
	value.id = "maoka-constants"

	return () => [
		maoka.html.h2(() => () => "Named export `MAOKA`"),
		maoka.html.p(({ value }) => {
			value.className = "section-intro"

			return () =>
				"`MAOKA` is a runtime namespace of tag constant arrays re-exported from `src/maoka.constants.js`. It is intended for introspection, tooling, and support code that needs to enumerate the built-in tagged component members."
		})(),
		maoka.html.div(({ value }) => {
			value.className = "tag-grid"

			return () => constantGroups.map(group => TagGroup(() => group))
		})(),
	]
})

const TypesSection = maoka.html.section(({ value }) => {
	value.id = "types"

	return () => [
		maoka.html.h2(() => () => "Type reference"),
		maoka.html.p(({ value }) => {
			value.className = "section-intro"

			return () =>
				"The exported type surface is rooted in `type Maoka` and `namespace Maoka`. The following groups preserve the public declarations while presenting them in a readable form."
		})(),
		maoka.html.div(({ value }) => {
			value.className = "type-grid"

			return () => typeGroups.map(group => TypeGroup(() => group))
		})(),
	]
})

const BehaviorSection = maoka.html.section(({ value }) => {
	value.id = "behavior-notes"

	return () => [
		maoka.html.h2(() => () => "Usage and behavior notes"),
		maoka.html.div(({ value }) => {
			value.className = "api-card behavior-card"

			return () => [
				maoka.html.ol(({ value }) => {
					value.className = "behavior-items"

					return () =>
						behaviorNotes.map(note => maoka.html.li(() => () => note)())
				})(),
			]
		})(),
	]
})

const ApiMember = maoka.html.section(({ props, value }) => {
	value.id = props().id
	value.className = "api-card"

	return () => [
		maoka.html.h3(() => () => props().title),
		SignatureBlock(() => ({ signature: props().signature })),
		...props().body.map(paragraph => maoka.html.p(() => () => paragraph)()),
		UsageList(() => ({ items: props().usage })),
		props().code
			? CodeBlock(() => ({
					js: props().code.js,
					ts: props().code.ts,
					noShadow: true,
				}))
			: null,
		props().tags ? TagList(() => ({ tags: props().tags })) : null,
	]
})

const TagGroup = maoka.html.section(({ props, value }) => {
	value.id = props().id
	value.className = "tag-group"

	return () => [
		maoka.html.h3(() => () => props().title),
		SignatureBlock(() => ({ signature: props().signature })),
		maoka.html.p(() => () => props().body),
		TagList(() => ({ tags: props().tags })),
	]
})

const TypeGroup = maoka.html.section(({ props, value }) => {
	value.id = props().id
	value.className = "type-group"

	return () => [
		maoka.html.p(({ value }) => {
			value.className = "eyebrow is-soft"

			return () => "Type group"
		})(),
		maoka.html.h3(() => () => props().title),
		...props().body.map(paragraph => maoka.html.p(() => () => paragraph)()),
		CodeBlock(() => ({ ts: props().code, noShadow: true })),
	]
})

const SubpackageCard = maoka.html.section(({ props, value }) => {
	value.id = props().id
	value.className = "api-card"

	return () => [
		maoka.html.h3(() => () => props().title),
		SignatureBlock(() => ({ signature: props().importLine })),
		...props().body.map(paragraph => maoka.html.p(() => () => paragraph)()),
		maoka.html.p(() => () => maoka.html.strong(() => () => "Runtime exports")())(),
		UsageList(() => ({ items: props().runtime })),
		maoka.html.p(() => () => maoka.html.strong(() => () => "Type exports")())(),
		UsageList(() => ({ items: props().types })),
		CodeBlock(() => ({ ts: props().code, noShadow: true })),
	]
})

const SignatureBlock = maoka.html.div(({ props, value }) => {
	return () =>
		RainbowCard(() => ({
			className: "signature-list",
			children: [
				maoka.html.p(() => () => maoka.html.strong(() => () => "Signature")())(),
				CodeBlock(() => ({ ts: props().signature, noShadow: true })),
			],
		}))
})

const UsageList = maoka.html.div(({ props }) => {
	return () =>
		RainbowCard(() => ({
			className: "behavior-list",
			children: [
				maoka.html.ul(({ value }) => {
					value.className = "behavior-items"

					return () => props().items.map(item => maoka.html.li(() => () => item)())
				})(),
			],
		}))
})

const TagList = maoka.html.div(({ props, value }) => {
	value.className = "tag-list"

	return () =>
		props().tags.map(tag =>
			maoka.html.code(({ value }) => {
				value.className = "tag-chip"

				return () => tag
			})(() => ({ key: tag })),
		)
})

render(document.body, Page())
