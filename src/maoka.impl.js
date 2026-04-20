import { HTML_TAGS, MATH_TAGS, SVG_TAGS } from "./maoka.constants.js"

export * as jabs from "./jabs.impl.js"

/**
 * Creates a Maoka node.
 *
 * @type {Maoka.Create}
 */
export const create = definition => {
	const type = {}

	const blueprint = (propsOrMetadata, metadata) => {
		const normalizedArgs = normalizeBlueprintArgs(propsOrMetadata, metadata)

		return createComponent(
			normalizedArgs.props,
			normalizedArgs.metadata,
			type,
			(root, parent, beforeCreateHandlers) =>
			createBase(
				root,
				normalizedArgs.props,
				normalizedArgs.metadata,
				parent,
				definition,
				parent.value,
				type,
				beforeCreateHandlers,
			),
		)
	}

	blueprint[BLUEPRINT_META] = true

	return blueprint
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

	const blueprint = (propsOrMetadata, metadata) => {
		const normalizedArgs = normalizeBlueprintArgs(propsOrMetadata, metadata)

		return createComponent(
			normalizedArgs.props,
			normalizedArgs.metadata,
			type,
			(root, parent, beforeCreateHandlers) =>
			createBase(
				root,
				normalizedArgs.props,
				normalizedArgs.metadata,
				parent,
				definition,
				root.createValue(tag),
				type,
				beforeCreateHandlers,
			),
		)
	}

	blueprint[BLUEPRINT_META] = true

	return blueprint
}

export const isComponent = value =>
	typeof value === "function" && Boolean(value[COMPONENT_META])

export const isBlueprint = value =>
	typeof value === "function" && Boolean(value[BLUEPRINT_META])

export const isNode = value => isRecord(value) && Boolean(value[NODE_META])

export const getComponentKey = component => {
	const metadata = component[COMPONENT_META]?.metadata

	return metadata?.key
}

export const getComponentType = component => component[COMPONENT_META]?.type

export const getNodeComponentType = node => node.componentType

export const updateNodeComponent = (node, component) => {
	node.updateProps(component[COMPONENT_META]?.props)
	node.updateMetadata?.(component[COMPONENT_META]?.metadata)
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
const BLUEPRINT_META = Symbol("maoka.blueprint")
const NODE_META = Symbol("maoka.node")

/**
 * Internal function to create a Maoka node.
 *
 * @type {<$Type = any>(root: Maoka.Root, props: Maoka.Props, metadata: Maoka.ComponentMetadata | undefined, parent: Maoka.Node, definition: Maoka.ComponentDefinition, value: $Type) => Maoka.Node}
 */
const createBase = (
	root,
	initialProps,
	initialMetadata,
	parent,
	definition,
	value,
	type,
	beforeCreateHandlers,
) => {
	const NO_RENDER_PHASE = () => undefined
	const intrinsicKey = root.createKey()
	let key = intrinsicKey
	let initialized = false
	let propsSource = initialProps
	let metadataSource = initialMetadata

	const syncMetadata = () => {
		const metadata = normalizeMetadata(metadataSource)

		key = metadata?.key ?? intrinsicKey
		node.key = key

		return metadata
	}

	const syncProps = () => {
		syncMetadata()

		if (!propsSource) {
			node.propsChanged = initialized
				? havePropsChanged(node.propsData, {})
				: false
			node.propsData = {}
			initialized = true

			return {}
		}

		const extractedProps = propsSource() ?? {}
		const previousProps = node.propsData

		node.propsChanged = initialized
			? havePropsChanged(previousProps, extractedProps)
			: false
		node.propsData = extractedProps

		initialized = true

		return extractedProps
	}

	const props = () => syncProps()

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
		disposed: false,
		failed: false,
		updateProps: nextProps => {
			propsSource = nextProps
		},
		updateMetadata: nextMetadata => {
			metadataSource = nextMetadata
			syncMetadata()
		},
	}
	markNode(node)

	const params = {
		use: jab => jab(params),
		props,
		value,
		refresh$: () => root.refreshNode(node),
		get key() {
			syncMetadata()

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
		syncMetadata()
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
		node.failed = true
		node.disposed = true
	}

	if (!node.failed) {
		parent.children.push(node)
	}

	return node
}

const createComponent = (props, metadata, type, instantiate) => {
	const beforeCreateHandlers = []
	const component = (root, parent) =>
		instantiate(root, parent, beforeCreateHandlers)

	component.beforeCreate = handler => {
		beforeCreateHandlers.push(handler)

		return component
	}

	component[COMPONENT_META] = { props, metadata, type }

	return component
}

const createTag = (namespace, tag) => ({ namespace, tag })

const havePropsChanged = (previousProps = {}, nextProps = {}) =>
	Object.keys(nextProps).some(
		propKey => nextProps[propKey] !== previousProps?.[propKey],
	) || Object.keys(previousProps ?? {}).some(propKey => !(propKey in nextProps))

const isRecord = value => typeof value === "object" && value !== null
const isMetadata = value => isRecord(value) && !Array.isArray(value)

const normalizeMetadata = metadata => {
	if (!isMetadata(metadata)) return undefined

	return metadata
}

const normalizeBlueprintArgs = (propsOrMetadata, metadata) => {
	if (typeof propsOrMetadata === "function") {
		return {
			props: propsOrMetadata,
			metadata: normalizeMetadata(metadata),
		}
	}

	return {
		props: undefined,
		metadata: normalizeMetadata(
			propsOrMetadata === undefined ? metadata : propsOrMetadata,
		),
	}
}

export const markNode = node => {
	node[NODE_META] = true

	return node
}
