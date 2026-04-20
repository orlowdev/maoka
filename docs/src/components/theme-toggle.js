import maoka from "../../../index.js"
import maokaDom from "../../../dom/index.js"

const STORAGE_KEY = "maoka-theme-preference"
const THEME_COLOR_LIGHT = "#091326"
const THEME_COLOR_DARK = "#0a0b14"
const themeOptions = [
	{ id: "light", label: "Light" },
	{ id: "dark", label: "Dark" },
	{ id: "system", label: "System" },
]

export const ThemeToggle = maoka.html.div(({ lifecycle, refresh$, use }) => {
	let preference = getThemePreference()
	const dom = use(
		maokaDom.jabs.ifInDOM(({ value }) => {
			const doc = value.ownerDocument
			const win = doc?.defaultView

			return doc && win
				? {
						document: doc,
						window: win,
					}
				: null
		}),
	)

	use(maoka.jabs.classes.set("theme-toggle"))
	use(maoka.jabs.aria.set("label", "Theme mode"))

	const sync = () => {
		preference = getThemePreference(dom)
		refresh$()
	}

	lifecycle.afterMount(() => {
		const media = dom?.window.matchMedia?.("(prefers-color-scheme: dark)")
		const onChange = () => {
			if (getThemePreference(dom) !== "system") return

			applyThemePreference(dom, "system")
			sync()
		}

		media?.addEventListener?.("change", onChange)

		return () => {
			media?.removeEventListener?.("change", onChange)
		}
	})

	return () =>
		themeOptions.map(option =>
			ThemeToggleButton(() => ({
				active: preference === option.id,
				label: option.label,
				onClick: () => {
					applyThemePreference(dom, option.id)
					sync()
				},
			})),
		)
})

const ThemeToggleButton = maoka.html.button(({ props, use }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	use(
		maoka.jabs.classes.assign(() =>
			["theme-toggle-button", props().active ? "is-active" : ""]
				.filter(Boolean)
				.join(" "),
		),
	)
	use(maoka.jabs.aria.assign("pressed", () => String(props().active)))
	use(
		maokaDom.jabs.ifInDOM(({ value, lifecycle }) => {
			const sync = () => {
				value.onclick = () => props().onClick()
			}

			sync()
			lifecycle.beforeRefresh(() => {
				sync()

				return false
			})
		}),
	)

	return () => props().label
})

const getThemePreference = dom => {
	const preference =
		dom?.document.documentElement?.dataset.themePreference ??
		readStoredPreference(dom)

	return preference === "light" || preference === "dark" || preference === "system"
		? preference
		: "system"
}

const readStoredPreference = dom => {
	try {
		return dom?.window.localStorage?.getItem(STORAGE_KEY) ?? "system"
	} catch {
		return "system"
	}
}

const getSystemTheme = dom =>
	dom?.window.matchMedia?.("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light"

const applyThemePreference = (dom, preference) => {
	const resolved = preference === "system" ? getSystemTheme(dom) : preference
	const root = dom?.document.documentElement

	if (!root) return

	root.dataset.themePreference = preference
	root.dataset.theme = resolved

	try {
		dom.window.localStorage?.setItem(STORAGE_KEY, preference)
	} catch {}

	const themeMeta = dom.document.querySelector('meta[name="theme-color"]')

	if (themeMeta) {
		themeMeta.setAttribute(
			"content",
			resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
		)
	}
}
