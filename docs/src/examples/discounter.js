import maoka from "../../../index.js"

export const Discounter = maoka.create(({ key, refresh$, lifecycle }) => {
	let count = 0

	const onClick = () => {
		count--
		refresh$()
	}

	lifecycle.onRefresh(() => false)

	return () => [Count(() => ({ count })), Discount(() => ({ onClick }))]
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
