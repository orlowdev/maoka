import { getPageByPath, renderOgSvg, renderPageHtml } from "./meta.js"

const port = Number(process.env.PORT ?? 3000)
const root = new URL("../", import.meta.url)

const server = Bun.serve({
	port,
	async fetch(request) {
		const url = new URL(request.url)
		const pathname = getPathname(url.pathname)
		const docsPage = getPageByPath(pathname)

		if (docsPage) {
			return new Response(renderPageHtml(docsPage.id, process.env), {
				headers: {
					"Content-Type": "text/html; charset=utf-8",
				},
			})
		}

		const ogImage = buildOgImage(pathname)

		if (ogImage) {
			return new Response(ogImage, {
				headers: {
					"Content-Type": "image/svg+xml",
				},
			})
		}

		const pageAsset = await buildPageAsset(pathname)

		if (pageAsset) {
			return new Response(pageAsset.body, {
				headers: {
					"Content-Type": getContentType(pathname),
				},
			})
		}

		const result = await findFile(pathname)

		if (!result) {
			return new Response("Not found", { status: 404 })
		}

		return new Response(result.file, {
			headers: {
				"Content-Type": getContentType(result.pathname),
			},
		})
	},
})

console.log(`Maoka docs: http://localhost:${server.port}`)

const docsRoot = new URL("./", import.meta.url)

const getPathname = pathname => {
	if (pathname === "/") return "/"
	if (pathname !== "/" && pathname.endsWith("/")) return pathname.slice(0, -1)

	return pathname
}

const buildOgImage = pathname => {
	const match = pathname.match(/^\/og\/([^/]+)\.svg$/)

	if (!match) return null

	const [, page] = match

	try {
		return renderOgSvg(page)
	} catch {
		return null
	}
}

const findFile = async pathname => {
	for (const candidate of getFileCandidates(pathname)) {
		const file = Bun.file(new URL(`.${candidate}`, root))

		if (await file.exists()) {
			return { file, pathname: candidate }
		}
	}

	return null
}

const buildPageAsset = async pathname => {
	const match = pathname.match(/^\/pages\/([^/]+)\/index\.(css|js)$/)

	if (!match) return null

	const [, page, extension] = match
	const result = await Bun.build({
		entrypoints: [new URL(`pages/${page}/index.js`, docsRoot).pathname],
		format: "esm",
		target: "browser",
	})

	if (!result.success) {
		for (const log of result.logs) {
			console.error(log)
		}

		return null
	}

	const output = result.outputs.find(output =>
		extension === "css"
			? output.type.startsWith("text/css")
			: output.type.startsWith("text/javascript"),
	)

	if (!output) return null

	return { body: await output.text() }
}

const getFileCandidates = pathname => {
	const candidates = []
	const addCandidates = candidate => {
		candidates.push(candidate)

		if (!hasExtension(candidate)) {
			candidates.push(`${candidate}.html`)
		}
	}

	if (pathname.startsWith("/pages/")) {
		addCandidates(`/docs${pathname}`)
	} else if (pathname.startsWith("/src/")) {
		addCandidates(`/docs${pathname}`)
	} else if (hasExtension(pathname)) {
		addCandidates(pathname)
		addCandidates(`/docs${pathname}`)
	} else {
		addCandidates(`/docs/pages${pathname}/index.html`)
		addCandidates(pathname)
	}

	return candidates
}

const hasExtension = pathname =>
	pathname.split("/").at(-1)?.includes(".") ?? false

const getContentType = pathname => {
	if (pathname.endsWith(".html")) return "text/html; charset=utf-8"
	if (pathname.endsWith(".js")) return "text/javascript; charset=utf-8"
	if (pathname.endsWith(".css")) return "text/css; charset=utf-8"
	if (pathname.endsWith(".json")) return "application/json; charset=utf-8"
	if (pathname.endsWith(".webmanifest"))
		return "application/manifest+json; charset=utf-8"
	if (pathname.endsWith(".svg")) return "image/svg+xml"
	if (pathname.endsWith(".png")) return "image/png"

	return "application/octet-stream"
}
