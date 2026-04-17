/** @import { Maoka } from "../../maoka.d.ts" */

import {
	getComponentKey,
	getComponentType,
	handleNodeError,
	getNodeComponentType,
	isComponent,
	pure,
	updateNodeComponent,
} from "../../src/maoka.impl.js"

const Text = pure(
	"#text",
	({ props }) =>
		() =>
			props().value,
)
const refreshVersions = new WeakMap()

/**
 * Creates a renderer-agnostic Maoka root.
 *
 * @template $Type
 * @param {Maoka.RootOptions<$Type>} options
 * @returns {Maoka.Root<$Type>}
 */
export const createRoot = options => {
	const refreshQueue = new Map()
	const nextRefreshQueue = new Map()
	const createKey = options.createKey ?? createKeyFactory()
	const scheduleRefresh = options.scheduleRefresh ?? queueMicrotaskScheduler
	const cancelRefresh = options.cancelRefresh ?? noop
	const renderer = {
		...options,
		insertNode: options.insertNode ?? noop,
		removeNode: options.removeNode ?? noop,
		queueRefresh,
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
							node.children.forEach(child => queueCurrentRefresh(child, false))
						}
					}
				}
			} finally {
				flushing = false
				scheduled = false
				scheduledRefresh = null

				if (nextRefreshQueue.size) {
					for (const [node, force] of nextRefreshQueue) {
						refreshQueue.set(node, refreshQueue.get(node) || force)
					}

					nextRefreshQueue.clear()
					scheduled = true
					scheduledRefresh = scheduleRefresh(root.flushRefreshQueue)
				}
			}
		},
	}

	return root

	function queueRefresh(node, force) {
		const queue = flushing ? nextRefreshQueue : refreshQueue

		queue.set(node, queue.get(node) || force)

		if (!scheduled && !flushing) {
			scheduled = true
			scheduledRefresh = scheduleRefresh(root.flushRefreshQueue)
		}
	}

	function queueCurrentRefresh(node, force) {
		refreshQueue.set(node, refreshQueue.get(node) || force)
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

const isRefreshContinuation = result => typeof result === "function"

const refreshNode = (node, options, force) => {
	if (node.disposed === true) return false
	if (!force && !refreshProps(node)) return false

	const refreshVersion = bumpRefreshVersion(node)
	let shouldRefresh = node.lifecycleHandlers.beforeRefresh.length === 0
	const continuations = []

	for (const handler of node.lifecycleHandlers.beforeRefresh) {
		try {
			const result = handler()

			if (isRefreshContinuation(result)) {
				continuations.push(result)
				shouldRefresh = true
			} else if (result === true) {
				shouldRefresh = true
			}
		} catch (error) {
			handleNodeError(node, error)
		}
	}

	if (!shouldRefresh) return true

	renderNode(node, options)

	void runRefreshContinuations(node, options, continuations, refreshVersion)

	return true
}

const bumpRefreshVersion = node => {
	const refreshVersion = (refreshVersions.get(node) ?? 0) + 1

	refreshVersions.set(node, refreshVersion)

	return refreshVersion
}

const renderNode = (node, options) => {
	try {
		node.lastRenderResult = node.render()
		applyTemplate(node, options)
	} catch (error) {
		handleNodeError(node, error)
	}
}

const runRefreshContinuations = async (
	node,
	options,
	continuations,
	refreshVersion,
) => {
	let shouldRefresh = false

	for (const continuation of continuations) {
		try {
			if (refreshVersions.get(node) !== refreshVersion) return

			if ((await continuation()) === true) {
				shouldRefresh = true
			}
		} catch (error) {
			if (refreshVersions.get(node) !== refreshVersion) return

			handleNodeError(node, error)
		}
	}

	if (shouldRefresh && refreshVersions.get(node) === refreshVersion) {
		renderNode(node, options)
		node.children.forEach(child => options.queueRefresh(child, false))
	}
}

const mountNode = (node, options) => {
	if (node.failed === true || node.disposed === true) return

	try {
		applyTemplate(node, options)

		if (node.parent?.parent === null) {
			const index = node.parent.children.indexOf(node)

			if (index !== -1 && !isImplicitNode(node)) {
				options.insertNode(node.parent, node, index)
			}

			if (node.parent.mounted) mountNodeTree(node)

			return
		}

		mountImplicitNode(node)
	} catch (error) {
		handleNodeError(node, error)
	}
}

const applyTemplate = (node, options) => {
	if (node.hasRenderPhase === false) {
		removeChildren(node, options)

		return
	}

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
	const nextChildren = []

	for (const [index, component] of components.entries()) {
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

			nextChildren.push(child)

			continue
		}

		const nextChild = instantiateComponent(component, node.root, node)

		if (nextChild.failed === true) {
			continue
		}

		mountNode(nextChild, options)
		usedChildren.add(nextChild)
		nextChildren.push(nextChild)
	}

	for (const child of previousChildren) {
		if (!usedChildren.has(child)) {
			destroyNode(child, options)
		}
	}

	node.children.length = 0
	node.children.push(...nextChildren)

	for (const [index, child] of nextChildren.entries()) {
		if (!isImplicitNode(child)) {
			options.insertNode(node, child, index)
		}

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
	if (node.disposed === true) return

	node.disposed = true
	refreshVersions.delete(node)

	removeChildren(node, options)

	for (const handler of node.lifecycleHandlers.beforeUnmount) {
		try {
			handler()
		} catch (error) {
			handleNodeError(node, error)
		}
	}

	if (!isImplicitNode(node)) {
		options.removeNode(node)
	}

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
	if (node.parent?.mounted && isImplicitNode(node)) {
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
	node.syncProps()

	return node.propsChanged
}

const isImplicitNode = node => node.value === node.parent?.value
