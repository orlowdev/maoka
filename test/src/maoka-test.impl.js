/** @import { Maoka } from "../../maoka.d.ts" */

import maoka from "../../index.js"
import { createRoot } from "../../rendering/index.js"
import { isComponent } from "../../src/maoka.impl.js"

/**
 * @typedef {object} TestValue
 * @property {string} tag
 * @property {string} text
 * @property {TestValue | null} parent
 * @property {TestValue[]} children
 */

const RENDER_COMPONENT_INSTANCE_ERROR =
	"render expects a component instance; call the blueprint first"

/**
 * Creates an in-memory renderer value.
 *
 * @param {string} tag
 * @returns {TestValue}
 */
export const createValue = tag => ({
	tag: typeof tag === "string" ? tag : tag.tag,
	text: "",
	parent: null,
	children: [],
})

/**
 * Renders a component into an in-memory tree for tests.
 *
 * @param {Maoka.Blueprint | Maoka.Component<TestValue>} component
 * @param {{ createKey?: () => Maoka.Key, value?: TestValue }} [options]
 * @returns {import("../maoka-test.d.ts").MaokaTestRenderer}
 */
export const render = (component, options = {}) => {
	if (!isComponent(component)) {
		throw new TypeError(RENDER_COMPONENT_INSTANCE_ERROR)
	}

	const value = options.value ?? createValue("root")
	const root = createRoot({
		value,
		createKey: options.createKey,
		createValue,
		refreshNode,
		insertNode,
		removeNode,
		scheduleRefresh,
		cancelRefresh,
	})
	const parent = createRootNode(root, value)
	const node = instantiateComponent(component, root, parent)

	root.mountNode(node)

	return {
		root,
		node,
		value,
		flush: () => root.flushRefreshQueue(),
		refresh: () => {
			root.refreshNode(node)
			root.flushRefreshQueue()
		},
		find: predicate => walk(value).find(predicate),
		findAll: predicate => walk(value).filter(predicate),
		findByTag: tag => walk(value).find(value => value.tag === tag),
		findAllByTag: tag => walk(value).filter(value => value.tag === tag),
		text: () => collectText(value),
		toJSON: () => toJSON(value),
	}
}

/**
 * Runs a jab inside a real Maoka component context.
 *
 * @template $Return
 * @param {Maoka.Jab<TestValue, any, $Return>} jab
 * @param {{ props?: Maoka.Props<any>, template?: (result: $Return, params: Maoka.Params<TestValue, any>) => Maoka.Template, createKey?: () => Maoka.Key, value?: TestValue }} [options]
 * @returns {import("../maoka-test.d.ts").MaokaTestJabRenderer<$Return>}
 */
export const renderJab = (jab, options = {}) => {
	let params
	let result

	const Probe = maoka.create(receivedParams => {
		params = receivedParams
		result = receivedParams.use(jab)

		return () => options.template?.(result, receivedParams) ?? null
	})
	const renderer = render(Probe(options.props), options)

	return {
		...renderer,
		params: () => params,
		result: () => result,
	}
}

export const setup = renderJab

const refreshNode = node => {
	node.value.text =
		node.lastRenderResult == null ? "" : String(node.lastRenderResult)
}

const insertNode = (parent, node, index) => {
	if (node.value.parent !== parent.value) parent.value.text = ""

	if (node.value.parent) removeValue(node.value)

	const currentIndex = parent.value.children.indexOf(node.value)

	if (currentIndex !== -1) {
		parent.value.children.splice(currentIndex, 1)
	}

	parent.value.children.splice(index, 0, node.value)
	node.value.parent = parent.value
}

const removeNode = node => {
	removeValue(node.value)
}

const scheduleRefresh = flush => flush

const cancelRefresh = () => {}

const createRootNode = (root, value) => ({
	key: root.key,
	value,
	props: {},
	props: () => ({ key: root.key }),
	root,
	render: () => root.children,
	lastRenderResult: root.children,
	parent: null,
	children: root.children,
	refresh$: () => root.refreshNode(root.children[0]),
	lifecycleHandlers: {
		afterMount: [],
		beforeRefresh: [],
		error: [],
		beforeUnmount: [],
		afterUnmount: [],
	},
	mounted: true,
})

const instantiateComponent = (component, root, parent) => {
	return component(root, parent)
}

const removeValue = value => {
	if (!value.parent) return

	value.parent.children = value.parent.children.filter(child => child !== value)
	value.parent = null
}

const walk = value => [value, ...value.children.flatMap(child => walk(child))]

const collectText = value =>
	value.text + value.children.map(collectText).join("")

const toJSON = value => {
	const json = { tag: value.tag }

	if (value.text) json.text = value.text
	if (value.children.length) json.children = value.children.map(toJSON)

	return json
}
