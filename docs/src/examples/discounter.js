import maoka from "../../../index.js"

export const Discounter = maoka.create(({ refresh$ }) => {
	let count = 0

	const onClick = () => {
		count--
		refresh$()
	}

	return () => [
		Count(() => ({ key: 1, count })),
		count < -10 ? Count(() => ({ key: 2, count: count - 10 })) : void 0,
		Discount(() => ({ onClick })),
	]
})

const Count = maoka.html.div(
	({ props$ }) =>
		() =>
			`Count: ${props$().count}`,
)

const Discount = maoka.html.button(({ props$, value }) => {
	value.onclick = () => props$().onClick()

	return () => "-1"
})
