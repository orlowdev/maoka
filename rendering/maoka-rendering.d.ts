import type { Maoka } from "../maoka.d.ts"

export namespace MaokaRendering {
	export type Root<$Type = any> = Maoka.Root<$Type>
	export type RootOptions<$Type = any> = Maoka.RootOptions<$Type>
}

export const createRoot: <$Type = any>(
	options: MaokaRendering.RootOptions<$Type>,
) => MaokaRendering.Root<$Type>
