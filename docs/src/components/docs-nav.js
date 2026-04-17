import maoka from "../../../index.js"
import "./docs-nav.css"

const pages = [
	{ href: "/", label: "Home" },
	{ href: "/api", label: "API" },
	{ href: "/best-practices", label: "Best practices" },
	{ href: "/rendering", label: "Rendering" },
	{ href: "/component-lifecycle", label: "Component lifecycle" },
	{ href: "/jabs", label: "Jabs" },
	{ href: "/testing", label: "Testing" },
]

export const DocsNav = maoka.html.aside(({ lifecycle, refresh$, value }) => {
	let sections = []
	let isSectionsOpen = true

	const syncSectionsState = () => {
		isSectionsOpen = globalThis.innerWidth > 860
		refresh$()
	}

	lifecycle.afterMount(() => {
		sections = collectSections(value)
		syncSectionsState()
		globalThis.addEventListener("resize", syncSectionsState)
		refresh$()

		return () => {
			globalThis.removeEventListener("resize", syncSectionsState)
		}
	})

	return () => [
		Logo(),
		Pages(),
		sections.length
			? SectionsNav(() => ({
					isOpen: isSectionsOpen,
					sections,
					toggle: () => {
						isSectionsOpen = !isSectionsOpen
						refresh$()
					},
				}))
			: null,
	]
})

// --- Internal ---

const Logo = maoka.html.a(({ value }) => {
	value.href = "/"
	value.className = "brand-link"

	return () => "真岡"
})

const Pages = maoka.html.nav(({ value }) => {
	value.setAttribute("aria-label", "Documentation pages")

	return () => pages.map(page => NavLink(() => page))
})

const SectionsNav = maoka.html.section(({ props, value }) => {
	value.className = [
		"sections-nav",
		props().isOpen ? "is-open" : "is-collapsed",
	]
		.filter(Boolean)
		.join(" ")

	return () => [
		maoka.html.button(({ props, value }) => {
			value.type = "button"
			value.className = "sections-toggle"
			value.setAttribute("aria-expanded", String(props().isOpen))
			value.onclick = () => props().toggle()

			return () => "On this page"
		})(() => props()),
		props().isOpen
			? maoka.html.nav(({ value, props }) => {
					value.setAttribute("aria-label", "Page sections")

					return () =>
						props().sections.map(section =>
							NavLink(() => ({
								className: `section-link section-link-depth-${section.depth}`,
								href: `#${section.id}`,
								label: section.label,
							})),
						)
				})(() => props())
			: null,
	]
})

const NavLink = maoka.html.a(({ props, value }) => {
	value.href = props().href
	value.className = props().className ?? ""

	return () => props().label
})

const collectSections = value => {
	const article = value.parentElement?.querySelector("article")

	if (!article) return []

	const sections = new Map()

	for (const heading of article.querySelectorAll("h2, h3")) {
		if (heading.closest("header")) continue

		const target = heading.id
			? heading
			: (heading.closest("section[id]") ?? heading)
		target.id ||= createAnchorId(heading.textContent ?? "section", sections)

		if (!sections.has(target.id)) {
			sections.set(target.id, {
				depth: Number(heading.tagName.slice(1)),
				id: target.id,
				label: heading.textContent?.trim() ?? target.id,
			})
		}
	}

	return [...sections.values()]
}

const createAnchorId = (label, sections) => {
	const slug =
		label
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "section"
	let id = slug
	let index = 2

	while (sections.has(id)) {
		id = `${slug}-${index}`
		index++
	}

	return id
}
