import maoka from "maoka"
import maokaDom, { render } from "maoka/dom"
import { render as renderTest, renderJab } from "maoka/test"

const FocusInput = maoka.html.input(({ use, value }) => {
	const inputValue = use(
		maokaDom.jabs.ifInDOM<HTMLInputElement>(({ value }) => value.value),
	)

	void inputValue
	value.value = "ready"

	return () => null
})

render(document.body, FocusInput())

const Label = maoka.html.span(() => () => "Ready")

renderTest(Label())

const probe = renderJab(({ refresh$ }) => ({ trigger: refresh$ }))

probe.result().trigger()
