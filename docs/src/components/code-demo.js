import maoka from "../../../index.js"
import { CodeBlock } from "./code-block.js"
import "./code-demo.css"

export const CodeDemo = maoka.html.section(({ props$, value }) => {
	value.className = props$().compact ? "code-demo is-compact" : "code-demo"

	return () => [
		CodeBlock(() => ({ js: props$().js, ts: props$().ts })),
		maoka.html.div(({ value }) => {
			value.className = "code-demo-preview"

			return () => props$().preview
		})(),
	]
})
