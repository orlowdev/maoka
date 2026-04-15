import maoka from "../../../index.js"

export const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const onClick = () => {
		count--
		refresh$()
	}

	return () => [Discount(() => ({ onClick })), ...createCounters(count, 1)]
})

const createCounters = (count, place) => {
	const nextPlace = place * 10

	return [
		...(Math.abs(count) >= nextPlace ? createCounters(count, nextPlace) : []),
		Count(() => ({
			key: place,
			digit: Math.floor(Math.abs(count) / place) % 10,
		})),
	]
}

const Count = maoka.html.div(({ props, value }) => {
	value.className = "demo-tile"

	return () => props().digit
})

const Discount = maoka.html.button(({ props, value }) => {
	value.className = "demo-tile demo-action"
	value.onclick = () => props().onClick()

	return () => "-"
})
