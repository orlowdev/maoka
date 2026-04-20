import maoka from "maoka"
import maokaDom, { isDomValue, render } from "maoka/dom"
import { createRoot, type MaokaRendering } from "maoka/rendering"
import maokaString, {
	isStringNode,
	isStringValue,
	render as renderToString,
	type MaokaString,
} from "maoka/string"
import { render as renderTest, renderJab } from "maoka/test"

const FocusInput = maoka.html.input(({ use, value }) => {
	const inputValue = use(
		maokaDom.jabs.ifInDOM<HTMLInputElement>(({ value }) => value.value),
	)
	const title = use(maokaDom.jabs.attributes.get("title"))
	const isReady = use(maokaDom.jabs.classes.has("is-ready"))

	void inputValue
	void title
	void isReady
	use(maokaDom.jabs.attributes.set("title", "Ready"))
	use(maokaDom.jabs.attributes.assign("title", () => "Ready"))
	use(maokaDom.jabs.dataAttributes.set("status", "ready"))
	use(maokaDom.jabs.dataAttributes.assign("status", () => "ready"))
	use(maokaDom.jabs.aria.set("label", "Ready input"))
	use(maokaDom.jabs.aria.assign("label", () => "Ready input"))
	use(maokaDom.jabs.setId("focus-input"))
	use(maokaDom.jabs.assignId(() => "focus-input"))
	use(maokaDom.jabs.classes.assign(() => "is-ready"))
	use(maokaDom.jabs.classes.toggle(() => true, "is-ready"))
	value.value = "ready"

	return () => null
})

const domRoot = render(document.body, FocusInput())

const Label = maoka.html.span(() => () => "Ready")
const LabelBlueprint = maoka.html.span(() => () => "Ready")
const StringProbe = maoka.create(({ use }) => {
	const tag = use(maokaString.jabs.ifInString(({ value }) => value.tag))
	const title = use(maokaString.jabs.attributes.get("title"))
	const isReady = use(maokaString.jabs.classes.has("is-ready"))

	void tag
	void title
	void isReady
	use(maokaString.jabs.attributes.set("title", "Ready"))
	use(maokaString.jabs.attributes.assign("title", () => "Ready"))
	use(maokaString.jabs.dataAttributes.set("status", "ready"))
	use(maokaString.jabs.dataAttributes.assign("status", () => "ready"))
	use(maokaString.jabs.aria.set("label", "Ready output"))
	use(maokaString.jabs.aria.assign("label", () => "Ready output"))
	use(maokaString.jabs.setId("string-probe"))
	use(maokaString.jabs.assignId(() => "string-probe"))
	use(maokaString.jabs.classes.assign(() => "is-ready"))
	use(maokaString.jabs.classes.toggle(() => true, "is-ready"))

	return () => "Ready"
})

renderTest(Label())
renderToString(Label())
renderToString(StringProbe())

const stringRenderer: MaokaString = maokaString

void stringRenderer

if (maoka.guards.isBlueprint(LabelBlueprint)) {
	const component = LabelBlueprint()

	if (maoka.guards.isComponent(component)) {
		renderTest(component)
	}
}

const testRenderer = renderTest(Label())

if (maoka.guards.isNode(testRenderer.node)) {
	testRenderer.node.refresh$()
}

const firstDomChild = domRoot.children[0]
const maybeStringNode: unknown = {}
const maybeStringValue: unknown = {}

if (firstDomChild && maokaDom.guards.isDomNode(firstDomChild)) {
	firstDomChild.value.textContent = "Ready"
}

if (firstDomChild && isDomValue(firstDomChild.value)) {
	firstDomChild.value.textContent = "Ready"
}

if (isStringNode(maybeStringNode)) {
	void maokaString
}

if (isStringValue(maybeStringValue)) {
	maybeStringValue.text = "ready"
}

const options: MaokaRendering.RootOptions<Element> = {
	value: document.body,
	createValue: tag => document.createElement(typeof tag === "string" ? tag : tag.tag),
	refreshNode: () => {},
}

createRoot(options)

const probe = renderJab(({ refresh$ }) => ({ trigger: refresh$ }))

probe.result().trigger()
