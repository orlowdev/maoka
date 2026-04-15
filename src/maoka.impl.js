import { HTML_TAGS, MATH_TAGS, SVG_TAGS } from "./maoka.constants.js"

export * as jabs from "./jabs.impl.js"

/**
 * Creates a Maoka node.
 *
 * @type {Maoka.Create}
 */
export const create = definition => {
	const type = {}

	return props =>
		createComponent(props, type, (root, parent, beforeCreateHandlers) =>
			createBase(
				root,
				props,
				parent,
				definition,
				parent.value,
				type,
				beforeCreateHandlers,
			),
		)
}

/**
 * Creates a pure Maoka component. This component is pure in a sense that it
 * does not directly affect the parent value since it is incapulated in its
 * own renderer value entity.
 *
 * @type {Maoka.Pure}
 */
export const pure = (tag, definition) => {
	const type = { tag }

	return props =>
		createComponent(props, type, (root, parent, beforeCreateHandlers) =>
			createBase(
				root,
				props,
				parent,
				definition,
				root.createValue(tag),
				type,
				beforeCreateHandlers,
			),
		)
}

export const isComponent = value =>
	typeof value === "function" && Boolean(value[COMPONENT_META])

export const getComponentKey = component => {
	const props = component[COMPONENT_META]?.props

	if (!props) return undefined

	return props()?.key
}

export const getComponentType = component => component[COMPONENT_META]?.type

export const getNodeComponentType = node => node.componentType

export const updateNodeComponent = (node, component) => {
	node.updateProps(component[COMPONENT_META]?.props)
}

/**
 * @param {Maoka.Node} node
 * @param {unknown} error
 * @param {Maoka.DescendantError} [descendantError]
 */
export const handleNodeError = (node, error, descendantError) => {
	if (!descendantError && node.lifecycleHandlers.error.length > 0) {
		node.lifecycleHandlers.error.forEach(handler => handler(error))

		return
	}

	if (node.parent) {
		const bubbledError = descendantError ?? createDescendantError(error)

		for (const handler of node.parent.lifecycleHandlers.error) {
			handler(undefined, bubbledError)

			if (bubbledError.handled) return
		}

		handleNodeError(node.parent, error, bubbledError)

		return
	}

	throw error
}

const createDescendantError = error => {
	const descendantError = {
		error,
		handled: false,
		handle: () => {
			descendantError.handled = true
		},
	}

	return descendantError
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

const COMPONENT_META = Symbol("maoka.component")

/**
 * Internal function to create a Maoka node.
 *
 * @type {<$Type = any>(root: Maoka.Root, props: Maoka.Props, parent: Maoka.Node, definition: Maoka.ComponentDefinition, value: $Type) => Maoka.Node}
 */
const createBase = (
	root,
	initialProps,
	parent,
	definition,
	value,
	type,
	beforeCreateHandlers,
) => {
	const NO_RENDER_PHASE = () => undefined
	let key = root.createKey()
	let initialized = false
	let propsSource = initialProps

	const syncProps = () => {
		if (!propsSource) return { key }

		const extractedProps = propsSource() ?? {}
		const previousProps = node.propsData

		if ("key" in extractedProps) {
			key = extractedProps.key
			node.key = key
		}

		node.propsChanged = initialized
			? havePropsChanged(previousProps, extractedProps)
			: false
		node.propsData = extractedProps

		initialized = true

		return extractedProps
	}

	const props = () => {
		const extractedProps = syncProps()

		return { ...extractedProps, key }
	}

	/** @type {Maoka.Node} */
	const node = {
		key,
		value,
		render: NO_RENDER_PHASE,
		hasRenderPhase: false,
		lastRenderResult: null,
		root,
		parent,
		children: [],
		propsData: {},
		syncProps,
		props,
		propsChanged: false,
		refresh$: () => root.refreshNode(node),
		lifecycleHandlers: {
			afterMount: [],
			beforeRefresh: [],
			error: [],
			beforeUnmount: [],
			afterUnmount: [],
		},
		mounted: false,
		componentType: type,
		updateProps: nextProps => {
			propsSource = nextProps
		},
	}

	const params = {
		use: jab => jab(params),
		props,
		value,
		refresh$: () => root.refreshNode(node),
		get key() {
			return key
		},
		rootKey: root.key,
		parentKey: parent.key,
		lifecycle: {
			afterMount: handler =>
				void node.lifecycleHandlers.afterMount.push(handler),
			beforeRefresh: handler =>
				void node.lifecycleHandlers.beforeRefresh.push(handler),
			onError: handler => void node.lifecycleHandlers.error.push(handler),
			beforeUnmount: handler =>
				void node.lifecycleHandlers.beforeUnmount.push(handler),
			afterUnmount: handler =>
				void node.lifecycleHandlers.afterUnmount.push(handler),
		},
	}

	try {
		props()
		beforeCreateHandlers.forEach(handler => handler(params))
		const render = definition(params)

		if (typeof render === "function") {
			node.render = render
			node.hasRenderPhase = true
			node.lastRenderResult = node.render()
		} else {
			node.lastRenderResult = undefined
		}
	} catch (error) {
		handleNodeError(node, error)
	}

	parent.children.push(node)

	return node
}

const createComponent = (props, type, instantiate) => {
	const beforeCreateHandlers = []
	const component = (root, parent) =>
		instantiate(root, parent, beforeCreateHandlers)

	component.beforeCreate = handler => {
		beforeCreateHandlers.push(handler)

		return component
	}

	component[COMPONENT_META] = { props, type }

	return component
}

const createTag = (namespace, tag) => ({ namespace, tag })

const havePropsChanged = (previousProps = {}, nextProps = {}) =>
	Object.keys(nextProps).some(
		propKey => nextProps[propKey] !== previousProps?.[propKey],
	) || Object.keys(previousProps ?? {}).some(propKey => !(propKey in nextProps))
