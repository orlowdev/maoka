import maoka from "../../../index.js"
import "./rainbow-card.css"

export const RainbowCard = maoka.html.div(({ props, use }) => {
	use(
		maoka.jabs.classes.assign(() =>
			["rainbow-card", props().className ?? ""].filter(Boolean).join(" "),
		),
	)

	return () => props().children
})
