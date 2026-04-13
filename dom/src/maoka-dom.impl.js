/** @import { Maoka } from "../../maoka.d.ts" */

import { MATH_TAGS, SVG_TAGS } from "../../src/maoka.constants.js"
import { createRoot } from "../../rendering/index.js"

const MATH_NAMESPACE = "http://www.w3.org/1998/Math/MathML"
const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

/**
 * Renders a Maoka component into a DOM container.
 *
 * @param {Element} container
 * @param {Maoka.Blueprint | Maoka.Component<Element>} component
 * @param {Maoka.DomRenderOptions} [options]
 * @returns {Maoka.Root<Element>}
 */
export const render = (container, component, options = {}) => {
	const root = createRoot({
		value: container,
		createKey: options.createKey,
		createValue: tag => createElement(container.ownerDocument, tag),
		refreshNode,
		insertNode,
		removeNode,
		scheduleRefresh: scheduleAnimationFrame,
		cancelRefresh: cancelAnimationFrameRefresh,
	})
	const parent = createRootNode(root, container)
	const rootNode = instantiateComponent(component, root, parent)

	root.mountNode(rootNode)

	return root
}

const scheduleAnimationFrame = flush => {
	if (typeof requestAnimationFrame !== "function") {
		queueMicrotask(flush)

		return null
	}

	return requestAnimationFrame(flush)
}

const cancelAnimationFrameRefresh = scheduledRefresh => {
	if (
		scheduledRefresh !== null &&
		typeof cancelAnimationFrame === "function"
	) {
		cancelAnimationFrame(scheduledRefresh)
	}
}

const refreshNode = node => {
	node.value.textContent = node.template == null ? "" : String(node.template)
}

const insertNode = (parent, node, index) => {
	if (node.value.parentNode !== parent.value && parent.value.children.length === 0) {
		parent.value.textContent = ""
	}

	const beforeValue = parent.value.children[index] ?? null

	if (beforeValue === node.value) return

	parent.value.insertBefore(node.value, beforeValue)
}

const removeNode = node => {
	if (node.value.parentNode) {
		node.value.parentNode.removeChild(node.value)
	}
}

const createElement = (document, tag) => {
	if (SVG_TAGS.includes(tag)) return document.createElementNS(SVG_NAMESPACE, tag)
	if (MATH_TAGS.includes(tag)) return document.createElementNS(MATH_NAMESPACE, tag)

	return document.createElement(tag)
}

const createRootNode = (root, container) => ({
	key: root.key,
	value: container,
	props: {},
	props$: () => ({ key: root.key }),
	root,
	render: () => root.children,
	template: root.children,
	parent: null,
	children: root.children,
	refresh$: () => root.refreshNode(createRootNode(root, container)),
	lifecycleHandlers: {
		refresh: [],
		error: [],
	},
})

const instantiateComponent = (component, root, parent) => {
	const initializedComponent =
		component.length >= 2 ? component : component(undefined)

	return initializedComponent(root, parent)
}
