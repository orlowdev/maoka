/** @import { MaokaDom } from "../maoka-dom.d.ts" */

/** @type {MaokaDom.IfInDom} */
export const ifInDOM = callback => params => {
	if (globalThis.Element && params.value instanceof globalThis.Element) callback(params)
}
