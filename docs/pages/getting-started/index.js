import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeDemo } from "../../src/components/code-demo.js"
import { DocsNav } from "../../src/components/docs-nav.js"
import { Discounter } from "../../src/examples/discounter.js"

const discounterExample = `import maoka from "maoka"

const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const onClick = () => {
		count--
		refresh$()
	}

	return () => [
		Discount(() => ({ onClick })),
		...createCounters(count, 1),
	]
})

const createCounters = (count, place) => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace
			? createCounters(count, nextPlace)
			: []),
		Count(() => ({
			key: place,
			digit: Math.floor(Math.abs(count) / place) % 10,
		})),
	]
}

const Count = maoka.html.div(({ props$ }) => {
	return () => props$().digit
})

const Discount = maoka.html.button(({ props$, value }) => {
	value.onclick = () => props$().onClick()

	return () => "-"
})`

const discounterExampleTs = `import maoka from "maoka"
import { type Maoka } from "maoka"

const Discounter = maoka.create(({ refresh$ }) => {
	let count: number = 0

	const onClick = (): void => {
		count--
		refresh$()
	}

	return () => [
		Discount(() => ({ onClick })),
		...createCounters(count, 1),
	]
})

const createCounters = (count: number, place: number): Maoka.Component[] => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace
			? createCounters(count, nextPlace)
			: []),
		Count(() => ({
			key: place,
			digit: Math.floor(Math.abs(count) / place) % 10,
		})),
	]
}

const Count = maoka.html.div<{ digit: number }>(({ props$ }) => {
	return () => props$().digit
})

const Discount = maoka.html.button<{ onClick: () => void }>(
	({ props$, value }) => {
		value.onclick = () => props$().onClick()

		return () => "-"
	},
)`

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(() => () => [
				Hero(),
				Section(() => ({
					id: "first-component",
					title: "Start with a component",
					body:
						"Maoka components split setup from render. Keep state in the create phase, then return a render function that describes the current tree.",
				})),
				Section(() => ({
					id: "keyed-refresh",
					title: "Keys keep the moving parts stable",
					body:
						"This example renders decimal places recursively. Each digit has a stable key and receives only the digit it owns, so unchanged places can stay calm while the active one refreshes.",
				})),
				CodeDemo(() => ({
					js: discounterExample,
					ts: discounterExampleTs,
					preview: [
						Discounter(),
					],
				})),
			]),
		]
	})(),
])

const Hero = maoka.html.header(() => () => [
	maoka.html.p(({ value }) => {
		value.className = "eyebrow"

		return () => "Maoka getting started"
	})(),
	maoka.html.h1(() => () => "Build a tiny reactive tree"),
	maoka.html.p(({ value }) => {
		value.className = "lede"

		return () =>
			"Start from one stateful component, render a few keyed children, and let the root orchestrate refresh work without remounting the parts that did not change."
	})(),
])

const Section = maoka.html.section(({ props$, value }) => {
	value.id = props$().id

	return () => [
		maoka.html.h2(() => () => props$().title),
		maoka.html.p(() => () => props$().body),
	]
})

render(document.body, Page())
