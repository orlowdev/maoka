import maoka from "../../../index.js"
import { DocsNav } from "./docs-nav.js"

const BoundaryTitle = maoka.html.h2(() => () => "Something went wrong")

const BoundaryMessage = maoka.html.p(({ props }) => () => props().message)

const BoundaryState = maoka.html.section(({ props, use }) => {
	use(maoka.jabs.classes.set("docs-page-error"))
	use(maoka.jabs.attributes.set("role", "alert"))

	return () => [BoundaryTitle(), BoundaryMessage(() => ({ message: props().message }))]
})

export const DocsPageBoundary = maoka.create(({ props, refresh$, use }) => {
	let errorMessage = null

	use(
		maoka.jabs.errorBoundary(error => {
			errorMessage = error.message || "Unexpected docs page error"
			refresh$()
		}),
	)

	return () =>
		errorMessage
			? BoundaryState(() => ({ message: errorMessage }))
			: props().children
})

export const DocsLayout = maoka.html.main(({ props, use }) => {
	use(maoka.jabs.classes.set("docs-layout"))

	return () => [DocsNav(), props().children]
})

export const DocsArticle = maoka.html.article(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => props().className ?? ""))

	return () => props().children
})
