import "./style.css"
import maoka, { MAOKA } from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import {
	DocsArticle,
	DocsLayout,
	DocsPageBoundary,
} from "../../src/components/docs-page.js"
import { NotebookSheet } from "../../src/components/notebook-sheet.js"
import { RainbowCard } from "../../src/components/rainbow-card.js"
import { SiteFooter } from "../../src/components/site-footer.js"
import { ThemeToggle } from "../../src/components/theme-toggle.js"

const importExample = `import maoka, { MAOKA, type Maoka } from "maoka"`

const counterValueJs = `const CounterValue = maoka.html.output(({ props }) => {
	return () => String(props().count)
})`

const incrementButtonJs = `const IncrementButton = maoka.html.button(({ props, use, value }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	value.onclick = () => props().increment()

	return () => "Increment"
})`

const incrementButtonTs = `const IncrementButton = maoka.html.button<{
	increment: () => void
}>(({ props, use, value }) => {
	use(maoka.jabs.attributes.set("type", "button"))
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

const pureExampleJs = `const Badge = maoka.pure("span", ({ props, use }) => {
	use(maoka.jabs.classes.set("badge"))

	return () => props().label
})`

const pureExampleTs = `const Badge = maoka.pure<{ label: string }>("span", ({ props, use }) => {
	use(maoka.jabs.classes.set("badge"))

	return () => props().label
})`

const taggedExampleJs = `const Notice = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.dataAttributes.assign("kind", () => props().kind))

	return () => props().message
})`

const taggedExampleTs = `const Notice = maoka.html.section<{
	kind: "info" | "warning"
	message: string
}>(({ props, use }) => {
	use(maoka.jabs.dataAttributes.assign("kind", () => props().kind))

	return () => props().message
})`

const jabsExampleJs = `const Price = maoka.html.output(({ props, use }) => {
	use(maoka.jabs.setId("price"))
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)
	use(
		maoka.jabs.dataAttributes.assign("trend", () =>
			props().change >= 0 ? "up" : "down",
		),
	)
	use(
		maoka.jabs.aria.assign("label", () => \`Price \${props().value}\`),
	)
	use(
		maoka.jabs.classes.assign(() =>
			props().change >= 0 ? "price is-up" : "price is-down",
		),
	)

	return () => \`$\${props().value}\`
})`

const jabsExampleTs = `const Price = maoka.html.output<{
	value: number
	change: number
}>(({ props, use }) => {
	use(maoka.jabs.setId("price"))
	use(
		maoka.jabs.shouldComponentRefresh(
			(prevProps, nextProps) => prevProps.value !== nextProps.value,
		),
	)
	use(
		maoka.jabs.dataAttributes.assign("trend", () =>
			props().change >= 0 ? "up" : "down",
		),
	)
	use(
		maoka.jabs.aria.assign("label", () => \`Price \${props().value}\`),
	)
	use(
		maoka.jabs.classes.assign(() =>
			props().change >= 0 ? "price is-up" : "price is-down",
		),
	)

	return () => \`$\${props().value}\`
})`

const domRenderExampleTs = `import maoka from "maoka"
import maokaDom, { render, type MaokaDom } from "maoka/dom"

const FocusInput = maoka.html.input(({ lifecycle, use }) => {
	use(maoka.jabs.attributes.set("type", "text"))

	const input = use(maokaDom.jabs.ifInDOM<HTMLInputElement>(({ value }) => value))

	lifecycle.afterMount(() => {
		input?.focus()
	})
})

render(document.body, FocusInput())`

const testRenderExampleTs = `import maoka from "maoka"
import maokaTest, { render, renderJab } from "maoka/test"

const Label = maoka.html.span<{ text: string }>(
	({ props }) => () => props().text,
)

const screen = render(Label(() => ({ text: "Ready" })))
screen.text()

const probe = renderJab(
	maokaTest.jabs.ifInTest(({ value }) => value.tag),
)
probe.result()`

const stringRenderExampleTs = `import maoka from "maoka"
import maokaString, { render, type MaokaString } from "maoka/string"

const Badge = maoka.html.span(({ use }) => {
	use(maoka.jabs.classes.set("badge"))
	const tag = use(maokaString.jabs.ifInString(({ value }) => value.tag))

	void tag
	return () => "Ready"
})

const html = render(Badge())
const stringRenderer: MaokaString = maokaString

void html
void stringRenderer`

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
	{
		id: "maoka-jabs-attributes",
		title: "maoka.jabs.attributes",
		signature: `attributes: {
	get(name: string): Maoka.Jab<any, any, string | undefined>
	set(name: string, value?: string): Maoka.Jab
	assign(
		name: string,
		getValue: () => string | null | undefined,
	): Maoka.Jab
}`,
		body: [
			"Shared attribute jabs for renderer values that support attribute-style mutation.",
			"`get` reads the current attribute value, `set` writes once during create, and `assign` keeps the attribute synchronized across refreshes without forcing render-phase work on its own.",
		],
		usage: [
			"Use for generic HTML, SVG, MathML, string-renderer, and test-renderer attribute work that does not need imperative platform APIs.",
			"`assign` removes the attribute when `getValue()` returns `null` or `undefined`.",
		],
	},
	{
		id: "maoka-jabs-classes",
		title: "maoka.jabs.classes",
		signature: `classes: {
	set(...classes: string[]): Maoka.Jab
	add(...classes: string[]): Maoka.Jab
	remove(...classes: string[]): Maoka.Jab
	has(className: string): Maoka.Jab<any, any, boolean | undefined>
	toggle(
		getEnabled: () => boolean,
		className: string,
	): Maoka.Jab
	assign(
		getClassName: () => string | null | undefined,
	): Maoka.Jab
}`,
		body: [
			"Shared class-list helpers built on top of renderer-specific class mutation logic.",
			"They normalize tokens, reject invalid whitespace-bearing class names, and provide both one-shot and refresh-synchronized forms.",
		],
		usage: [
			"Use `set`, `add`, and `remove` for create-phase class wiring; use `assign` or `toggle` when the class output must track state or props over refreshes.",
			"`has` returns `undefined` when the active renderer value does not implement the class helper contract.",
		],
	},
	{
		id: "maoka-jabs-data-attributes",
		title: "maoka.jabs.dataAttributes",
		signature: `dataAttributes: {
	get(name: string): Maoka.Jab<any, any, string | undefined>
	set(name: string, value?: string): Maoka.Jab
	assign(
		name: string,
		getValue: () => string | null | undefined,
	): Maoka.Jab
}`,
		body: [
			"Convenience wrapper over `maoka.jabs.attributes` that automatically prefixes names with `data-`.",
			"It keeps docs and application code explicit about semantic `data-*` usage without manual string concatenation.",
		],
		usage: [
			"Use when the attribute is semantically part of `dataset` rather than a generic attribute slot.",
			"`get(\"kind\")` reads `data-kind`; `assign(\"state\", ...)` keeps `data-state` synchronized over refreshes.",
		],
	},
	{
		id: "maoka-jabs-aria",
		title: "maoka.jabs.aria",
		signature: `aria: {
	get(name: string): Maoka.Jab<any, any, string | undefined>
	set(name: string, value?: string): Maoka.Jab
	assign(
		name: string,
		getValue: () => string | null | undefined,
	): Maoka.Jab
}`,
		body: [
			"Convenience wrapper over `maoka.jabs.attributes` that automatically prefixes names with `aria-`.",
			"It keeps accessibility attributes close to the component or behavior layer that owns them.",
		],
		usage: [
			"Use for stable ARIA wiring such as labels, expanded state, or pressed state that should stay declarative.",
			"`assign` is a good fit when ARIA state mirrors props or local component state.",
		],
	},
	{
		id: "maoka-jabs-set-id",
		title: "maoka.jabs.setId",
		signature: `setId(id: string): Maoka.Jab`,
		body: [
			"Convenience jab equivalent to `maoka.jabs.attributes.set(\"id\", id)`.",
			"It exists because ids are common enough to deserve a direct entry point when composing other attribute jabs.",
		],
		usage: [
			"Use for stable ids decided during the create phase.",
			"If the id depends on refreshable state or props, prefer `assignId`.",
		],
	},
	{
		id: "maoka-jabs-assign-id",
		title: "maoka.jabs.assignId",
		signature: `assignId(
	getId: () => string | null | undefined,
): Maoka.Jab`,
		body: [
			"Convenience jab equivalent to `maoka.jabs.attributes.assign(\"id\", getId)`.",
			"It keeps ids synchronized across refreshes and removes the id when the getter returns `null` or `undefined`.",
		],
		usage: [
			"Use when an id is derived from props, local state, or externally controlled naming schemes.",
			"Like other assign jabs, it updates the renderer value only when the computed id actually changes.",
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
			"`render(container, component, options?) => Maoka.Root<Element>` mounts a component instance into a DOM container.",
			"`default maokaDom` exposes `ifInDOM`, `attributes`, `classes`, `dataAttributes`, `aria`, `setId`, and `assignId` under `maokaDom.jabs`.",
		],
		types: [
			"`namespace MaokaDom` exports `IfInDom` plus the DOM-specific attribute, class, and id jab helper types.",
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
			"`render(component, options?) => MaokaTestRenderer` mounts a component instance and returns helpers such as `flush`, `text`, `find`, `findByTag`, and `toJSON`.",
			"`renderJab(jab, options?) => MaokaTestJabRenderer<$Return>` runs a jab inside a probe component and exposes both `params()` and `result()`.",
			"`default maokaTest` exposes `ifInTest`, `attributes`, `classes`, `dataAttributes`, `aria`, `setId`, and `assignId` under `maokaTest.jabs`.",
			"`setup` is an alias of `renderJab`.",
		],
		types: [
			"`MaokaTestValue` models a tree node with `tag`, `text`, `parent`, `children`, and arbitrary extra fields.",
			"`MaokaTestJson` is the serialized snapshot shape returned by `toJSON()`.",
			"`namespace MaokaTest` also exports `IfInTest` plus the test-renderer attribute, class, and id jab helper types.",
			"`MaokaTestRenderer`, `MaokaTestJabRenderer<$Return>`, `MaokaTestRenderOptions`, and `MaokaTestJabOptions<$Return>` describe the test helpers and options surface.",
		],
		code: testRenderExampleTs,
	},
	{
		id: "subpackage-string",
		title: "`maoka/string`",
		importLine: `import maokaString, { render, type MaokaString } from "maoka/string"`,
		body: [
			"HTML string renderer for Maoka components. It renders a component instance into serialized markup and exposes string-aware jab helpers through the default export.",
			"The package is intended for one-shot SSR-style rendering. It preserves Maoka create/render semantics while serializing a safe subset of renderer value mutations into HTML attributes.",
		],
		runtime: [
			"`render(component, options?) => string` mounts a component instance into an internal tree and returns serialized HTML markup.",
			"`default maokaString` exposes `ifInString`, `attributes`, `classes`, `dataAttributes`, `aria`, `setId`, and `assignId` under `maokaString.jabs`.",
		],
		types: [
			"`type MaokaString` describes the default namespace shape.",
			"`namespace MaokaString` exports `IfInString` plus the string-renderer attribute, class, and id jab helper types.",
			"`namespace MaokaString` also exports `RenderOptions`, and `MaokaStringRenderOptions` currently exposes `createKey?: () => Maoka.Key`.",
		],
		code: stringRenderExampleTs,
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
			"They are part of the exported type surface, but most application code uses them indirectly through `maoka/dom`, `maoka/string`, `maoka/test`, or custom renderer implementations.",
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
	attributes: {
		get: AttributeGet
		set: AttributeSet
		assign: AttributeAssign
	}
	classes: {
		set: ClassesSet
		add: ClassesAdd
		remove: ClassesRemove
		has: ClassesHas
		toggle: ClassesToggle
		assign: ClassesAssign
	}
	dataAttributes: {
		get: AttributeGet
		set: AttributeSet
		assign: AttributeAssign
	}
	aria: {
		get: AttributeGet
		set: AttributeSet
		assign: AttributeAssign
	}
	setId: SetId
	assignId: AssignId
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

const Page = maoka.create(() =>
	() =>
		DocsLayout(() => ({
			children: DocsArticle(() => ({
				className: "api-page",
				children: [
					Hero(),
					ScopeSection(),
					SubpackagesSection(),
					ExportsSection(),
					DefaultExportSection(),
					ConstantsSection(),
					TypesSection(),
					BehaviorSection(),
					SiteFooter(),
				],
			})),
		})),
)

const ApiHeroEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow"))

	return () => "Root package reference"
})

const ApiHeroTitle = maoka.html.h1(() => () => "API Reference")

const ApiHeroLead = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("lede"))

	return () =>
		"Formal reference for the public surface of the `maoka` root entrypoint, including runtime exports, type exports, nested members, and the behavioral rules that shape their use."
})

const PageSectionTitle = maoka.html.h2(({ props }) => () => props().text)

const SectionIntro = maoka.html.p(({ props, use }) => {
	use(maoka.jabs.classes.set("section-intro"))

	return () => props().text
})

const SectionSubheading = maoka.html.h3(({ props }) => () => props().text)

const ImportsBlock = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("imports-block"))

	return () => CodeBlock(() => ({ ts: props().code, noShadow: true }))
})

const ApiGrid = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("api-grid"))

	return () => props().children
})

const TagGrid = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("tag-grid"))

	return () => props().children
})

const TypeGrid = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("type-grid"))

	return () => props().children
})

const ApiCard = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => props().className ?? "api-card"))

	return () => props().children
})

const ExportsTable = maoka.html.table(({ props, use }) => {
	use(maoka.jabs.classes.set("exports-table"))

	return () => props().children
})

const ExportHeaderCell = maoka.html.th(({ props }) => () => props().text)

const ExportHeaderRow = maoka.html.tr(() => () => [
	ExportHeaderCell(() => ({ text: "Export" })),
	ExportHeaderCell(() => ({ text: "Kind" })),
	ExportHeaderCell(() => ({ text: "Import" })),
	ExportHeaderCell(() => ({ text: "Purpose" })),
])

const ExportsHead = maoka.html.thead(() => () => ExportHeaderRow())

const CodeText = maoka.html.code(({ props }) => () => props().text)

const TableCell = maoka.html.td(({ props }) => () => props().text)

const CodeCell = maoka.html.td(({ props }) => () =>
	CodeText(() => ({ text: props().text })),
)

const ExportRow = maoka.html.tr(({ props }) => () => [
	CodeCell(() => ({ text: props().symbol })),
	TableCell(() => ({ text: props().kind })),
	CodeCell(() => ({ text: props().importLine })),
	TableCell(() => ({ text: props().description })),
])

const ExportsBody = maoka.html.tbody(({ props }) => () =>
	props().rows.map(row => ExportRow(() => ({ key: row.symbol, ...row }))),
)

const BehaviorCard = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("api-card", "behavior-card"))

	return () => props().children
})

const BehaviorNoteList = maoka.html.ol(({ props, use }) => {
	use(maoka.jabs.classes.set("behavior-items"))

	return () =>
		props().items.map(item => BehaviorItem(() => ({ key: item, text: item })))
})

const Hero = maoka.html.header(() => () => [
	ThemeToggle(),
	ApiHeroEyebrow(),
	ApiHeroTitle(),
	ApiHeroLead(),
])

const ScopeSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("scope"))

	return () => [
		PageSectionTitle(() => ({ text: "Scope" })),
		NotebookSheet(() => ({
			variant: "note",
			className: "scope-note",
			children: [
				TextParagraph(() => ({
					text: "This page documents the public API of the package root entrypoint `maoka`. It covers the default export `maoka`, the named export `MAOKA`, the exported `type Maoka`, and the exported `namespace Maoka` declarations.",
				})),
				TextParagraph(() => ({
					text: "The main reference below remains focused on the root entrypoint. A separate section on this page summarizes the related `maoka/dom`, `maoka/string`, and `maoka/test` subpackages, while `maoka/rendering` remains excluded. Type signatures are aligned with `maoka.d.ts`, `dom/maoka-dom.d.ts`, `string/maoka-string.d.ts`, and `test/maoka-test.d.ts` where applicable.",
				})),
				ImportsBlock(() => ({ code: importExample })),
			],
		})),
	]
})

const SubpackagesSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("subpackages"))

	return () => [
		PageSectionTitle(() => ({ text: "Related subpackages" })),
		SectionIntro(() => ({
			text: "`maoka/dom`, `maoka/string`, and `maoka/test` are separate entrypoints built on top of the root API. They are documented here as companion packages rather than as part of the root module surface.",
		})),
		ApiGrid(() => ({
			children: subpackages.map(pkg => SubpackageCard(() => pkg)),
		})),
	]
})

const ExportsSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("exports"))

	return () => [
		PageSectionTitle(() => ({ text: "Exports" })),
		SectionIntro(() => ({
			text: "The root module exposes one primary runtime namespace, one runtime constant namespace, and one top-level type namespace.",
		})),
		ExportsTable(() => ({
			children: [ExportsHead(), ExportsBody(() => ({ rows: exportsRows }))],
		})),
	]
})

const DefaultExportSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("default-export"))

	return () => [
		PageSectionTitle(() => ({ text: "Default export `maoka`" })),
		SectionIntro(() => ({
			text: "`maoka` is the primary runtime namespace. Its members either create blueprints directly, provide pre-bound tagged blueprint factories, or attach built-in behavior through jabs.",
		})),
		ApiGrid(() => ({
			children: defaultMembers.map(member => ApiMember(() => member)),
		})),
		SectionSubheading(() => ({ text: "maoka.jabs" })),
		ApiCard(() => ({
			children: [
				TextParagraph(() => ({
					text: "`maoka.jabs` groups the built-in jabs exported from the root module. Each member is a `Maoka.Jab` or a factory that returns a `Maoka.Jab`.",
				})),
				CodeBlock(() => ({
					js: jabsExampleJs,
					ts: jabsExampleTs,
					noShadow: true,
				})),
			],
		})),
		ApiGrid(() => ({
			children: jabMembers.map(member => ApiMember(() => member)),
		})),
	]
})

const ConstantsSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("maoka-constants"))

	return () => [
		PageSectionTitle(() => ({ text: "Named export `MAOKA`" })),
		SectionIntro(() => ({
			text: "`MAOKA` is a runtime namespace of tag constant arrays re-exported from `src/maoka.constants.js`. It is intended for introspection, tooling, and support code that needs to enumerate the built-in tagged component members.",
		})),
		TagGrid(() => ({
			children: constantGroups.map(group => TagGroup(() => group)),
		})),
	]
})

const TypesSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("types"))

	return () => [
		PageSectionTitle(() => ({ text: "Type reference" })),
		SectionIntro(() => ({
			text: "The exported type surface is rooted in `type Maoka` and `namespace Maoka`. The following groups preserve the public declarations while presenting them in a readable form.",
		})),
		TypeGrid(() => ({
			children: typeGroups.map(group => TypeGroup(() => group)),
		})),
	]
})

const BehaviorSection = maoka.html.section(({ use }) => {
	use(maoka.jabs.setId("behavior-notes"))

	return () => [
		PageSectionTitle(() => ({ text: "Usage and behavior notes" })),
		BehaviorCard(() => ({
			children: [
				BehaviorNoteList(() => ({ items: behaviorNotes })),
			],
		})),
	]
})

const CardTitle = maoka.html.h3(({ props }) => () => props().text)

const TextParagraph = maoka.html.p(({ props }) => () => props().text)

const StrongText = maoka.html.strong(({ props }) => () => props().text)

const StrongParagraph = maoka.html.p(({ props }) => () =>
	StrongText(() => ({ text: props().text })),
)

const BehaviorItem = maoka.html.li(({ props }) => () => props().text)

const BehaviorItems = maoka.html.ul(({ props, use }) => {
	use(maoka.jabs.classes.set("behavior-items"))

	return () =>
		props().items.map(item => BehaviorItem(() => ({ key: item, text: item })))
})

const TagChip = maoka.html.code(({ props, use }) => {
	use(maoka.jabs.classes.set("tag-chip"))

	return () => props().tag
})

const TypeGroupEyebrow = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("eyebrow", "is-soft"))

	return () => "Type group"
})

const SignatureHeading = maoka.html.p(({ props }) => () =>
	StrongText(() => ({ text: props().text })),
)

const ApiMember = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))
	use(maoka.jabs.classes.set("api-card"))

	return () => [
		CardTitle(() => ({ text: props().title })),
		SignatureBlock(() => ({ signature: props().signature })),
		...props().body.map(paragraph =>
			TextParagraph(() => ({ key: paragraph, text: paragraph })),
		),
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

const TagGroup = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))
	use(maoka.jabs.classes.set("tag-group"))

	return () => [
		CardTitle(() => ({ text: props().title })),
		SignatureBlock(() => ({ signature: props().signature })),
		TextParagraph(() => ({ text: props().body })),
		TagList(() => ({ tags: props().tags })),
	]
})

const TypeGroup = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))
	use(maoka.jabs.classes.set("type-group"))

	return () => [
		TypeGroupEyebrow(),
		CardTitle(() => ({ text: props().title })),
		...props().body.map(paragraph =>
			TextParagraph(() => ({ key: paragraph, text: paragraph })),
		),
		CodeBlock(() => ({ ts: props().code, noShadow: true })),
	]
})

const SubpackageCard = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.assignId(() => props().id))
	use(maoka.jabs.classes.set("api-card"))

	return () => [
		CardTitle(() => ({ text: props().title })),
		SignatureBlock(() => ({ signature: props().importLine })),
		...props().body.map(paragraph =>
			TextParagraph(() => ({ key: paragraph, text: paragraph })),
		),
		StrongParagraph(() => ({ text: "Runtime exports" })),
		UsageList(() => ({ items: props().runtime })),
		StrongParagraph(() => ({ text: "Type exports" })),
		UsageList(() => ({ items: props().types })),
		CodeBlock(() => ({ ts: props().code, noShadow: true })),
	]
})

const SignatureBlock = maoka.html.div(({ props }) => {
	return () =>
		RainbowCard(() => ({
			className: "signature-list",
			children: [
				SignatureHeading(() => ({ text: "Signature" })),
				CodeBlock(() => ({ ts: props().signature, noShadow: true })),
			],
		}))
})

const UsageList = maoka.html.div(({ props }) => {
	return () =>
		RainbowCard(() => ({
			className: "behavior-list",
			children: [BehaviorItems(() => ({ items: props().items }))],
		}))
})

const TagList = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("tag-list"))

	return () =>
		props().tags.map(tag =>
			TagChip(() => ({ key: tag, tag })),
		)
})

render(
	document.body,
	DocsPageBoundary(() => ({
		children: Page(),
	})),
)
