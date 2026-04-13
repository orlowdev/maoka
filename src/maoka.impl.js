import { HTML_TAGS, MATH_TAGS, SVG_TAGS } from "./maoka.constants.js"

/**
 * Creates a Maoka node.
 *
 * @type {Maoka.Create}
 */
export const create = definition => props => (root, parent) =>
	createBase(root, props, parent, definition, parent.value)

/**
 * Creates a pure Maoka component. This component is pure in a sense that it
 * does not directly affect the parent value since it is incapulated in its
 * own renderer value entity.
 *
 * @type {Maoka.Pure}
 */
export const pure = (tag, definition) => props => (root, parent) =>
	createBase(root, props, parent, definition, root.createValue(tag))

export const html = HTML_TAGS.reduce((acc, tag) => {
	acc[tag] = definition => pure(tag, definition)

	return acc
}, {})

export const math = MATH_TAGS.reduce((acc, tag) => {
	acc[tag] = definition => pure(tag, definition)

	return acc
}, {})

export const svg = SVG_TAGS.reduce((acc, tag) => {
	acc[tag] = definition => pure(tag, definition)

	return acc
}, {})

// --- Internal ---

/**
 * Internal function to create a Maoka node.
 *
 * @type {<$Type = any>(root: Maoka.Root, props: Maoka.Props, parent: Maoka.Node, definition: Maoka.ComponentDefinition, value: $Type) => Maoka.Node}
 */
const createBase = (root, props, parent, definition, value) => {
	let key = root.createKey()
	let initialized = false

	// TODO: implement props change detection logic
	const props$ = () => {
		if (!props) return { key }

		const extractedProps = props() ?? {}

		if ("key" in extractedProps) {
			key = extractedProps.key
			node.key = key
		}

		if (initialized) {
			const hasChanged =
				Object.keys(extractedProps).some(
					propKey => extractedProps[propKey] !== node.props?.[propKey],
				) ||
				Object.keys(node.props ?? {}).some(
					propKey => !(propKey in extractedProps),
				)

			if (hasChanged) {
				node.props = extractedProps
				node.refresh$()
			}
		} else {
			node.props = extractedProps
		}

		initialized = true

		return { ...extractedProps, key }
	}

	/** @type {Maoka.Node} */
	const node = {
		key,
		value,
		render: () => undefined,
		template: null,
		root,
		parent,
		children: [],
		props$,
		refresh$: () => root.refreshNode(node),
		lifecycleHandlers: {
			refresh: [],
			error: [],
		},
	}

	const params = {
		use: jab => jab(params),
		props$,
		value,
		refresh$: () => root.refreshNode(node),
		get key() {
			return key
		},
		rootKey: root.key,
		parentKey: parent.key,
		lifecycle: {
			onRefresh: handler => void node.lifecycleHandlers.refresh.push(handler),
			onError: handler => void node.lifecycleHandlers.error.push(handler),
		},
	}

	try {
		node.render = definition(params)
		node.template = node.render()
	} catch (error) {
		node.lifecycleHandlers.error.forEach(handler => handler(error))
	}

	parent.children.push(node)

	return node
}
