import type { Maoka } from "../maoka.d.ts"

export interface MaokaString {
	jabs: MaokaString.Jabs
	guards: MaokaString.Guards
}

export namespace MaokaString {
	export type Value = {
		tag: string
		namespace: Maoka.Namespace | null
		text: string
		children: Value[]
		parent: Value | null
		attrs: Map<string, string | true>
	}

	export type Guards = {
		isStringValue: (value: unknown) => value is Value
		isStringNode: (value: unknown) => value is Maoka.Node<Value>
	}

	export type IfInString = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
		$Return = void,
	>(
		callback: (params: Maoka.Params<Value, $Props>) => $Return,
	) => Maoka.Jab<Value, $Props, $Return | undefined>

	export type AttributeGet = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		name: string,
	) => Maoka.Jab<Value, $Props, string | undefined>

	export type AttributeSet = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		name: string,
		value?: string,
	) => Maoka.Jab<Value, $Props>

	export type AttributeAssign = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		name: string,
		getValue: () => string | null | undefined,
	) => Maoka.Jab<Value, $Props>

	export type ClassesSet = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		...classes: string[]
	) => Maoka.Jab<Value, $Props>

	export type ClassesAdd = ClassesSet
	export type ClassesRemove = ClassesSet

	export type ClassesHas = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		className: string,
	) => Maoka.Jab<Value, $Props, boolean | undefined>

	export type ClassesAssign = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		getClassName: () => string | null | undefined,
	) => Maoka.Jab<Value, $Props>

	export type ClassesToggle = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		getEnabled: () => boolean,
		className: string,
	) => Maoka.Jab<Value, $Props>

	export type SetId = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		id: string,
	) => Maoka.Jab<Value, $Props>

	export type AssignId = <
		$Props extends Maoka.BaseProps = Maoka.NoProps,
	>(
		getId: () => string | null | undefined,
	) => Maoka.Jab<Value, $Props>

	export type Jabs = {
		ifInString: IfInString
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

	export type RenderOptions = {
		createKey?: () => Maoka.Key
	}
}

export type MaokaStringRenderOptions = MaokaString.RenderOptions

export const render: (
	component: Maoka.Component<any>,
	options?: MaokaStringRenderOptions,
) => string

export const isStringValue: MaokaString.Guards["isStringValue"]
export const isStringNode: MaokaString.Guards["isStringNode"]

declare const maokaString: MaokaString

export default maokaString
