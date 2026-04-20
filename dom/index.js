export * from "./src/maoka-dom.impl.js"

import * as jabs from "./src/maoka-dom.jabs.js"
import { isDomNode, isDomValue } from "./src/maoka-dom.impl.js"

const maokaDom = {
	jabs,
	guards: {
		isDomNode,
		isDomValue,
	},
}

export default maokaDom
