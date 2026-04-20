import maoka from "../../../index.js"

export const Konnichiwa = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("demo-text"))

	return () => `こんにちは、${props().name}`
})
