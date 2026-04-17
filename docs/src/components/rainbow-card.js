import maoka from "../../../index.js"
import "./rainbow-card.css"

export const RainbowCard = maoka.html.div(({ props, value }) => {
	value.className = ["rainbow-card", props().className ?? ""].filter(Boolean).join(" ")

	return () => props().children
})
