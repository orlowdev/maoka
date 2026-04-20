/** @import { Maoka } from "../../maoka.d.ts" */

import { HTML_TAGS, MATH_TAGS, SVG_TAGS } from "../../src/maoka.constants.js"
import { createRoot } from "../../rendering/index.js"
import { isComponent, isNode, markNode } from "../../src/maoka.impl.js"

const RENDER_COMPONENT_INSTANCE_ERROR =
	"render expects a component instance; call the blueprint first"
const VOID_HTML_TAGS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
])

/**
 * Renders a Maoka component into an HTML string.
 *
 * @param {Maoka.Component<any>} component
 * @param {{ createKey?: () => Maoka.Key }} [options]
 * @returns {string}
 */
export const render = (component, options = {}) => {
	if (!isComponent(component)) {
		throw new TypeError(RENDER_COMPONENT_INSTANCE_ERROR)
	}

	const value = createContainerValue()
	const root = createRoot({
		value,
		createKey: options.createKey,
		createValue,
		refreshNode,
		insertNode,
		removeNode,
	})
	const parent = createRootNode(root, value)
	const rootNode = component(root, parent)

	root.mountNode(rootNode)
	root.flushRefreshQueue()

	return serializeChildren(value.children)
}

export const isStringNode = value => isNode(value) && isStringValue(value.value)
export const isStringValue = value =>
	typeof value === "object" &&
	value !== null &&
	typeof value.tag === "string" &&
	("namespace" in value &&
		(value.namespace === null ||
			value.namespace === "html" ||
			value.namespace === "svg" ||
			value.namespace === "math")) &&
	typeof value.text === "string" &&
	Array.isArray(value.children) &&
	value.attrs instanceof Map

const createRootNode = (root, value) =>
	markNode({
		key: root.key,
		value,
		props: {},
		props: () => ({ key: root.key }),
		root,
		render: () => root.children,
		lastRenderResult: root.children,
		parent: null,
		children: root.children,
		refresh$: () => {
			const child = root.children[0]

			if (child) root.refreshNode(child)
		},
		lifecycleHandlers: {
			afterMount: [],
			beforeRefresh: [],
			error: [],
			beforeUnmount: [],
			afterUnmount: [],
		},
		mounted: true,
	})

const createContainerValue = () => ({
	tag: "#root",
	namespace: null,
	text: "",
	children: [],
	parent: null,
	attrs: new Map(),
})

const createValue = tag => {
	const resolvedTag = resolveTag(tag)
	const value = {
		tag: resolvedTag.tag,
		namespace: resolvedTag.namespace,
		text: "",
		children: [],
		parent: null,
		attrs: new Map(),
	}
	const dataset = new Proxy(
		{},
		{
			get: (_, prop) =>
				typeof prop === "string"
					? getAttribute(value, `data-${toKebabCase(prop)}`)
					: undefined,
			set: (_, prop, attrValue) => {
				if (typeof prop === "string") {
					setAttribute(value, `data-${toKebabCase(prop)}`, attrValue)
				}

				return true
			},
			deleteProperty: (_, prop) => {
				if (typeof prop === "string") {
					value.attrs.delete(`data-${toKebabCase(prop)}`)
				}

				return true
			},
		},
	)

	return new Proxy(value, {
		get(target, prop) {
			if (prop === "dataset") return dataset
			if (typeof prop !== "string" || prop in target) return target[prop]
			if (prop === "textContent") return ""

			return getAttribute(target, prop)
		},
		set(target, prop, attrValue) {
			if (prop === "dataset") {
				if (attrValue && typeof attrValue === "object") {
					for (const [key, entryValue] of Object.entries(attrValue)) {
						setAttribute(target, `data-${toKebabCase(key)}`, entryValue)
					}
				}

				return true
			}

			if (typeof prop !== "string" || prop in target) {
				target[prop] = attrValue

				return true
			}

			if (prop === "textContent") return true

			setAttribute(target, prop, attrValue)

			return true
		},
		deleteProperty(target, prop) {
			if (typeof prop !== "string" || prop in target) return false

			target.attrs.delete(normalizeAttributeName(prop))

			return true
		},
	})
}

const resolveTag = tag => {
	if (tag === "#text") return { tag, namespace: null }

	if (typeof tag === "string") {
		if (HTML_TAGS.includes(tag)) return { tag, namespace: "html" }
		if (SVG_TAGS.includes(tag)) return { tag, namespace: "svg" }
		if (MATH_TAGS.includes(tag)) return { tag, namespace: "math" }

		return { tag, namespace: "html" }
	}

	return tag
}

const normalizeAttributeName = prop => {
	if (prop === "className") return "class"
	if (prop === "htmlFor") return "for"

	return prop
}

const getAttribute = (value, prop) =>
	value.attrs.get(normalizeAttributeName(prop))

const setAttribute = (value, prop, attrValue) => {
	const name = normalizeAttributeName(prop)

	if (attrValue === false || attrValue == null) {
		value.attrs.delete(name)

		return
	}

	if (typeof attrValue === "function" || typeof attrValue === "symbol") {
		value.attrs.delete(name)

		return
	}

	if (typeof attrValue === "object") {
		value.attrs.delete(name)

		return
	}

	if (attrValue === true) {
		value.attrs.set(name, true)

		return
	}

	value.attrs.set(name, String(attrValue))
}

const refreshNode = node => {
	node.value.text =
		node.lastRenderResult == null ? "" : String(node.lastRenderResult)
}

const insertNode = (parent, node, index) => {
	if (node.value.parent !== parent.value) parent.value.text = ""

	if (node.value.parent) removeValue(node.value)

	const currentIndex = parent.value.children.indexOf(node.value)

	if (currentIndex !== -1) {
		parent.value.children.splice(currentIndex, 1)
	}

	parent.value.children.splice(index, 0, node.value)
	node.value.parent = parent.value
}

const removeNode = node => {
	removeValue(node.value)
}

const removeValue = value => {
	if (!value.parent) return

	value.parent.children = value.parent.children.filter(child => child !== value)
	value.parent = null
}

const serializeChildren = children => children.map(serializeValue).join("")

const serializeValue = value => {
	if (value.tag === "#text") return escapeText(value.text)

	const attributes = serializeAttributes(value.attrs)

	if (value.namespace === "html" && VOID_HTML_TAGS.has(value.tag)) {
		return `<${value.tag}${attributes}>`
	}

	return `<${value.tag}${attributes}>${escapeText(value.text)}${serializeChildren(
		value.children,
	)}</${value.tag}>`
}

const serializeAttributes = attrs =>
	[...attrs.entries()]
		.map(([name, attrValue]) =>
			attrValue === true
				? ` ${name}`
				: ` ${name}="${escapeAttribute(attrValue)}"`,
		)
		.join("")

const escapeText = value =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")

const escapeAttribute = value =>
	escapeText(value)
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")

const toKebabCase = value =>
	value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
