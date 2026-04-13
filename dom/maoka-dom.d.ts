import { Maoka } from "../maoka.d.ts"

export type MaokaDomRenderOptions = {
	createKey?: () => Maoka.Key
}

export const render: (
	container: Element,
	component: Maoka.Blueprint | Maoka.Component<Element>,
	options?: MaokaDomRenderOptions,
) => Maoka.Root<Element>
