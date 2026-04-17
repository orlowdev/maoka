import maoka from "../../../index.js"
import "./notebook-sheet.css"

export const NotebookSheet = maoka.html.div(({ props, value }) => {
	value.className = [
		"notebook-sheet",
		props().variant ? `notebook-sheet--${props().variant}` : "",
		props().className ?? "",
	]
		.filter(Boolean)
		.join(" ")

	return () => props().children
})
