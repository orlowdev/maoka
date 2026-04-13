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
		template: null,
		children: [],
		lifecycleHandlers: {
			refresh: [],
			error: [],
		},
	}

	return { createdValueTags, parent, refreshedNodes, root }
}

describe("maoka components", () => {
	test("create builds a node from the parent value", () => {
		const { parent, refreshedNodes, root } = createRoot()
		const onRefresh = () => {}
		const onError = () => {}
		let params

		const node = maoka.create(receivedParams => {
			params = receivedParams
			receivedParams.lifecycle.onRefresh(onRefresh)
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
			template: {
				key: "key-1",
				parentKey: "parent",
				rootKey: "root",
				used: "use-result",
				value: parent.value,
			},
		})
		expect(node.render()).toEqual(node.template)
		expect(node.lifecycleHandlers.refresh).toEqual([onRefresh])
		expect(node.lifecycleHandlers.error).toEqual([onError])

		params.refresh$()
		expect(refreshedNodes).toEqual([node])

		expect(node.props$()).toEqual({ id: "box", key: "key-1" })
		expect(refreshedNodes).toEqual([node])

		expect(node.props$()).toEqual({ id: "box", key: "key-1" })
		expect(refreshedNodes).toEqual([node])
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
		expect(node.template).toBe("Count: 1")
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
		expect(node.template).toBe("key-2")
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
			expect(node.template).toBe(tag)
		}
	})
})
