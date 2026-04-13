const port = Number(process.env.PORT ?? 3000)
const root = new URL("../", import.meta.url)

const server = Bun.serve({
	port,
	async fetch(request) {
		const url = new URL(request.url)
		const pathname = url.pathname === "/" ? "/docs/index.html" : url.pathname
		const file = Bun.file(new URL(`.${pathname}`, root))

		if (!(await file.exists())) {
			return new Response("Not found", { status: 404 })
		}

		return new Response(file, {
			headers: {
				"Content-Type": getContentType(pathname),
			},
		})
	},
})

console.log(`Maoka docs: http://localhost:${server.port}`)

const getContentType = pathname => {
	if (pathname.endsWith(".html")) return "text/html; charset=utf-8"
	if (pathname.endsWith(".js")) return "text/javascript; charset=utf-8"
	if (pathname.endsWith(".css")) return "text/css; charset=utf-8"
	if (pathname.endsWith(".json")) return "application/json; charset=utf-8"
	if (pathname.endsWith(".svg")) return "image/svg+xml"

	return "application/octet-stream"
}
