/** @import { Maoka } from "./maoka.d.ts" */

export * as MAOKA from "./src/maoka.constants.js"

import { create, pure, html, math, svg } from "./src/maoka.impl.js"

/**
 * @type {Maoka}
 */
const maoka = {
	create,
	html,
	math,
	pure,
	svg,
}

export default maoka
