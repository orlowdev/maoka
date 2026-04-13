/** @import { Maoka } from "../../maoka.d.ts" */

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

						if (refreshNode(node, options, force)) {
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

	let shouldRefresh = node.lifecycleHandlers.refresh.length === 0

	for (const handler of node.lifecycleHandlers.refresh) {
		try {
			if (handler() === true) shouldRefresh = true
		} catch (error) {
			handleNodeError(node, error)
		}
	}

	if (!shouldRefresh) return true

	try {
		options.refreshNode(node)
	} catch (error) {
		handleNodeError(node, error)
	}

	return true
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
