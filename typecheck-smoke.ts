import maoka from "maoka"
import maokaDom, { render } from "maoka/dom"
import { createRoot, type MaokaRendering } from "maoka/rendering"
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

const options: MaokaRendering.RootOptions<Element> = {
	value: document.body,
	createValue: tag => document.createElement(typeof tag === "string" ? tag : tag.tag),
	refreshNode: () => {},
}

createRoot(options)

const probe = renderJab(({ refresh$ }) => ({ trigger: refresh$ }))

probe.result().trigger()
