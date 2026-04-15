import { describe, expect, test } from "bun:test"

import { createRoot } from "../index.js"
import { pure } from "../../src/maoka.impl.js"

const createNode = key => ({
	key,
	value: { tag: key },
	propsData: {},
	propsChanged: false,
	syncProps: () => ({ key }),
	props: () => ({ key }),
	root: null,
	render: () => key,
	lastRenderResult: key,
	parent: null,
	children: [],
	refresh$: () => {},
	lifecycleHandlers: {
		afterMount: [],
		beforeRefresh: [],
		error: [],
		beforeUnmount: [],
		afterUnmount: [],
	},
	mounted: false,
	updateProps: () => {},
})

const createPropsNode = (key, getProps) => {
	const node = createNode(key)

	node.propsData = getProps()
	node.syncProps = () => {
		const props = getProps()
		const hasChanged =
			Object.keys(props).some(
				propKey => props[propKey] !== node.propsData[propKey],
			) || Object.keys(node.propsData).some(propKey => !(propKey in props))

		node.propsChanged = hasChanged

		if (hasChanged) node.propsData = props

		return props
	}
	node.props = () => ({ ...node.syncProps(), key })

	return node
}

const createDeferred = () => {
	let resolve
	let reject
	const promise = new Promise((resolvePromise, rejectPromise) => {
		resolve = resolvePromise
		reject = rejectPromise
	})

	return { promise, resolve, reject }
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
			cancelRefresh: scheduledRefresh =>
				void canceledFlushes.push(scheduledRefresh),
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
		const grandchild = createPropsNode("grandchild", () => ({
			grandchildCount,
		}))

		parent.children.push(child)
		parent.lifecycleHandlers.beforeRefresh.push(() => {})
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
		parent.lifecycleHandlers.beforeRefresh.push(() => {})
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
		parent.lifecycleHandlers.beforeRefresh.push(() => {})

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

		skippedNode.lifecycleHandlers.beforeRefresh.push(() => {
			refreshCalls.push("skipped:first")

			return
		})
		skippedNode.lifecycleHandlers.beforeRefresh.push(() => {
			refreshCalls.push("skipped:second")

			return
		})
		refreshedNode.lifecycleHandlers.beforeRefresh.push(() => {
			refreshCalls.push("refreshed:first")

			return
		})
		refreshedNode.lifecycleHandlers.beforeRefresh.push(() => {
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

		node.lifecycleHandlers.beforeRefresh.push(() => {
			refreshCalls.push("first")

			throw error
		})
		node.lifecycleHandlers.beforeRefresh.push(() => {
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

	test("renders before and after async refresh continuations", async () => {
		const deferred = createDeferred()
		const refreshedValues = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedValues.push(node.lastRenderResult),
		})
		const node = createNode("node")
		let value = "loading"

		node.render = () => value
		node.lifecycleHandlers.beforeRefresh.push(() => async () => {
			await deferred.promise
			value = "ready"

			return true
		})

		root.refreshNode(node)
		root.flushRefreshQueue()

		expect(refreshedValues).toEqual(["loading"])

		deferred.resolve()
		await deferred.promise
		await Promise.resolve()

		expect(refreshedValues).toEqual(["loading", "ready"])
	})

	test("routes async refresh continuation errors to node error handlers", async () => {
		const error = new Error("Async refresh failed")
		const handledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {},
		})
		const node = createNode("node")

		node.lifecycleHandlers.beforeRefresh.push(() => async () => {
			throw error
		})
		node.lifecycleHandlers.error.push(handledError => {
			handledErrors.push(handledError)
		})

		root.refreshNode(node)
		root.flushRefreshQueue()
		await Promise.resolve()

		expect(handledErrors).toEqual([error])
	})

	test("queues refresh requests from refresh handlers for the next flush", async () => {
		const deferred = createDeferred()
		const refreshedValues = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedValues.push(node.lastRenderResult),
		})
		const node = createNode("node")
		let isLoading = false
		let value = "idle"

		node.root = root
		node.refresh$ = () => root.refreshNode(node)
		node.render = () => (isLoading ? "Loading..." : value)
		node.lifecycleHandlers.beforeRefresh.push(() => {
			if (!isLoading) {
				isLoading = true
				node.refresh$()

				return false
			}

			return async () => {
				await deferred.promise
				value = "ready"
				isLoading = false

				return true
			}
		})

		root.refreshNode(node)
		root.flushRefreshQueue()

		expect(refreshedValues).toEqual([])

		await Promise.resolve()

		expect(refreshedValues).toEqual(["Loading..."])

		deferred.resolve()
		await deferred.promise
		await Promise.resolve()

		expect(refreshedValues).toEqual(["Loading...", "ready"])
	})

	test("refreshes children after async refresh continuations update props", async () => {
		const deferred = createDeferred()
		const refreshedValues = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: node => void refreshedValues.push(node.lastRenderResult),
		})
		const Child = pure("child", ({ props }) => () => {
			return `Child: ${props().count}`
		})
		const parent = createNode("parent")
		let childCount = 0

		parent.root = root
		parent.render = () => Child(() => ({ key: "child", count: childCount }))
		parent.lastRenderResult = parent.render()
		parent.lifecycleHandlers.beforeRefresh.push(() => async () => {
			await deferred.promise
			childCount = 1

			return true
		})

		root.mountNode(parent)

		refreshedValues.length = 0
		root.refreshNode(parent)
		root.flushRefreshQueue()

		deferred.resolve()
		await deferred.promise
		await Promise.resolve()
		await Promise.resolve()

		expect(refreshedValues).toEqual(["Child: 1"])
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

	test("bubbles renderer refresh errors to parent error handlers", () => {
		const error = new Error("Refresh failed")
		const handledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw error
			},
		})
		const parent = createNode("parent")
		const child = createNode("child")

		child.parent = parent
		parent.children.push(child)
		parent.lifecycleHandlers.error.push((selfError, descendantError) => {
			descendantError.handle()
			handledErrors.push({ selfError, descendantError })
		})

		root.refreshNode(child)
		root.flushRefreshQueue()

		expect(handledErrors).toEqual([
			{
				selfError: undefined,
				descendantError: {
					error,
					handled: true,
					handle: expect.any(Function),
				},
			},
		])
	})

	test("continues bubbling renderer refresh errors until a parent handles the container", () => {
		const error = new Error("Refresh failed")
		const handledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw error
			},
		})
		const grandparent = createNode("grandparent")
		const parent = createNode("parent")
		const child = createNode("child")

		parent.parent = grandparent
		child.parent = parent
		grandparent.children.push(parent)
		parent.children.push(child)
		parent.lifecycleHandlers.error.push((selfError, descendantError) => {
			handledErrors.push({
				owner: "parent",
				selfError,
				error: descendantError.error,
				handled: descendantError.handled,
			})
		})
		grandparent.lifecycleHandlers.error.push((selfError, descendantError) => {
			descendantError.handle()
			handledErrors.push({
				owner: "grandparent",
				selfError,
				error: descendantError.error,
				handled: descendantError.handled,
			})
		})

		root.refreshNode(child)
		root.flushRefreshQueue()

		expect(handledErrors).toEqual([
			{
				owner: "parent",
				selfError: undefined,
				error,
				handled: false,
			},
			{
				owner: "grandparent",
				selfError: undefined,
				error,
				handled: true,
			},
		])
	})

	test("throws renderer refresh errors when parent handlers do not handle the container", () => {
		const error = new Error("Refresh failed")
		const handledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw error
			},
		})
		const parent = createNode("parent")
		const child = createNode("child")

		child.parent = parent
		parent.children.push(child)
		parent.lifecycleHandlers.error.push((selfError, descendantError) => {
			handledErrors.push({ selfError, descendantError })
		})

		root.refreshNode(child)

		expect(() => root.flushRefreshQueue()).toThrow(error)
		expect(handledErrors).toEqual([
			{
				selfError: undefined,
				descendantError: {
					error,
					handled: false,
					handle: expect.any(Function),
				},
			},
		])
	})

	test("keeps renderer refresh errors local when node has error handlers", () => {
		const error = new Error("Refresh failed")
		const parentHandledErrors = []
		const childHandledErrors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw error
			},
		})
		const parent = createNode("parent")
		const child = createNode("child")

		child.parent = parent
		parent.children.push(child)
		parent.lifecycleHandlers.error.push((selfError, descendantError) => {
			parentHandledErrors.push({ selfError, descendantError })
		})
		child.lifecycleHandlers.error.push((selfError, descendantError) => {
			childHandledErrors.push({ selfError, descendantError })
		})

		root.refreshNode(child)
		root.flushRefreshQueue()

		expect(childHandledErrors).toEqual([
			{ selfError: error, descendantError: undefined },
		])
		expect(parentHandledErrors).toEqual([])
	})

	test("throws renderer refresh errors when no error handler exists", () => {
		const error = new Error("Refresh failed")
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw error
			},
		})
		const node = createNode("node")

		root.refreshNode(node)

		expect(() => root.flushRefreshQueue()).toThrow(error)
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

	test("runs beforeUnmount handlers before removing stale nodes", () => {
		const calls = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {},
			removeNode: node => void calls.push(`remove:${node.key}`),
		})
		const parent = createNode("parent")
		const child = createNode("child")
		const grandchild = createNode("grandchild")

		parent.children.push(child)
		child.children.push(grandchild)
		child.lifecycleHandlers.beforeUnmount.push(() =>
			calls.push("beforeUnmount:child"),
		)
		grandchild.lifecycleHandlers.beforeUnmount.push(() =>
			calls.push("beforeUnmount:grandchild"),
		)
		parent.lastRenderResult = []

		root.mountNode(parent)

		expect(calls).toEqual([
			"beforeUnmount:grandchild",
			"remove:grandchild",
			"beforeUnmount:child",
			"remove:child",
		])
	})

	test("runs afterMount handlers once after insertion and afterUnmount handlers after removal", () => {
		const calls = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {},
			insertNode: (parent, node) => {
				calls.push(`insert:${node.key}:into:${parent.key}`)
			},
			removeNode: node => {
				calls.push(`remove:${node.key}`)
			},
		})
		const parent = createNode("parent")
		let child
		const Child = (root, parent) => {
			child = createNode("child")
			child.root = root
			child.parent = parent
			child.lifecycleHandlers.afterMount.push(() => {
				calls.push("afterMount:child")

				return () => calls.push("afterMount-cleanup:child")
			})
			child.lifecycleHandlers.afterUnmount.push(() =>
				calls.push("afterUnmount:child"),
			)

			return child
		}

		parent.mounted = true
		parent.lastRenderResult = [() => Child]

		root.mountNode(parent)
		root.mountNode(parent)

		expect(child.mounted).toBe(true)
		expect(calls).toEqual([
			"insert:child:into:parent",
			"afterMount:child",
			"insert:child:into:parent",
		])

		parent.lastRenderResult = []
		root.mountNode(parent)

		expect(child.mounted).toBe(false)
		expect(calls).toEqual([
			"insert:child:into:parent",
			"afterMount:child",
			"insert:child:into:parent",
			"afterMount-cleanup:child",
			"remove:child",
			"afterUnmount:child",
		])
	})

	test("routes mount-time renderer errors to node error handlers", () => {
		const errors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {
				throw new Error("mount refresh failed")
			},
		})
		const node = createNode("node")

		node.lifecycleHandlers.error.push(error => {
			errors.push(error.message)
		})

		root.mountNode(node)

		expect(errors).toEqual(["mount refresh failed"])
	})

	test("routes beforeUnmount cleanup errors to node error handlers", () => {
		const errors = []
		const removedNodes = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			refreshNode: () => {},
			removeNode: node => void removedNodes.push(node.key),
		})
		const parent = createNode("parent")
		const child = createNode("child")

		parent.children.push(child)
		child.lifecycleHandlers.beforeUnmount.push(() => {
			throw new Error("cleanup failed")
		})
		child.lifecycleHandlers.error.push(error => {
			errors.push(error.message)
		})

		root.refreshNode(parent)
		root.flushRefreshQueue()

		expect(errors).toEqual(["cleanup failed"])
		expect(removedNodes).toEqual(["child"])
	})

	test("routes afterMount handler errors to node error handlers", () => {
		const errors = []
		const root = createRoot({
			value: { tag: "root" },
			createValue: tag => ({ tag }),
			insertNode: () => {},
			refreshNode: () => {},
		})
		const parent = createNode("parent")
		let child
		const Child = (root, parent) => {
			child = createNode("child")
			child.root = root
			child.parent = parent
			child.lifecycleHandlers.afterMount.push(() => {
				throw new Error("afterMount failed")
			})
			child.lifecycleHandlers.error.push(error => {
				errors.push(error.message)
			})

			return child
		}

		parent.mounted = true
		parent.lastRenderResult = [() => Child]

		root.mountNode(parent)

		expect(errors).toEqual(["afterMount failed"])
	})
})
