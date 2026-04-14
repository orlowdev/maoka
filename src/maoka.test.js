import { describe, expect, test } from "bun:test"

import maoka from "../index.js"

const createRoot = () => {
	const refreshedNodes = []
	const createdValueTags = []

	const root = {
		key: "root",
		value: { tag: "root" },
		children: [],
		createKey: () => `key-${refreshedNodes.length + createdValueTags.length + 1}`,
		createValue: tag => {
			createdValueTags.push(tag)

			return { tag: typeof tag === "string" ? tag : tag.tag }
		},
		refreshNode: node => void refreshedNodes.push(node),
	}

	const parent = {
		key: "parent",
		value: { tag: "parent" },
		props: {},
		props$: () => ({ key: "parent" }),
		root,
		parent: null,
		lastRenderResult: null,
		children: [],
		lifecycleHandlers: {
			afterMount: [],
			beforeRefresh: [],
			error: [],
			beforeUnmount: [],
			afterUnmount: [],
		},
		mounted: true,
	}

	return { createdValueTags, parent, refreshedNodes, root }
}

describe("maoka components", () => {
	test("create builds a node from the parent value", () => {
		const { parent, refreshedNodes, root } = createRoot()
		const beforeRefresh = () => {}
		const onError = () => {}
		let params

		const node = maoka.create(receivedParams => {
			params = receivedParams
			receivedParams.lifecycle.beforeRefresh(beforeRefresh)
			receivedParams.lifecycle.onError(onError)

			return () => ({
				key: receivedParams.key,
				parentKey: receivedParams.parentKey,
				rootKey: receivedParams.rootKey,
				used: receivedParams.use(() => "use-result"),
				value: receivedParams.value,
			})
		})(() => ({ id: "box" }))(root, parent)

		expect(node).toMatchObject({
			key: "key-1",
			value: parent.value,
			root,
			parent,
			children: [],
			lastRenderResult: {
				key: "key-1",
				parentKey: "parent",
				rootKey: "root",
				used: "use-result",
				value: parent.value,
			},
		})
		expect(node.render()).toEqual(node.lastRenderResult)
		expect(node.lifecycleHandlers.beforeRefresh).toEqual([beforeRefresh])
		expect(node.lifecycleHandlers.error).toEqual([onError])

		params.refresh$()
		expect(refreshedNodes).toEqual([node])

		expect(node.props$()).toEqual({ id: "box", key: "key-1" })
		expect(refreshedNodes).toEqual([node])

		expect(node.props$()).toEqual({ id: "box", key: "key-1" })
		expect(refreshedNodes).toEqual([node])
	})

	test("component beforeCreate handlers run once before the definition", () => {
		const { parent, root } = createRoot()
		const calls = []
		const Component = maoka.create(params => {
			calls.push(`definition:${params.key}`)

			return () => {
				calls.push(`render:${params.key}`)

				return params.key
			}
		})(() => ({ id: "box", key: "custom-key" }))

		const returned = Component.beforeCreate(params => {
			calls.push(`before:first:${params.key}`)
		}).beforeCreate(params => {
			calls.push(`before:second:${params.key}`)
		})

		expect(returned).toBe(Component)

		const node = Component(root, parent)

		expect(node.lastRenderResult).toBe("custom-key")
		expect(calls).toEqual([
			"before:first:custom-key",
			"before:second:custom-key",
			"definition:custom-key",
			"render:custom-key",
		])

		node.render()

		expect(calls).toEqual([
			"before:first:custom-key",
			"before:second:custom-key",
			"definition:custom-key",
			"render:custom-key",
			"render:custom-key",
		])
	})

	test("initial props read does not queue a refresh", () => {
		const { parent, refreshedNodes, root } = createRoot()
		const node = maoka.create(params => () => params.key)(() => ({
			key: "custom-key",
		}))(root, parent)

		expect(node.key).toBe("custom-key")
		expect(node.lastRenderResult).toBe("custom-key")
		expect(refreshedNodes).toEqual([])
	})

	test("props update the node key and refresh only when values change", () => {
		const { parent, refreshedNodes, root } = createRoot()
		let count = 1
		let key = 0

		const node = maoka.create(({ props$ }) => () => {
			const props = props$()

			return `Count: ${props.count}`
		})(() => ({ count, key }))(root, parent)

		expect(node.key).toBe(0)
		expect(node.lastRenderResult).toBe("Count: 1")
		expect(refreshedNodes).toEqual([])

		expect(node.render()).toBe("Count: 1")
		expect(refreshedNodes).toEqual([])

		count = 2

		expect(node.render()).toBe("Count: 2")
		expect(refreshedNodes).toEqual([node])

		key = ""

		expect(node.render()).toBe("Count: 2")
		expect(node.key).toBe("")
		expect(refreshedNodes).toEqual([node, node])
	})

	test("pure builds a node from a new root value for the tag", () => {
		const { createdValueTags, parent, root } = createRoot()

		const node = maoka.pure("span", params => () => params.key)()(root, parent)

		expect(createdValueTags).toEqual(["span"])
		expect(node.value).toEqual({ tag: "span" })
		expect(node.value).not.toBe(parent.value)
		expect(node.lastRenderResult).toBe("key-2")
	})

	test("tagged html, svg, and math helpers create pure components", () => {
		const cases = [
			["html", "div"],
			["svg", "circle"],
			["math", "mfrac"],
		]

		for (const [namespace, tag] of cases) {
			const { createdValueTags, parent, root } = createRoot()
			const node = maoka[namespace][tag](() => () => tag)()(root, parent)

			expect(createdValueTags).toEqual([{ namespace, tag }])
			expect(node.value).toEqual({ tag })
			expect(node.lastRenderResult).toBe(tag)
		}
	})
})
