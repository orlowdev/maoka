import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "playwright"

import { pageIds, renderOgSvg } from "./meta.js"

const width = 1200
const height = 630
const outDir = new URL("./og/", import.meta.url)

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
	deviceScaleFactor: 1,
	viewport: { width, height },
})

for (const pageId of pageIds) {
	const svg = renderOgSvg(pageId)
	const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

	await page.setContent(
		`<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<style>
			html, body {
				margin: 0;
				width: ${width}px;
				height: ${height}px;
				overflow: hidden;
				background: transparent;
			}

			img {
				display: block;
				width: ${width}px;
				height: ${height}px;
			}
		</style>
	</head>
	<body>
		<img src="${svgDataUrl}" width="${width}" height="${height}" alt="" />
	</body>
</html>`,
	)

	await page.screenshot({
		path: new URL(`${pageId}.png`, outDir).pathname,
		type: "png",
	})
}

await page.close()
await browser.close()

for (const pageId of pageIds) {
	const png = Bun.file(new URL(`${pageId}.png`, outDir))

	console.log(`${pageId}: wrote ${await png.arrayBuffer().then(buffer => buffer.byteLength)} bytes`)
}
