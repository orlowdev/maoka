import type { Maoka } from "../maoka.d.ts"

export type MaokaTestValue = {
	tag: string
	text: string
	parent: MaokaTestValue | null
	children: MaokaTestValue[]
	[property: string]: any
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
