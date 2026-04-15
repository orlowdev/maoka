import { Maoka } from "../maoka.d.ts"

export namespace MaokaDom {
	export type IfInDom = <
		$Element extends Element = HTMLElement,
		$Props extends Maoka.BaseProps = Maoka.NoProps,
		$Return = void,
	>(
		callback: (params: Maoka.Params<$Element, $Props>) => $Return,
	) => Maoka.Jab<$Return>
}

export type MaokaDomRenderOptions = {
	createKey?: () => Maoka.Key
}

export const render: (
	container: Element,
	component: Maoka.Component<Element>,
	options?: MaokaDomRenderOptions,
) => Maoka.Root<Element>
