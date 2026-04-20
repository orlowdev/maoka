import type { MaokaDom } from "./dom/maoka-dom.d.ts"
import type { MaokaString } from "./string/maoka-string.d.ts"
import type { MaokaTest } from "./test/maoka-test.d.ts"

export type Maoka = {
	create: Maoka.Create
	pure: Maoka.Pure
	html: Record<Maoka.HtmlTag, Maoka.TaggedComponent>
	svg: Record<Maoka.SvgTag, Maoka.TaggedComponent>
	math: Record<Maoka.MathMlTag, Maoka.TaggedComponent>
	jabs: Maoka.Jabs
	guards: Maoka.Guards
}

declare const maoka: Maoka

export default maoka

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

	type AttributeGet =
		& MaokaDom.AttributeGet
		& MaokaString.AttributeGet
		& MaokaTest.AttributeGet

	type AttributeSet =
		& MaokaDom.AttributeSet
		& MaokaString.AttributeSet
		& MaokaTest.AttributeSet

	type AttributeAssign =
		& MaokaDom.AttributeAssign
		& MaokaString.AttributeAssign
		& MaokaTest.AttributeAssign

	type ClassesSet =
		& MaokaDom.ClassesSet
		& MaokaString.ClassesSet
		& MaokaTest.ClassesSet

	type ClassesAdd =
		& MaokaDom.ClassesAdd
		& MaokaString.ClassesAdd
		& MaokaTest.ClassesAdd

	type ClassesRemove =
		& MaokaDom.ClassesRemove
		& MaokaString.ClassesRemove
		& MaokaTest.ClassesRemove

	type ClassesHas =
		& MaokaDom.ClassesHas
		& MaokaString.ClassesHas
		& MaokaTest.ClassesHas

	type ClassesAssign =
		& MaokaDom.ClassesAssign
		& MaokaString.ClassesAssign
		& MaokaTest.ClassesAssign

	type ClassesToggle =
		& MaokaDom.ClassesToggle
		& MaokaString.ClassesToggle
		& MaokaTest.ClassesToggle

	type SetId =
		& MaokaDom.SetId
		& MaokaString.SetId
		& MaokaTest.SetId

	type AssignId =
		& MaokaDom.AssignId
		& MaokaString.AssignId
		& MaokaTest.AssignId

	type Jabs = {
		noRefresh: Jab
		shouldComponentRefresh: <$Props extends BaseProps = NoProps>(
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

	type Guards = {
		isComponent: (value: unknown) => value is Component<any, any>
		isBlueprint: (value: unknown) => value is Blueprint<any>
		isNode: (value: unknown) => value is Node<any, any>
	}

	type Refresh$ = () => void

	type BeforeRefreshContinuation = () =>
		| boolean
		| void
		| Promise<boolean | void>

	type BeforeRefreshHandler = () => boolean | void | BeforeRefreshContinuation

	type DescendantError = {
		error: Error
		handled: boolean
		handle: () => void
	}

	type ErrorHandler = (error?: Error, descendantError?: DescendantError) => void

	type AfterUnmountHandler = () => void

	type AfterMountHandler = () => AfterUnmountHandler | void

	type BeforeUnmountHandler = () => void

	type Lifecycle = {
		afterMount: (handler: AfterMountHandler) => void
		beforeRefresh: (handler: BeforeRefreshHandler) => void
		onError: (handler: ErrorHandler) => void
		beforeUnmount: (handler: BeforeUnmountHandler) => void
		afterUnmount: (handler: AfterUnmountHandler) => void
	}

	type Params<$Type = any, $Props extends BaseProps = NoProps> = {
		key: Key
		rootKey: Key
		parentKey: Key
		use: Use<$Type, $Props>
		value: $Type
		refresh$: Refresh$
		props: DefinitionProps<$Props>
		lifecycle: Lifecycle
	}

	type Template = any

	type Render = () => Template

	type ComponentDefinition<$Props extends BaseProps = NoProps, $Type = any> = (
		params: Params<$Type, $Props>,
	) => Render | void

	type BeforeCreateHandler<$Type = any, $Props extends BaseProps = NoProps> = (
		params: Params<$Type, $Props>,
	) => void

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
		props: DefinitionProps<$Props>
		root: Root<$Type>
		render: Render
		hasRenderPhase: boolean
		lastRenderResult: Template
		parent: Node<$Type, any>
		children: Node<$Type, any>[]
		refresh$: Refresh$
		lifecycleHandlers: {
			afterMount: AfterMountHandler[]
			beforeRefresh: BeforeRefreshHandler[]
			error: ErrorHandler[]
			beforeUnmount: BeforeUnmountHandler[]
			afterUnmount: AfterUnmountHandler[]
		}
		mounted: boolean
	}

	type Component<$Type = any, $Props extends BaseProps = NoProps> = ((
		root: Root<$Type>,
		parent: Node,
	) => Node<$Type, $Props>) & {
		beforeCreate: (
			handler: BeforeCreateHandler<$Type, $Props>,
		) => Component<$Type, $Props>
	}

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
