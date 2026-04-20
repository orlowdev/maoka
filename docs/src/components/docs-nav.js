import maoka from "../../../index.js"
import maokaDom from "../../../dom/index.js"
import "./docs-nav.css"

const pages = [
	{ href: "/", label: "Home" },
	{ href: "/jabs", label: "Jabs" },
	{ href: "/component-lifecycle", label: "Component lifecycle" },
	{ href: "/api", label: "API" },
	{ href: "/best-practices", label: "Best practices" },
	{ href: "/testing", label: "Testing" },
	{ href: "/rendering", label: "Rendering" },
]

export const DocsNav = maoka.html.aside(({ lifecycle, refresh$, use }) => {
	let sections = []
	let isSectionsOpen = true
	const dom = use(
		maokaDom.jabs.ifInDOM(({ value }) => {
			const win = value.ownerDocument?.defaultView

			return win
				? {
						value,
						window: win,
					}
				: null
		}),
	)
	const readSections = () => (dom ? collectSections(dom.value) : [])

	const syncSectionsState = () => {
		if (!dom) return

		isSectionsOpen = dom.window.innerWidth > 860
		refresh$()
	}

	lifecycle.afterMount(() => {
		if (!dom) return

		sections = readSections()
		syncSectionsState()
		dom.window.addEventListener("resize", syncSectionsState)
		refresh$()

		return () => {
			dom.window.removeEventListener("resize", syncSectionsState)
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

const Logo = maoka.html.a(({ use }) => {
	use(maoka.jabs.attributes.set("href", "/"))
	use(maoka.jabs.classes.set("brand-link"))

	return () => "真岡"
})

const Pages = maoka.html.nav(({ use }) => {
	use(maoka.jabs.aria.set("label", "Documentation pages"))

	return () => pages.map(page => NavLink(() => page))
})

const SectionsNav = maoka.html.section(({ props, use }) => {
	use(
		maoka.jabs.classes.assign(() =>
			["sections-nav", props().isOpen ? "is-open" : "is-collapsed"]
				.filter(Boolean)
				.join(" "),
		),
	)

	return () => [
		SectionsToggleButton(() => props()),
		props().isOpen
			? SectionsLinks(() => props())
			: null,
	]
})

const SectionsToggleButton = maoka.html.button(({ props, use }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	use(maoka.jabs.classes.set("sections-toggle"))
	use(maoka.jabs.aria.assign("expanded", () => String(props().isOpen)))
	use(
		maokaDom.jabs.ifInDOM(({ value, lifecycle }) => {
			const sync = () => {
				value.onclick = () => props().toggle()
			}

			sync()
			lifecycle.beforeRefresh(() => {
				sync()

				return false
			})
		}),
	)

	return () => "On this page"
})

const SectionsLinks = maoka.html.nav(({ use, props }) => {
	use(maoka.jabs.aria.set("label", "Page sections"))

	return () =>
		props().sections.map(section =>
			NavLink(() => ({
				className: `section-link section-link-depth-${section.depth}`,
				href: `#${section.id}`,
				label: section.label,
			})),
		)
})

const NavLink = maoka.html.a(({ props, use }) => {
	use(maoka.jabs.attributes.assign("href", () => props().href))
	use(maoka.jabs.classes.assign(() => props().className ?? ""))

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
