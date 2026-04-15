import maoka from "../../../index.js"
import { CodeBlock } from "./code-block.js"
import "./code-demo.css"

const CodeDemoPreview = maoka.html.div(({ props, value }) => {
	return () => {
		value.className = "code-demo-preview"

		return props().children
	}
})

export const CodeDemo = maoka.html.section(({ props, value }) => {
	return () => {
		value.className = props().compact ? "code-demo is-compact" : "code-demo"

		return [
			CodeBlock(() => ({ js: props().js, ts: props().ts })),
			CodeDemoPreview(() => ({ children: props().preview })),
		]
	}
})
