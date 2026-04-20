import maoka from "../../../index.js"
import "./site-footer.css"

const GITHUB_REPO_URL = "https://github.com/orlowdev/maoka"
const NPM_PACKAGE_URL = "https://www.npmjs.com/package/maoka"
const FOOTER_MARK = "ƒ«R»≡♥"
const GITHUB_ICON_PATH =
	"M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.81 2.8 1.29 3.49.99.11-.76.42-1.29.76-1.58-2.67-.3-5.47-1.31-5.47-5.86 0-1.3.47-2.36 1.22-3.19-.12-.3-.53-1.52.12-3.16 0 0 1-.32 3.3 1.22a11.57 11.57 0 0 1 6 0c2.3-1.54 3.3-1.22 3.3-1.22.65 1.64.24 2.86.12 3.16.76.83 1.22 1.89 1.22 3.19 0 4.56-2.81 5.55-5.49 5.85.43.37.82 1.1.82 2.23v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"

const GithubIconPath = maoka.svg.path(({ use }) => {
	use(maoka.jabs.attributes.set("d", GITHUB_ICON_PATH))
})

const GithubIcon = maoka.svg.svg(({ use }) => {
	use(maoka.jabs.aria.set("hidden", "true"))
	use(maoka.jabs.attributes.set("viewBox", "0 0 24 24"))

	return () => GithubIconPath()
})

const FooterGithubLink = maoka.html.a(({ use }) => {
	use(maoka.jabs.classes.set("site-footer-link"))
	use(maoka.jabs.attributes.set("href", GITHUB_REPO_URL))
	use(maoka.jabs.attributes.set("target", "_blank"))
	use(maoka.jabs.attributes.set("rel", "noreferrer"))
	use(maoka.jabs.aria.set("label", "Maoka on GitHub"))

	return () => GithubIcon()
})

const NpmIconRect = maoka.svg.rect(({ use }) => {
	use(maoka.jabs.attributes.set("x", "3"))
	use(maoka.jabs.attributes.set("y", "6"))
	use(maoka.jabs.attributes.set("width", "18"))
	use(maoka.jabs.attributes.set("height", "12"))
	use(maoka.jabs.attributes.set("rx", "1.5"))
	use(maoka.jabs.attributes.set("fill", "currentColor"))
})

const NpmIconText = maoka.svg.text(({ use }) => {
	use(maoka.jabs.attributes.set("x", "12"))
	use(maoka.jabs.attributes.set("y", "14.2"))
	use(maoka.jabs.attributes.set("fill", "var(--footer-icon-cutout)"))
	use(maoka.jabs.attributes.set("font-family", "Inter, sans-serif"))
	use(maoka.jabs.attributes.set("font-size", "7.2"))
	use(maoka.jabs.attributes.set("font-weight", "900"))
	use(maoka.jabs.attributes.set("letter-spacing", "-0.35"))
	use(maoka.jabs.attributes.set("text-anchor", "middle"))

	return () => "npm"
})

const NpmIcon = maoka.svg.svg(({ use }) => {
	use(maoka.jabs.aria.set("hidden", "true"))
	use(maoka.jabs.attributes.set("viewBox", "0 0 24 24"))

	return () => [NpmIconRect(), NpmIconText()]
})

const FooterNpmLink = maoka.html.a(({ use }) => {
	use(maoka.jabs.classes.set("site-footer-link"))
	use(maoka.jabs.attributes.set("href", NPM_PACKAGE_URL))
	use(maoka.jabs.attributes.set("target", "_blank"))
	use(maoka.jabs.attributes.set("rel", "noreferrer"))
	use(maoka.jabs.aria.set("label", "Maoka on npm"))

	return () => NpmIcon()
})

const FooterLinks = maoka.html.div(({ use }) => {
	use(maoka.jabs.classes.set("site-footer-links"))

	return () => [FooterGithubLink(), FooterNpmLink()]
})

export const SiteFooter = maoka.html.footer(({ use }) => {
	use(maoka.jabs.classes.set("site-footer"))

	return () => [FooterMark(), FooterLinks()]
})

const FooterMark = maoka.html.p(({ use }) => {
	use(maoka.jabs.classes.set("site-footer-copy", "site-footer-mark"))

	return () => FOOTER_MARK
})
