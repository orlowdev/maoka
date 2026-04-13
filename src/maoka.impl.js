import { HTML_TAGS, MATH_TAGS, SVG_TAGS } from "./maoka.constants.js"

const COMPONENT_META = Symbol("maoka.component")
const NODE_META = Symbol("maoka.node")

/**
 * Creates a Maoka node.
 *
 * @type {Maoka.Create}
 */
export const create = definition => props =>
	createComponent(props, (root, parent) =>
		createBase(root, props, parent, definition, parent.value),
	)

/**
 * Creates a pure Maoka component. This component is pure in a sense that it
 * does not directly affect the parent value since it is incapulated in its
 * own renderer value entity.
 *
 * @type {Maoka.Pure}
 */
export const pure = (tag, definition) => props =>
	createComponent(props, (root, parent) =>
		createBase(root, props, parent, definition, root.createValue(tag)),
	)

export const isComponent = value =>
	typeof value === "function" && Boolean(value[COMPONENT_META])

export const getComponentKey = component => {
	const props = component[COMPONENT_META]?.props

	if (!props) return undefined

	return props()?.key
}

export const updateNodeComponent = (node, component) => {
	node[NODE_META]?.updateProps(component[COMPONENT_META]?.props)
}

export const html = HTML_TAGS.reduce((acc, tag) => {
	acc[tag] = definition => pure(createTag("html", tag), definition)

	return acc
}, {})

export const math = MATH_TAGS.reduce((acc, tag) => {
	acc[tag] = definition => pure(createTag("math", tag), definition)

	return acc
}, {})

export const svg = SVG_TAGS.reduce((acc, tag) => {
	acc[tag] = definition => pure(createTag("svg", tag), definition)

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
	let propsSource = props

	// TODO: implement props change detection logic
	const props$ = () => {
		if (!propsSource) return { key }

		const extractedProps = propsSource() ?? {}

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
		[NODE_META]: {
			updateProps: nextProps => {
				propsSource = nextProps
			},
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

const createComponent = (props, component) => {
	component[COMPONENT_META] = { props }

	return component
}

const createTag = (namespace, tag) => ({ namespace, tag })
