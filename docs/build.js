import { mkdir, readFile, rm, writeFile } from "node:fs/promises"

const pages = [
	"index",
	"api",
	"component-lifecycle",
	"jabs",
	"testing",
]
const docsDir = new URL("./", import.meta.url)
const outDir = new URL("../dist/docs/", import.meta.url)

await rm(outDir, { force: true, recursive: true })
await mkdir(outDir, { recursive: true })

for (const page of pages) {
	await buildPageAssets(page)
	await writePageHtml(page)
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
	const html = await readFile(new URL(`pages/${page}/index.html`, docsDir), "utf8")
	const targetDir =
		page === "index" ? outDir : new URL(`${page}/`, outDir)

	await mkdir(targetDir, { recursive: true })
	await writeFile(new URL("index.html", targetDir), html)
}

function getOutputExtension(output) {
	if (output.type.startsWith("text/css")) return "css"
	if (output.type.startsWith("text/javascript")) return "js"

	throw new Error(`Unexpected docs build output: ${output.type}`)
}
