import maoka from "../../../index.js"

const createDigits = (count, place) => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace ? createDigits(count, nextPlace) : []),
		DiscounterDigit(() => ({
			key: place,
			digit: Math.floor(Math.abs(count) / place) % 10,
		})),
	]
}

const DiscounterDigit = maoka.html.div(({ props, value }) => {
	value.className = "demo-tile"

	return () => props().digit
})

const DiscounterButton = maoka.html.button(({ props, value }) => {
	value.type = "button"
	value.className = "demo-tile demo-action"
	value.onclick = () => props().decrement()

	return () => "-"
})

export const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const decrement = () => {
		count--
		refresh$()
	}

	return () => [
		DiscounterButton(() => ({ key: "decrement", decrement })),
		...createDigits(count, 1),
	]
})
