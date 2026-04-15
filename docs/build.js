import { mkdir, rm, writeFile } from "node:fs/promises"

import { pageIds, renderOgSvg, renderPageHtml } from "./meta.js"

const docsDir = new URL("./", import.meta.url)
const outDir = new URL("../dist/docs/", import.meta.url)

await rm(outDir, { force: true, recursive: true })
await mkdir(outDir, { recursive: true })
await copyStaticAssets()

for (const page of pageIds) {
	await buildPageAssets(page)
	await writePageHtml(page)
	await writeOgImage(page)
}

async function buildPageAssets(page) {
	const result = await Bun.build({
		entrypoints: [new URL(`pages/${page}/index.js`, docsDir).pathname],
		format: "esm",
		minify: true,
		target: "browser",
	})

	if (!result.success) {
		for (const log of result.logs) {
			console.error(log)
		}

		process.exit(1)
	}

	await mkdir(new URL(`pages/${page}/`, outDir), { recursive: true })

	for (const output of result.outputs) {
		await writeFile(
			new URL(`pages/${page}/index.${getOutputExtension(output)}`, outDir),
			await output.text(),
		)
	}
}

async function writePageHtml(page) {
	const html = renderPageHtml(page)
	const targetDir =
		page === "index" ? outDir : new URL(`${page}/`, outDir)

	await mkdir(targetDir, { recursive: true })
	await writeFile(new URL("index.html", targetDir), html)
}

async function writeOgImage(page) {
	const targetDir = new URL("./og/", outDir)

	await mkdir(targetDir, { recursive: true })
	await writeFile(new URL(`${page}.svg`, targetDir), renderOgSvg(page))
}

async function copyStaticAssets() {
	const staticFiles = [
		"favicon.svg",
		"icon.svg",
		"icon-192.png",
		"icon-512.png",
		"apple-touch-icon.png",
		"site.webmanifest",
	]

	for (const filename of staticFiles) {
		const file = Bun.file(new URL(filename, docsDir))

		if (!(await file.exists())) continue

		await writeFile(new URL(filename, outDir), await file.bytes())
	}
}

function getOutputExtension(output) {
	if (output.type.startsWith("text/css")) return "css"
	if (output.type.startsWith("text/javascript")) return "js"

	throw new Error(`Unexpected docs build output: ${output.type}`)
}
