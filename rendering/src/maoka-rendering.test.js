import { describe, expect, test } from "bun:test"

import { createRoot } from "../index.js"

const createNode = key => ({
	key,
	value: { tag: key },
	props: {},
	props$: () => ({ key }),
	root: null,
	render: () => key,
	template: key,
	parent: null,
	children: [],
	refresh$: () => {},
	lifecycleHandlers: {
		refresh: [],
		error: [],
	},
})

const createPropsNode = (key, getProps) => {
	const node = createNode(key)

	node.props = getProps()
	node.props$ = () => {
		const props = getProps()
		const hasChanged =
			Object.keys(props).some(propKey => props[propKey] !== node.props[propKey]) ||
			Object.keys(node.props).some(propKey => !(propKey in props))

		if (hasChanged) node.props = props

		return { ...props, key }
	}

	return node
}

describe("createRoot", () => {
	test("creates a renderer-agnostic root", () => {
		let key = 0
		const refreshedNodes = []

		const root = createRoot({
			value: { tag: "root" },
			createKey: () => `key-${++key}`,
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})

		expect(root.key).toBe("key-1")
		expect(root.value).toEqual({ tag: "root" })
		expect(root.children).toEqual([])
		expect(root.createKey()).toBe("key-2")
		expect(root.createValue("button")).toEqual({ tag: "button" })
	})

	test("deduplicates queued refreshes before asking the renderer", async () => {
		const refreshedNodes = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})
		const first = createNode("first")
		const second = createNode("second")

		root.refreshNode(first)
		root.refreshNode(first)
		root.refreshNode(second)

		expect(refreshedNodes).toEqual([])

		await Promise.resolve()

		expect(refreshedNodes).toEqual([first, second])
	})

	test("uses custom refresh scheduler and cancels it on manual flush", () => {
		const scheduledFlushes = []
		const canceledFlushes = []
		const refreshedNodes = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
			scheduleRefresh: flush => {
				const scheduledRefresh = { flush }

				scheduledFlushes.push(scheduledRefresh)

				return scheduledRefresh
			},
			cancelRefresh: scheduledRefresh => void canceledFlushes.push(scheduledRefresh),
		})
		const first = createNode("first")
		const second = createNode("second")

		root.refreshNode(first)
		root.refreshNode(second)

		expect(scheduledFlushes).toHaveLength(1)
		expect(refreshedNodes).toEqual([])

		root.flushRefreshQueue()

		expect(canceledFlushes).toEqual(scheduledFlushes)
		expect(refreshedNodes).toEqual([first, second])
	})

	test("refreshes changed child after a parent refresh", () => {
		const refreshedNodes = []
		let childCount = 0
		let grandchildCount = 0
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})
		const parent = createNode("parent")
		const child = createPropsNode("child", () => ({ childCount }))
		const grandchild = createPropsNode("grandchild", () => ({ grandchildCount }))

		parent.children.push(child)
		parent.lifecycleHandlers.refresh.push(() => {})
		child.children.push(grandchild)
		childCount++
		grandchildCount++

		root.refreshNode(parent)
		root.refreshNode(child)
		root.flushRefreshQueue()

		expect(refreshedNodes).toEqual([child])
	})

	test("refreshes children when a parent skips its own renderer refresh", () => {
		const refreshedNodes = []
		let childCount = 0
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})
		const parent = createNode("parent")
		const child = createPropsNode("child", () => ({ childCount }))

		parent.children.push(child)
		parent.lifecycleHandlers.refresh.push(() => {})
		childCount++

		root.refreshNode(parent)
		root.flushRefreshQueue()

		expect(refreshedNodes).toEqual([child])
	})

	test("skips cascaded child refresh when props are shallow equal", () => {
		const refreshedNodes = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})
		const parent = createNode("parent")
		const child = createPropsNode("child", () => ({ count: 1 }))

		parent.children.push(child)
		parent.lifecycleHandlers.refresh.push(() => {})

		root.refreshNode(parent)
		root.flushRefreshQueue()

		expect(refreshedNodes).toEqual([])
	})

	test("asks the renderer to refresh when any refresh handler returns true", () => {
		const refreshedNodes = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})
		const skippedNode = createNode("skipped")
		const refreshedNode = createNode("refreshed")
		const refreshCalls = []

		skippedNode.lifecycleHandlers.refresh.push(() => {
			refreshCalls.push("skipped:first")

			return
		})
		skippedNode.lifecycleHandlers.refresh.push(() => {
			refreshCalls.push("skipped:second")

			return
		})
		refreshedNode.lifecycleHandlers.refresh.push(() => {
			refreshCalls.push("refreshed:first")

			return
		})
		refreshedNode.lifecycleHandlers.refresh.push(() => {
			refreshCalls.push("refreshed:second")

			return true
		})

		root.refreshNode(skippedNode)
		root.refreshNode(refreshedNode)
		root.flushRefreshQueue()

		expect(refreshCalls).toEqual([
			"skipped:first",
			"skipped:second",
			"refreshed:first",
			"refreshed:second",
		])
		expect(refreshedNodes).toEqual([refreshedNode])
	})

	test("routes refresh handler errors to node error handlers and continues refresh handlers", () => {
		const error = new Error("Refresh handler failed")
		const refreshCalls = []
		const handledErrors = []
		const refreshedNodes = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedNodes.push(node),
		})
		const node = createNode("node")

		node.lifecycleHandlers.refresh.push(() => {
			refreshCalls.push("first")

			throw error
		})
		node.lifecycleHandlers.refresh.push(() => {
			refreshCalls.push("second")

			return true
		})
		node.lifecycleHandlers.error.push(handledError => {
			handledErrors.push(handledError)
		})

		root.refreshNode(node)
		root.flushRefreshQueue()

		expect(refreshCalls).toEqual(["first", "second"])
		expect(handledErrors).toEqual([error])
		expect(refreshedNodes).toEqual([node])
	})

	test("routes renderer refresh errors to node error handlers", () => {
		const error = new Error("Refresh failed")
		const handledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw error
			},
		})
		const node = createNode("node")

		node.lifecycleHandlers.error.push(handledError => {
			handledErrors.push(handledError)
		})

		root.refreshNode(node)
		root.flushRefreshQueue()

		expect(handledErrors).toEqual([error])
	})

	test("continues refreshing queued nodes after one node fails", () => {
		const error = new Error("Refresh failed")
		const refreshedNodes = []
		const handledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => {
				if (node.key === "broken") throw error

				refreshedNodes.push(node)
			},
		})
		const broken = createNode("broken")
		const stable = createNode("stable")

		broken.lifecycleHandlers.error.push(handledError => {
			handledErrors.push(handledError)
		})

		root.refreshNode(broken)
		root.refreshNode(stable)
		root.flushRefreshQueue()

		expect(handledErrors).toEqual([error])
		expect(refreshedNodes).toEqual([stable])
	})
})
