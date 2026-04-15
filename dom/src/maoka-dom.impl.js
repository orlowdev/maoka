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
	if (scheduledRefresh !== null && typeof cancelAnimationFrame === "function") {
		cancelAnimationFrame(scheduledRefresh)
	}
}

const refreshNode = node => {
	node.value.textContent =
		node.lastRenderResult == null ? "" : String(node.lastRenderResult)
}

const insertNode = (parent, node, index) => {
	const childNodes = getChildNodes(parent.value)

	if (node.value.parentNode !== parent.value && childNodes.length === 0) {
		parent.value.textContent = ""
	}

	const beforeValue = getBeforeValue(parent, index)

	if (beforeValue === node.value) return
	if (isNodeInCorrectPosition(parent.value, node.value, beforeValue)) return

	parent.value.insertBefore(node.value, beforeValue)
}

const removeNode = node => {
	if (node.value.parentNode) {
		node.value.parentNode.removeChild(node.value)
	}
}

const createElement = (document, tag) => {
	if (tag === "#text") return document.createTextNode("")

	if (tag.namespace === "svg") {
		return document.createElementNS(SVG_NAMESPACE, tag.tag)
	}

	if (tag.namespace === "math") {
		return document.createElementNS(MATH_NAMESPACE, tag.tag)
	}

	if (tag.namespace === "html") return document.createElement(tag.tag)

	if (SVG_TAGS.includes(tag))
		return document.createElementNS(SVG_NAMESPACE, tag)
	if (MATH_TAGS.includes(tag))
		return document.createElementNS(MATH_NAMESPACE, tag)

	return document.createElement(tag)
}

const getChildNodes = value => Array.from(value.childNodes ?? value.children ?? [])

const isNodeInCorrectPosition = (parentValue, nodeValue, beforeValue) => {
	if (nodeValue.parentNode !== parentValue) return false

	const childNodes = getChildNodes(parentValue)
	const currentIndex = childNodes.indexOf(nodeValue)
	const beforeIndex =
		beforeValue == null ? childNodes.length : childNodes.indexOf(beforeValue)

	if (currentIndex === -1 || beforeIndex === -1) return false

	const targetIndex =
		beforeValue == null ? childNodes.length - 1 : beforeIndex - 1

	return currentIndex === targetIndex
}

const getBeforeValue = (parent, index) => {
	for (const sibling of parent.children.slice(index + 1)) {
		const value = getFirstConcreteValue(sibling)

		if (value?.parentNode === parent.value) return value
	}

	if (isImplicitNode(parent) && parent.parent) {
		const parentIndex = parent.parent.children.indexOf(parent)

		if (parentIndex !== -1) {
			return getBeforeValue(parent.parent, parentIndex)
		}
	}

	return null
}

const getFirstConcreteValue = node => {
	if (!isImplicitNode(node)) return node.value

	for (const child of node.children) {
		const value = getFirstConcreteValue(child)

		if (value) return value
	}

	return null
}

const createRootNode = (root, container) => ({
	key: root.key,
	value: container,
	props: {},
	props: () => ({ key: root.key }),
	root,
	render: () => root.children,
	lastRenderResult: root.children,
	parent: null,
	children: root.children,
	refresh$: () => root.refreshNode(createRootNode(root, container)),
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
	const initializedComponent =
		component.length >= 2 ? component : component(undefined)

	return initializedComponent(root, parent)
}

const isImplicitNode = node => node.value === node.parent?.value
