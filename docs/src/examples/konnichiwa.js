import maoka from "../../../index.js"

export const Konnichiwa = maoka.html.div(({ props$, value }) => {
	value.className = "demo-text"

	return () => `こんにちは、${props$().name}`
})
