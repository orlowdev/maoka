import type { Maoka } from "../maoka.d.ts"

export type MaokaTestValue = {
	tag: string
	text: string
	parent: MaokaTestValue | null
	children: MaokaTestValue[]
	attrs?: Map<string, string | true>
	[property: string]: any
}

export interface MaokaTest {
	jabs: MaokaTest.Jabs
}

export namespace MaokaTest {
	export type IfInTest = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
		$Return = void,
	>(
		callback: (params: Maoka.Params<MaokaTestValue, $Props>) => $Return,
	) => Maoka.Jab<MaokaTestValue, $Props, $Return | undefined>

	export type AttributeGet = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		name: string,
	) => Maoka.Jab<MaokaTestValue, $Props, string | undefined>

	export type AttributeSet = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		name: string,
		value?: string,
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type AttributeAssign = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		name: string,
		getValue: () => string | null | undefined,
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type ClassesSet = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		...classes: string[]
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type ClassesAdd = ClassesSet
	export type ClassesRemove = ClassesSet

	export type ClassesHas = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		className: string,
	) => Maoka.Jab<MaokaTestValue, $Props, boolean | undefined>

	export type ClassesAssign = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		getClassName: () => string | null | undefined,
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type ClassesToggle = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		getEnabled: () => boolean,
		className: string,
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type SetId = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		id: string,
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type AssignId = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		getId: () => string | null | undefined,
	) => Maoka.Jab<MaokaTestValue, $Props>

	export type Jabs = {
		ifInTest: IfInTest
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
}

export type MaokaTestJson = {
	tag: string
	text?: string
	children?: MaokaTestJson[]
}

export type MaokaTestRenderer = {
	root: Maoka.Root<MaokaTestValue>
	node: Maoka.Node<MaokaTestValue, any>
	value: MaokaTestValue
	flush: () => void
	refresh: () => void
	find: (predicate: (value: MaokaTestValue) => boolean) => MaokaTestValue | undefined
	findAll: (predicate: (value: MaokaTestValue) => boolean) => MaokaTestValue[]
	findByTag: (tag: string) => MaokaTestValue | undefined
	findAllByTag: (tag: string) => MaokaTestValue[]
	text: () => string
	toJSON: () => MaokaTestJson
}

export type MaokaTestRenderOptions = {
	createKey?: () => Maoka.Key
	value?: MaokaTestValue
}

export type MaokaTestJabRenderer<$Return> = MaokaTestRenderer & {
	params: () => Maoka.Params<MaokaTestValue, any>
	result: () => $Return
}

export type MaokaTestJabOptions<$Return> = MaokaTestRenderOptions & {
	props?: Maoka.Props<any>
	template?: (
		result: $Return,
		params: Maoka.Params<MaokaTestValue, any>,
	) => Maoka.Template
}

export const createValue: (tag: string) => MaokaTestValue

export const render: (
	component: Maoka.Component<MaokaTestValue>,
	options?: MaokaTestRenderOptions,
) => MaokaTestRenderer

export const renderJab: <$Return>(
	jab: Maoka.Jab<MaokaTestValue, any, $Return>,
	options?: MaokaTestJabOptions<$Return>,
) => MaokaTestJabRenderer<$Return>

export const setup: typeof renderJab

declare const maokaTest: MaokaTest

export default maokaTest
