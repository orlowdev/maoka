import maoka from "../../../index.js"
import "./notebook-sheet.css"

export const NotebookSheet = maoka.html.div(({ props, use }) => {
	use(
		maoka.jabs.classes.assign(() =>
			[
				"notebook-sheet",
				props().variant ? `notebook-sheet--${props().variant}` : "",
				props().className ?? "",
			]
				.filter(Boolean)
				.join(" "),
		),
	)

	return () => props().children
})
