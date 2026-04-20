import maoka from "../../../index.js"
import maokaDom from "../../../dom/index.js"

const createDigits = (count, place) => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace ? createDigits(count, nextPlace) : []),
		DiscounterDigit(
			() => ({
				digit: Math.floor(Math.abs(count) / place) % 10,
			}),
			{ key: place },
		),
	]
}

const DiscounterDigit = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("demo-tile"))

	return () => props().digit
})

const DiscounterButton = maoka.html.button(({ props, use }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	use(maoka.jabs.classes.set("demo-tile", "demo-action"))
	use(
		maokaDom.jabs.ifInDOM(({ value, lifecycle }) => {
			const sync = () => {
				value.onclick = () => props().decrement()
			}

			sync()
			lifecycle.beforeRefresh(() => {
				sync()

				return false
			})
		}),
	)

	return () => "-"
})

export const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const decrement = () => {
		count--
		refresh$()
	}

	return () => [
		DiscounterButton(() => ({ decrement }), { key: "decrement" }),
		...createDigits(count, 1),
	]
})
