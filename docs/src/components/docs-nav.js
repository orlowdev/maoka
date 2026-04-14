import maoka from "../../../index.js"

const pages = [
	{ href: "/docs/index.html", label: "Home" },
	{ href: "/getting-started.html", label: "Getting started" },
	{ href: "/tutorial.html", label: "Tutorial" },
	{ href: "/api.html", label: "API" },
	{ href: "/rendering.html", label: "Rendering" },
	{ href: "/component-lifecycle.html", label: "Component lifecycle" },
	{ href: "/testing.html", label: "Testing" },
]

export const DocsNav = maoka.html.aside(({ props$ }) => {
	return () => [
		maoka.html.a(({ value }) => {
			value.href = "/docs/index.html"
			value.className = "brand-link"

			return () => "真岡"
		})(),
		maoka.html.nav(({ value }) => {
			value.setAttribute("aria-label", "Documentation pages")

			return () => pages.map(page => NavLink(() => page))
		})(),
		props$().sections?.length ? SectionsNav(() => props$()) : null,
	]
})

const SectionsNav = maoka.html.nav(({ value, props$ }) => {
	value.setAttribute("aria-label", "Page sections")
	value.className = "sections-nav"

	return () =>
		props$().sections.map(section =>
			NavLink(() => ({
				href: `#${section.id}`,
				label: section.label,
			})),
		)
})

const NavLink = maoka.html.a(({ props$, value }) => {
	value.href = props$().href

	return () => props$().label
})
