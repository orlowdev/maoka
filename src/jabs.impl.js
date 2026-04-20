/** @import { Maoka } from "../maoka" */

import * as domJabs from "../dom/src/maoka-dom.jabs.js"
import * as stringJabs from "../string/src/maoka-string.jabs.js"
import * as testJabs from "../test/src/maoka-test.jabs.js"

/**
 * Prevents a component from refreshing when its state changes.
 *
 * @type {Maoka.Jab<void, any>}
 */
export const noRefresh = ({ lifecycle }) => {
	lifecycle.beforeRefresh(() => false)
}

/**
 * Uses a custom comparison function to determine whether a component should
 * refresh when its props changes.
 *
 * @type {<$Props extends Maoka.BaseProps = Maoka.NoProps>(compare: (prevProps: $Props, nextProps: $Props) => boolean) => Maoka.Jab<void, $Props>}
 */
export const shouldComponentRefresh =
	compare =>
	({ lifecycle, props }) => {
		let prevProps = props()

		lifecycle.beforeRefresh(() => {
			const nextProps = props()
			const shouldRefresh = compare(prevProps, nextProps)

			prevProps = nextProps

			return shouldRefresh
		})
	}

/**
 * Handles descendant errors that were not handled by the component that failed.
 *
 * @type {(handler: (error: Error) => void) => Maoka.Jab<void, any>}
 */
export const errorBoundary =
	handler =>
	({ lifecycle }) => {
		lifecycle.onError((_, descendantError) => {
			if (!descendantError) return

			handler(descendantError.error)
			descendantError.handle()
		})
	}

/**
 * @type {Maoka.Jab.Attributes}
 */
export const attributes = {
	get:
		name =>
		({ use }) => {
			const domValue = use(domJabs.attributes.get(name))
			const stringValue = use(stringJabs.attributes.get(name))
			const testValue = use(testJabs.attributes.get(name))

			return domValue ?? stringValue ?? testValue
		},
	set:
		(name, value = "") =>
		({ use }) => {
			use(domJabs.attributes.set(name, value))
			use(stringJabs.attributes.set(name, value))
			use(testJabs.attributes.set(name, value))
		},
	assign:
		(name, getValue) =>
		({ use }) => {
			use(domJabs.attributes.assign(name, getValue))
			use(stringJabs.attributes.assign(name, getValue))
			use(testJabs.attributes.assign(name, getValue))
		},
}

export const classes = {
	set:
		(...classNames) =>
		({ use }) => {
			use(domJabs.classes.set(...classNames))
			use(stringJabs.classes.set(...classNames))
			use(testJabs.classes.set(...classNames))
		},
	add:
		(...classNames) =>
		({ use }) => {
			use(domJabs.classes.add(...classNames))
			use(stringJabs.classes.add(...classNames))
			use(testJabs.classes.add(...classNames))
		},
	remove:
		(...classNames) =>
		({ use }) => {
			use(domJabs.classes.remove(...classNames))
			use(stringJabs.classes.remove(...classNames))
			use(testJabs.classes.remove(...classNames))
		},
	has:
		className =>
		({ use }) => {
			const domValue = use(domJabs.classes.has(className))
			const stringValue = use(stringJabs.classes.has(className))
			const testValue = use(testJabs.classes.has(className))

			return domValue ?? stringValue ?? testValue
		},
	toggle:
		(getEnabled, className) =>
		({ use }) => {
			use(domJabs.classes.toggle(getEnabled, className))
			use(stringJabs.classes.toggle(getEnabled, className))
			use(testJabs.classes.toggle(getEnabled, className))
		},
	assign:
		getClassName =>
		({ use }) => {
			use(domJabs.classes.assign(getClassName))
			use(stringJabs.classes.assign(getClassName))
			use(testJabs.classes.assign(getClassName))
		},
}

export const dataAttributes = {
	get:
		name =>
		({ use }) => {
			const domValue = use(domJabs.dataAttributes.get(name))
			const stringValue = use(stringJabs.dataAttributes.get(name))
			const testValue = use(testJabs.dataAttributes.get(name))

			return domValue ?? stringValue ?? testValue
		},
	set:
		(name, value = "") =>
		({ use }) => {
			use(domJabs.dataAttributes.set(name, value))
			use(stringJabs.dataAttributes.set(name, value))
			use(testJabs.dataAttributes.set(name, value))
		},
	assign:
		(name, getValue) =>
		({ use }) => {
			use(domJabs.dataAttributes.assign(name, getValue))
			use(stringJabs.dataAttributes.assign(name, getValue))
			use(testJabs.dataAttributes.assign(name, getValue))
		},
}

export const aria = {
	get:
		name =>
		({ use }) => {
			const domValue = use(domJabs.aria.get(name))
			const stringValue = use(stringJabs.aria.get(name))
			const testValue = use(testJabs.aria.get(name))

			return domValue ?? stringValue ?? testValue
		},
	set:
		(name, value = "") =>
		({ use }) => {
			use(domJabs.aria.set(name, value))
			use(stringJabs.aria.set(name, value))
			use(testJabs.aria.set(name, value))
		},
	assign:
		(name, getValue) =>
		({ use }) => {
			use(domJabs.aria.assign(name, getValue))
			use(stringJabs.aria.assign(name, getValue))
			use(testJabs.aria.assign(name, getValue))
		},
}

export const setId =
	id =>
	({ use }) => {
		use(domJabs.setId(id))
		use(stringJabs.setId(id))
		use(testJabs.setId(id))
	}

export const assignId =
	getId =>
	({ use }) => {
		use(domJabs.assignId(getId))
		use(stringJabs.assignId(getId))
		use(testJabs.assignId(getId))
	}
