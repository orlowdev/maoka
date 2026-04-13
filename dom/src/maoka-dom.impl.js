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
		scheduleRefresh: scheduleAnimationFrame,
		cancelRefresh: cancelAnimationFrameRefresh,
	})
	const parent = createRootNode(root, container)
	const rootNode = instantiateComponent(component, root, parent)

	applyTemplate(rootNode, rootNode.template)

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
	node.template = node.render()
	applyTemplate(node, node.template)
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

const applyTemplate = (node, template) => {
	if (Array.isArray(template)) {
		applyComponentTemplates(node, template)

		return
	}

	if (isComponent(template)) {
		applyComponentTemplates(node, [template])

		return
	}

	applyTextTemplate(node, template)
}

const applyComponentTemplates = (node, templates) => {
	const components = templates.filter(isComponent)

	if (components.length !== templates.length) {
		applyTextTemplate(node, templates.join(""))

		return
	}

	const previousChildren = [...node.children]
	const nextChildren = []

	node.value.textContent = ""

	for (const [index, component] of components.entries()) {
		const child = previousChildren[index] ?? instantiateComponent(component, node.root, node)

		nextChildren.push(child)

		if (child.value.parentNode !== node.value) {
			node.value.appendChild(child.value)
		}

		if (!previousChildren[index]) {
			applyTemplate(child, child.template)
		}
	}

	for (const child of previousChildren.slice(components.length)) {
		removeNodeValue(child)
	}

	node.children.length = 0
	node.children.push(...nextChildren)
}

const applyTextTemplate = (node, template) => {
	for (const child of node.children) {
		removeNodeValue(child)
	}

	node.children.length = 0
	node.value.textContent = template == null ? "" : String(template)
}

const removeNodeValue = node => {
	if (node.value.parentNode) {
		node.value.parentNode.removeChild(node.value)
	}
}

const isComponent = template => typeof template === "function"
