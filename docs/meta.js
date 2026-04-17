const SITE_NAME = "Maoka"
const DEFAULT_THEME_COLOR = "#091326"
const DARK_THEME_COLOR = "#0a0b14"
const DEFAULT_SITE_URL = "https://maokajs.netlify.app"
const OG_WIDTH = 1200
const OG_HEIGHT = 630

export const docsPages = [
	{
		id: "index",
		path: "/",
		title: "〽真岡!〜",
		description:
			"A UI library for on-demand rendering of user interfaces with renderer-agnostic components, direct lifecycle control, and browser-free testing.",
		ogTitle: "Maoka",
		eyebrow: "Maoka docs",
		accent: "#ff8f5a",
	},
	{
		id: "api",
		path: "/api",
		title: "Maoka API",
		description:
			"Reference for the Maoka runtime, tagged component factories, built-in jabs, DOM integration, testing helpers, and rendering primitives.",
		ogTitle: "API Reference",
		eyebrow: "Maoka docs",
		accent: "#ffd166",
	},
	{
		id: "best-practices",
		path: "/best-practices",
		title: "Maoka best practices",
		description:
			"Conventions for writing Maoka components and jabs that stay explicit, predictable, and easy to maintain as refresh behavior grows more involved.",
		ogTitle: "Best Practices",
		eyebrow: "Practical Maoka",
		accent: "#7bd389",
	},
	{
		id: "rendering",
		path: "/rendering",
		title: "Maoka rendering",
		description:
			"Learn how Maoka roots mediate rendering so the same component tree can target the DOM, tests, or a custom renderer adapter.",
		ogTitle: "Rendering",
		eyebrow: "Maoka docs",
		accent: "#70d6ff",
	},
	{
		id: "component-lifecycle",
		path: "/component-lifecycle",
		title: "Maoka component lifecycle",
		description:
			"Understand Maoka's create and render phases, refresh hooks, mount and unmount behavior, and error handling across the component lifecycle.",
		ogTitle: "Component Lifecycle",
		eyebrow: "Maoka lifecycle",
		accent: "#c9a3ff",
	},
	{
		id: "jabs",
		path: "/jabs",
		title: "Maoka jabs",
		description:
			"Attach refresh policy, lifecycle work, and recovery behavior to Maoka components with built-in and custom jabs.",
		ogTitle: "Jabs",
		eyebrow: "Maoka docs",
		accent: "#ff8fab",
	},
	{
		id: "testing",
		path: "/testing",
		title: "Maoka testing",
		description:
			"Test Maoka components and jabs against an in-memory renderer without a browser while keeping real refresh and lifecycle semantics.",
		ogTitle: "Testing",
		eyebrow: "Maoka docs",
		accent: "#8ecae6",
	},
]

const docsPagesById = new Map(docsPages.map(page => [page.id, page]))
const docsPagesByPath = new Map(docsPages.map(page => [page.path, page]))

export const pageIds = docsPages.map(page => page.id)

export const getPageById = pageId => docsPagesById.get(pageId) ?? null

export const getPageByPath = pathname => docsPagesByPath.get(pathname) ?? null

export const renderPageHtml = (pageId, env = process.env) => {
	const page = requirePage(pageId)
	const assetPath = `/pages/${page.id}/index`
	const title = page.title
	const description = page.description
	const imageAlt = `${SITE_NAME} docs preview for ${page.ogTitle}`
	const imagePath = `/og/${page.id}.png`
	const siteUrl = resolveSiteUrl(env)
	const canonicalUrl = new URL(page.path, siteUrl).toString()
	const imageUrl = new URL(imagePath, siteUrl).toString()

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${escapeHtml(title)}</title>
		<meta name="description" content="${escapeHtmlAttribute(description)}" />
		<meta name="application-name" content="${SITE_NAME}" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="default" />
		<meta name="apple-mobile-web-app-title" content="${SITE_NAME}" />
		<meta name="mobile-web-app-capable" content="yes" />
		<meta name="format-detection" content="telephone=no" />
		<meta name="robots" content="index,follow" />
		<meta name="theme-color" content="${DEFAULT_THEME_COLOR}" />
		<meta name="msapplication-TileColor" content="${DEFAULT_THEME_COLOR}" />
		<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}" />
		<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
		<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
		<link rel="manifest" href="/site.webmanifest" />
		<meta property="og:locale" content="en_US" />
		<meta property="og:site_name" content="${SITE_NAME}" />
		<meta property="og:type" content="website" />
		<meta property="og:url" content="${escapeHtmlAttribute(canonicalUrl)}" />
		<meta property="og:title" content="${escapeHtmlAttribute(title)}" />
		<meta property="og:description" content="${escapeHtmlAttribute(description)}" />
		<meta property="og:image" content="${escapeHtmlAttribute(imageUrl)}" />
		<meta property="og:image:secure_url" content="${escapeHtmlAttribute(imageUrl)}" />
		<meta property="og:image:type" content="image/png" />
		<meta property="og:image:width" content="${OG_WIDTH}" />
		<meta property="og:image:height" content="${OG_HEIGHT}" />
		<meta property="og:image:alt" content="${escapeHtmlAttribute(imageAlt)}" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:url" content="${escapeHtmlAttribute(canonicalUrl)}" />
		<meta name="twitter:title" content="${escapeHtmlAttribute(title)}" />
		<meta name="twitter:description" content="${escapeHtmlAttribute(description)}" />
		<meta name="twitter:image" content="${escapeHtmlAttribute(imageUrl)}" />
		<meta name="twitter:image:src" content="${escapeHtmlAttribute(imageUrl)}" />
		<meta name="twitter:image:alt" content="${escapeHtmlAttribute(imageAlt)}" />
		<script>${renderThemeInitScript()}</script>
		<link rel="stylesheet" href="${assetPath}.css" />
		<script type="module" src="${assetPath}.js" async></script>
	</head>
	<body></body>
</html>
`
}

export const renderOgSvg = pageId => {
	const page = requirePage(pageId)
	const titleLines = splitText(page.ogTitle, 20, 2)
	const descriptionLines = splitText(page.description, 54, 3)

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" role="img" aria-labelledby="title desc">
	<title id="title">${escapeXml(`${page.title} preview`)}</title>
	<desc id="desc">${escapeXml(page.description)}</desc>
	<defs>
		<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#fffaf7" />
			<stop offset="58%" stop-color="#faf7ff" />
			<stop offset="100%" stop-color="#f4fbff" />
		</linearGradient>
		<radialGradient id="hotGlow" cx="18%" cy="10%" r="36%">
			<stop offset="0%" stop-color="#ff3d8b" stop-opacity="0.26" />
			<stop offset="100%" stop-color="#ff3d8b" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="aquaGlow" cx="86%" cy="8%" r="38%">
			<stop offset="0%" stop-color="#00c2ff" stop-opacity="0.22" />
			<stop offset="100%" stop-color="#00c2ff" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="sunGlow" cx="72%" cy="82%" r="34%">
			<stop offset="0%" stop-color="#ffe45c" stop-opacity="0.18" />
			<stop offset="100%" stop-color="#ffe45c" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="${page.accent}" stop-opacity="1" />
			<stop offset="100%" stop-color="#00c2ff" stop-opacity="0.7" />
		</linearGradient>
		<linearGradient id="headerBar" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="#ff3d8b" />
			<stop offset="52%" stop-color="#ffe45c" />
			<stop offset="100%" stop-color="#00c2ff" />
		</linearGradient>
		<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
			<circle cx="1.2" cy="1.2" r="1.2" fill="#15122a" fill-opacity="0.16" />
		</pattern>
		<filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#15122a" flood-opacity="0.16" />
		</filter>
	</defs>
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#paper)" />
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#dots)" />
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#hotGlow)" />
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#aquaGlow)" />
	<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#sunGlow)" />
	<g filter="url(#cardShadow)">
		<rect x="48" y="42" width="1104" height="546" rx="28" fill="#fffdfb" fill-opacity="0.84" />
		<rect x="48" y="42" width="1104" height="546" rx="28" fill="none" stroke="#292357" stroke-opacity="0.14" />
	</g>
	<path d="M972 42h92v10l-14 10h-78z" fill="url(#headerBar)" />
	<rect x="80" y="88" width="214" height="12" rx="6" fill="${page.accent}" />
	<path d="M80 492h356" stroke="url(#accent)" stroke-width="2" />
	<path d="M472 492h432" stroke="#15122a" stroke-opacity="0.16" stroke-width="2" />
	<text x="80" y="146" fill="#ff3d8b" font-family="Inter, 'SF Pro', system-ui, sans-serif" font-size="24" font-weight="900" letter-spacing="5.5">${escapeXml(
		page.eyebrow.toUpperCase(),
	)}</text>
	<text x="80" y="256" fill="#15122a" font-family="Inter, 'SF Pro', system-ui, sans-serif" font-size="82" font-weight="900" letter-spacing="-3.4">${renderSvgLines(
		titleLines,
		80,
		256,
		92,
	)}</text>
	<text x="80" y="378" fill="#15122a" fill-opacity="0.72" font-family="Literata, Georgia, serif" font-size="31">${renderSvgLines(
		descriptionLines,
		80,
		378,
		48,
	)}</text>
	<text x="80" y="546" fill="#15122a" font-family="'Fira Code', monospace" font-size="23" font-weight="700">docs</text>
	<text x="1040" y="548" fill="${page.accent}" font-family="Inter, 'SF Pro', system-ui, sans-serif" font-size="32" font-weight="900" letter-spacing="-1" text-anchor="end">真岡</text>
</svg>
`
}

function requirePage(pageId) {
	const page = getPageById(pageId)

	if (!page) {
		throw new Error(`Unknown docs page: ${pageId}`)
	}

	return page
}

function resolveSiteUrl(env) {
	const siteUrl =
		env.SITE_URL ?? env.URL ?? env.DEPLOY_PRIME_URL ?? env.DEPLOY_URL ?? DEFAULT_SITE_URL

	return normalizeSiteUrl(siteUrl)
}

function normalizeSiteUrl(siteUrl) {
	const normalized = String(siteUrl).trim()

	if (!normalized) return DEFAULT_SITE_URL

	return normalized.endsWith("/") ? normalized : `${normalized}/`
}

function renderThemeInitScript() {
	return `(function(){var storageKey="maoka-theme-preference";var root=document.documentElement;var themeMeta=document.querySelector('meta[name="theme-color"]');var getSystemTheme=function(){return globalThis.matchMedia&&globalThis.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"};var applyTheme=function(preference){var resolved=preference==="system"?getSystemTheme():preference;root.dataset.themePreference=preference;root.dataset.theme=resolved;if(themeMeta)themeMeta.setAttribute("content",resolved==="dark"?"${DARK_THEME_COLOR}":"${DEFAULT_THEME_COLOR}")};try{var stored=globalThis.localStorage&&globalThis.localStorage.getItem(storageKey);applyTheme(stored==="light"||stored==="dark"||stored==="system"?stored:"system")}catch(_error){applyTheme("system")}})();`
}

function escapeHtml(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
}

function escapeHtmlAttribute(value) {
	return escapeHtml(value).replaceAll('"', "&quot;")
}

function escapeXml(value) {
	return escapeHtmlAttribute(value).replaceAll("'", "&apos;")
}

function splitText(text, lineLength, maxLines) {
	const words = text.split(/\s+/).filter(Boolean)
	const lines = []
	let line = ""

	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word

		if (candidate.length <= lineLength || !line) {
			line = candidate
			continue
		}

		lines.push(line)

		if (lines.length === maxLines) {
			lines[maxLines - 1] = appendEllipsis(lines[maxLines - 1], lineLength)
			return lines
		}

		line = word
	}

	if (line && lines.length < maxLines) {
		lines.push(line)
	}

	return lines
}

function appendEllipsis(text, maxLength) {
	if (text.endsWith("…")) return text

	const truncated = text.length < maxLength ? text : text.slice(0, maxLength - 1)

	return `${truncated.trimEnd()}…`
}

function renderSvgLines(lines, x, y, lineHeight) {
	return lines
		.map((line, index) => {
			if (index === 0) return escapeXml(line)

			return `<tspan x="${x}" dy="${lineHeight}">${escapeXml(line)}</tspan>`
		})
		.join("")
}
