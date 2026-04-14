/** @import { Maoka } from "../../maoka.d.ts" */

import {
	getComponentKey,
	getComponentType,
	getNodeComponentType,
	isComponent,
	pure,
	updateNodeComponent,
} from "../../src/maoka.impl.js"

const Text = pure("#text", ({ props$ }) => () => props$().value)

/**
 * Creates a renderer-agnostic Maoka root.
 *
 * @template $Type
 * @param {Maoka.RootOptions<$Type>} options
 * @returns {Maoka.Root<$Type>}
 */
export const createRoot = options => {
	const refreshQueue = new Map()
	const createKey = options.createKey ?? createKeyFactory()
	const scheduleRefresh = options.scheduleRefresh ?? queueMicrotaskScheduler
	const cancelRefresh = options.cancelRefresh ?? noop
	const renderer = {
		...options,
		insertNode: options.insertNode ?? noop,
		removeNode: options.removeNode ?? noop,
	}
	let scheduledRefresh = null
	let scheduled = false
	let flushing = false

	/** @type {Maoka.Root<$Type>} */
	const root = {
		key: options.key ?? createKey(),
		value: options.value,
		children: [],
		createKey,
		createValue: options.createValue,
		mountNode: node => mountNode(node, renderer),
		refreshNode: node => queueRefresh(node, true),
		flushRefreshQueue: () => {
			if (flushing) return

			if (scheduled) cancelRefresh(scheduledRefresh)

			scheduled = false
			scheduledRefresh = null
			flushing = true

			try {
				const refreshedNodes = new Set()

				while (refreshQueue.size) {
					const nodes = [...refreshQueue]

					refreshQueue.clear()

					for (const [node, force] of nodes) {
						if (refreshedNodes.has(node)) continue

						if (refreshNode(node, renderer, force)) {
							refreshedNodes.add(node)
							node.children.forEach(child => queueRefresh(child, false))
						}
					}
				}
			} finally {
				flushing = false
				scheduled = false
				scheduledRefresh = null
			}
		},
	}

	return root

	function queueRefresh(node, force) {
		refreshQueue.set(node, refreshQueue.get(node) || force)

		if (!scheduled && !flushing) {
			scheduled = true
			scheduledRefresh = scheduleRefresh(root.flushRefreshQueue)
		}
	}
}

// --- Internal ---

const createKeyFactory = () => {
	let key = 0

	return () => `key-${++key}`
}

const noop = () => {}

const queueMicrotaskScheduler = flush => {
	queueMicrotask(flush)

	return null
}

const refreshNode = (node, options, force) => {
	if (!force && !refreshProps(node)) return false

	let shouldRefresh = node.lifecycleHandlers.beforeRefresh.length === 0

	for (const handler of node.lifecycleHandlers.beforeRefresh) {
		try {
			if (handler() === true) shouldRefresh = true
		} catch (error) {
			handleNodeError(node, error)
		}
	}

	if (!shouldRefresh) return true

	try {
		node.lastRenderResult = node.render()
		applyTemplate(node, options)
	} catch (error) {
		handleNodeError(node, error)
	}

	return true
}

const mountNode = (node, options) => {
	try {
		applyTemplate(node, options)
		mountImplicitNode(node)
	} catch (error) {
		handleNodeError(node, error)
	}
}

const applyTemplate = (node, options) => {
	if (Array.isArray(node.lastRenderResult)) {
		applyTemplateList(node, node.lastRenderResult, options)

		return
	}

	if (isComponentTemplate(node.lastRenderResult)) {
		applyComponentTemplates(node, [toComponent(node.lastRenderResult)], options)

		return
	}

	removeChildren(node, options)
	options.refreshNode(node)
}

const applyTemplateList = (node, template, options) => {
	const templateItems = template.filter(isRenderableTemplate)

	if (templateItems.some(isComponentTemplate)) {
		applyComponentTemplates(node, templateItems.map(toComponent), options)

		return
	}

	node.lastRenderResult = templateItems.join("")
	removeChildren(node, options)
	options.refreshNode(node)
}

const applyComponentTemplates = (node, components, options) => {
	const previousChildren = [...node.children]
	const previousKeyedChildren = new Map(
		previousChildren.map(child => [child.key, child]),
	)
	const usedChildren = new Set()
	const nextChildren = components.map((component, index) => {
		const componentKey = getComponentKey(component)
		const child =
			componentKey === undefined
				? previousChildren[index]
				: previousKeyedChildren.get(componentKey)

		if (
			child &&
			!usedChildren.has(child) &&
			getNodeComponentType(child) === getComponentType(component)
		) {
			usedChildren.add(child)
			updateNodeComponent(child, component)

			return child
		}

		const nextChild = instantiateComponent(component, node.root, node)

		mountNode(nextChild, options)
		usedChildren.add(nextChild)

		return nextChild
	})

	for (const child of previousChildren) {
		if (!usedChildren.has(child)) {
			destroyNode(child, options)
		}
	}

	node.children.length = 0
	node.children.push(...nextChildren)

	for (const [index, child] of nextChildren.entries()) {
		options.insertNode(node, child, index)
		if (node.mounted) mountNodeTree(child)
	}
}

const removeChildren = (node, options) => {
	for (const child of node.children) {
		destroyNode(child, options)
	}

	node.children.length = 0
}

const destroyNode = (node, options) => {
	removeChildren(node, options)

	for (const handler of node.lifecycleHandlers.beforeUnmount) {
		try {
			handler()
		} catch (error) {
			handleNodeError(node, error)
		}
	}

	options.removeNode(node)
	unmountNode(node)
}

const mountNodeTree = node => {
	if (node.mounted) return

	node.mounted = true

	for (const handler of node.lifecycleHandlers.afterMount) {
		try {
			const cleanup = handler()

			if (typeof cleanup === "function") {
				node.lifecycleHandlers.beforeUnmount.push(cleanup)
			}
		} catch (error) {
			handleNodeError(node, error)
		}
	}

	node.children.forEach(mountNodeTree)
}

const mountImplicitNode = node => {
	if (node.parent?.mounted && node.value === node.parent.value) {
		mountNodeTree(node)
	}
}

const unmountNode = node => {
	if (!node.mounted) return

	node.mounted = false

	for (const handler of node.lifecycleHandlers.afterUnmount) {
		try {
			handler()
		} catch (error) {
			handleNodeError(node, error)
		}
	}
}

const instantiateComponent = (component, root, parent) =>
	component(root, parent)

const isComponentTemplate = template => typeof template === "function"

const isRenderableTemplate = template =>
	template !== null && template !== undefined && template !== false

const toComponent = template => {
	if (isComponent(template)) return template
	if (isComponentTemplate(template)) return template()

	return Text(() => ({ value: String(template) }))
}

const refreshProps = node => {
	const previousProps = node.props

	node.props$()

	return previousProps !== node.props
}

/**
 * @param {Maoka.Node<$Type, any>} node
 * @param {unknown} error
 */
const handleNodeError = (node, error) => {
	for (const handler of node.lifecycleHandlers.error) {
		handler(error)
	}
}
