import maoka from "../../../index.js"

const STORAGE_KEY = "maoka-theme-preference"
const THEME_COLOR_LIGHT = "#091326"
const THEME_COLOR_DARK = "#0a0b14"
const themeOptions = [
	{ id: "light", label: "Light" },
	{ id: "dark", label: "Dark" },
	{ id: "system", label: "System" },
]

export const ThemeToggle = maoka.html.div(({ lifecycle, refresh$, value }) => {
	let preference = getThemePreference()

	const sync = () => {
		preference = getThemePreference()
		refresh$()
	}

	lifecycle.afterMount(() => {
		const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)")
		const onChange = () => {
			if (getThemePreference() !== "system") return

			applyThemePreference("system")
			sync()
		}

		media?.addEventListener?.("change", onChange)

		return () => {
			media?.removeEventListener?.("change", onChange)
		}
	})

	return () => {
		value.className = "theme-toggle"
		value.setAttribute("aria-label", "Theme mode")

		return themeOptions.map(option =>
			ThemeToggleButton(() => ({
				active: preference === option.id,
				label: option.label,
				onClick: () => {
					applyThemePreference(option.id)
					sync()
				},
			})),
		)
	}
})

const ThemeToggleButton = maoka.html.button(({ props, value }) => {
	value.type = "button"
	value.onclick = () => props().onClick()

	return () => {
		value.className = [
			"theme-toggle-button",
			props().active ? "is-active" : "",
		]
			.filter(Boolean)
			.join(" ")
		value.setAttribute("aria-pressed", String(props().active))

		return props().label
	}
})

const getThemePreference = () => {
	const preference =
		globalThis.document?.documentElement?.dataset.themePreference ??
		readStoredPreference()

	return preference === "light" || preference === "dark" || preference === "system"
		? preference
		: "system"
}

const readStoredPreference = () => {
	try {
		return globalThis.localStorage?.getItem(STORAGE_KEY) ?? "system"
	} catch {
		return "system"
	}
}

const getSystemTheme = () =>
	globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light"

const applyThemePreference = preference => {
	const resolved = preference === "system" ? getSystemTheme() : preference
	const root = globalThis.document?.documentElement

	if (!root) return

	root.dataset.themePreference = preference
	root.dataset.theme = resolved

	try {
		globalThis.localStorage?.setItem(STORAGE_KEY, preference)
	} catch {}

	const themeMeta = globalThis.document?.querySelector('meta[name="theme-color"]')

	if (themeMeta) {
		themeMeta.setAttribute(
			"content",
			resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT,
		)
	}
}
