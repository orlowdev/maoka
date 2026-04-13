export type Maoka = {
	create: Maoka.Create
	pure: Maoka.Pure
	html: Record<Maoka.HtmlTag, Maoka.TaggedComponent>
	svg: Record<Maoka.SvgTag, Maoka.TaggedComponent>
	math: Record<Maoka.MathMlTag, Maoka.TaggedComponent>
}

export namespace Maoka {
	type Key = string | number
	type Namespace = "html" | "svg" | "math"
	type Tag = string | { namespace: Namespace; tag: string }

	type KeyProps = { key?: Key }
	type NoProps = void
	type BaseProps = Record<string, any> | NoProps
	type Props<$Props extends BaseProps = NoProps> = $Props extends NoProps
		? (() => KeyProps) | NoProps
		: $Props extends KeyProps
			? () => $Props
			: () => $Props & KeyProps
	type DefinitionProps<$Props extends BaseProps> = $Props extends NoProps
		? () => Required<KeyProps>
		: $Props extends Required<KeyProps>
			? () => $Props
			: () => $Props & Required<KeyProps>

	type Jab<$Type = any, $Props extends BaseProps = NoProps, $Return = void> = (
		params: Params<$Type, $Props>,
	) => $Return

	type Use<$Type = any, $Props extends BaseProps = NoProps, $Return = void> = (
		jab: Jab<$Type, $Props, $Return>,
	) => $Return

	type Refresh$ = () => void

	type RefreshHandler = () => boolean | void

	type ErrorHandler = (error: Error) => void

	type Lifecycle = {
		onRefresh: (handler: RefreshHandler) => void
		onError: (handler: ErrorHandler) => void
	}

	type Params<$Type = any, $Props extends BaseProps = NoProps> = {
		key: Key
		rootKey: Key
		parentKey: Key
		use: Use<$Type, $Props>
		value: $Type
		refresh$: Refresh$
		props$: DefinitionProps<$Props>
		lifecycle: Lifecycle
	}

	type Template = any

	type Render = () => Template

	type ComponentDefinition<$Props extends BaseProps = NoProps, $Type = any> = (
		params: Params<$Type, $Props>,
	) => Render

	type Root<$Type = any> = {
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

	type Blueprint<$Props extends BaseProps = NoProps> = $Props extends NoProps
		? (props?: Props<$Props>) => Maoka.Component<any, $Props>
		: (props: Props<$Props>) => Maoka.Component<any, $Props>

	type Node<$Type = any, $Props extends BaseProps = NoProps> = {
		key: Key
		value: $Type
		props: $Props
		props$: DefinitionProps<$Props>
		root: Root<$Type>
		render: Render
		template: Template
		parent: Node<$Type, any>
		children: Node<$Type, any>[]
		refresh$: Refresh$
		lifecycleHandlers: {
			refresh: RefreshHandler[]
			error: ErrorHandler[]
		}
	}

	type Component<$Type = any, $Props extends BaseProps = NoProps> = (
		root: Root<$Type>,
		parent: Node,
	) => Node<$Type, $Props>

	type Create = <$Props extends Maoka.BaseProps = Maoka.NoProps>(
		definition: Maoka.ComponentDefinition<$Props>,
	) => Blueprint<$Props>

	type Pure = <$Props extends Maoka.BaseProps = Maoka.NoProps>(
		tag: string,
		definition: Maoka.ComponentDefinition<$Props>,
	) => Blueprint<$Props>

	type HtmlTag = keyof HTMLElementTagNameMap
	type SvgTag = keyof SVGElementTagNameMap
	type MathMlTag = keyof MathMLElementTagNameMap

	type TaggedComponent = <$Props extends Maoka.BaseProps = Maoka.NoProps>(
		definition: Maoka.ComponentDefinition<$Props>,
	) => Blueprint<$Props>
}
