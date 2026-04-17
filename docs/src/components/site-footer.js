import maoka from "../../../index.js"
import "./site-footer.css"

const GITHUB_REPO_URL = "https://github.com/orlowdev/maoka"
const NPM_PACKAGE_URL = "https://www.npmjs.com/package/maoka"
const FOOTER_MARK = "ƒ«R»≡♥"
const GITHUB_ICON_PATH =
	"M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.81 2.8 1.29 3.49.99.11-.76.42-1.29.76-1.58-2.67-.3-5.47-1.31-5.47-5.86 0-1.3.47-2.36 1.22-3.19-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.22a11.57 11.57 0 0 1 6 0c2.3-1.54 3.3-1.22 3.3-1.22.65 1.64.24 2.86.12 3.16.76.83 1.22 1.89 1.22 3.19 0 4.56-2.81 5.55-5.49 5.85.43.37.82 1.1.82 2.23v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"

const GithubIconPath = maoka.svg.path(({ value }) => {
	value.setAttribute("d", GITHUB_ICON_PATH)
})

const GithubIcon = maoka.svg.svg(({ value }) => {
	value.setAttribute("aria-hidden", "true")
	value.setAttribute("viewBox", "0 0 24 24")

	return () => GithubIconPath()
})

const FooterGithubLink = maoka.html.a(({ value }) => {
	value.className = "site-footer-link"
	value.href = GITHUB_REPO_URL
	value.target = "_blank"
	value.rel = "noreferrer"
	value.setAttribute("aria-label", "Maoka on GitHub")

	return () => GithubIcon()
})

const NpmIconRect = maoka.svg.rect(({ value }) => {
	value.setAttribute("x", "3")
	value.setAttribute("y", "6")
	value.setAttribute("width", "18")
	value.setAttribute("height", "12")
	value.setAttribute("rx", "1.5")
	value.setAttribute("fill", "currentColor")
})

const NpmIconText = maoka.svg.text(({ value }) => {
	value.setAttribute("x", "12")
	value.setAttribute("y", "14.2")
	value.setAttribute("fill", "var(--footer-icon-cutout)")
	value.setAttribute("font-family", "Inter, sans-serif")
	value.setAttribute("font-size", "7.2")
	value.setAttribute("font-weight", "900")
	value.setAttribute("letter-spacing", "-0.35")
	value.setAttribute("text-anchor", "middle")

	return () => "npm"
})

const NpmIcon = maoka.svg.svg(({ value }) => {
	value.setAttribute("aria-hidden", "true")
	value.setAttribute("viewBox", "0 0 24 24")

	return () => [NpmIconRect(), NpmIconText()]
})

const FooterNpmLink = maoka.html.a(({ value }) => {
	value.className = "site-footer-link"
	value.href = NPM_PACKAGE_URL
	value.target = "_blank"
	value.rel = "noreferrer"
	value.setAttribute("aria-label", "Maoka on npm")

	return () => NpmIcon()
})

const FooterLinks = maoka.html.div(({ value }) => {
	value.className = "site-footer-links"

	return () => [FooterGithubLink(), FooterNpmLink()]
})

export const SiteFooter = maoka.html.footer(({ value }) => {
	value.className = "site-footer"

	return () => [FooterMark(), FooterLinks()]
})

const FooterMark = maoka.html.p(({ value }) => {
	value.className = "site-footer-copy site-footer-mark"

	return () => FOOTER_MARK
})
