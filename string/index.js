export * from "./src/maoka-string.impl.js"

import * as jabs from "./src/maoka-string.jabs.js"
import { isStringNode, isStringValue } from "./src/maoka-string.impl.js"

const maokaString = {
	jabs,
	guards: {
		isStringNode,
		isStringValue,
	},
}

export default maokaString
