/** @import { MaokaTest } from "../maoka-test.d.ts" */

/** @type {MaokaTest.IfInTest} */
export const ifInTest = callback => params => {
	if (isTestValue(params.value)) {
		return callback(params)
	}
}

export const attributes = {
	/** @type {MaokaTest.AttributeGet} */
	get: name =>
		ifInTest(({ value }) => getAttribute(value, name)),

	/** @type {MaokaTest.AttributeSet} */
	set: (name, attributeValue = "") =>
		ifInTest(({ value }) => {
			applyAttributeValue(value, name, String(attributeValue))
		}),

	/** @type {MaokaTest.AttributeAssign} */
	assign: (name, getValue) =>
		ifInTest(({ value, lifecycle }) => {
			let assignedValue = normalizeAttributeValue(getValue())

			applyAttributeValue(value, name, assignedValue)

			lifecycle.beforeRefresh(() => {
				const nextValue = normalizeAttributeValue(getValue())

				if (nextValue !== assignedValue) {
					applyAttributeValue(value, name, nextValue)
					assignedValue = nextValue
				}

				return false
			})
		}),
}

export const classes = {
	/** @type {MaokaTest.ClassesSet} */
	set: (...classesToSet) =>
		ifInTest(({ value }) => {
			applyClassName(value, normalizeClassTokens(classesToSet).join(" "))
		}),

	/** @type {MaokaTest.ClassesAdd} */
	add: (...classesToAdd) =>
		ifInTest(({ value }) => {
			const nextClasses = new Set(getClassTokens(value))

			for (const className of normalizeClassTokens(classesToAdd)) {
				nextClasses.add(className)
			}

			applyClassTokens(value, nextClasses)
		}),

	/** @type {MaokaTest.ClassesRemove} */
	remove: (...classesToRemove) =>
		ifInTest(({ value }) => {
			const nextClasses = new Set(getClassTokens(value))

			for (const className of normalizeClassTokens(classesToRemove)) {
				nextClasses.delete(className)
			}

			applyClassTokens(value, nextClasses)
		}),

	/** @type {MaokaTest.ClassesHas} */
	has: className =>
		ifInTest(({ value }) => {
			validateClassToken(className)

			return getClassTokens(value).includes(className)
		}),

	/** @type {MaokaTest.ClassesToggle} */
	toggle: (getEnabled, className) => {
		validateClassToken(className)

		return classes.assign(() => (getEnabled() ? className : ""))
	},

	/** @type {MaokaTest.ClassesAssign} */
	assign: getClassName =>
		ifInTest(({ value, lifecycle }) => {
			let assignedClassName = normalizeAssignedClassName(getClassName())

			applyClassName(value, assignedClassName)

			lifecycle.beforeRefresh(() => {
				const nextClassName = normalizeAssignedClassName(getClassName())

				if (nextClassName !== assignedClassName) {
					applyClassName(value, nextClassName)
					assignedClassName = nextClassName
				}

				return false
			})
		}),
}

export const dataAttributes = {
	/** @type {MaokaTest.AttributeGet} */
	get: name => attributes.get(`data-${name}`),

	/** @type {MaokaTest.AttributeSet} */
	set: (name, value = "") => attributes.set(`data-${name}`, value),

	/** @type {MaokaTest.AttributeAssign} */
	assign: (name, getValue) => attributes.assign(`data-${name}`, getValue),
}

export const aria = {
	/** @type {MaokaTest.AttributeGet} */
	get: name => attributes.get(`aria-${name}`),

	/** @type {MaokaTest.AttributeSet} */
	set: (name, value = "") => attributes.set(`aria-${name}`, value),

	/** @type {MaokaTest.AttributeAssign} */
	assign: (name, getValue) => attributes.assign(`aria-${name}`, getValue),
}

/** @type {MaokaTest.SetId} */
export const setId = id => attributes.set("id", id)

/** @type {MaokaTest.AssignId} */
export const assignId = getId => attributes.assign("id", getId)

export const isTestValue = value =>
	typeof value === "object" &&
	value !== null &&
	typeof value.tag === "string" &&
	typeof value.text === "string" &&
	Array.isArray(value.children) &&
	("parent" in value || value.parent === null)

const getAttribute = (value, name) => {
	const attributeValue = getAttrs(value).get(name)

	if (attributeValue === true) return ""

	return attributeValue
}

const getClassTokens = value => {
	const className = getAttribute(value, "class") ?? ""

	return className.split(/\s+/).filter(Boolean)
}

const getAttrs = value => {
	if (!(value.attrs instanceof Map)) {
		value.attrs = new Map()
	}

	return value.attrs
}

const applyClassTokens = (value, classTokens) => {
	applyClassName(value, [...classTokens].join(" "))
}

const applyClassName = (value, className) => {
	const attrs = getAttrs(value)

	if (!className) {
		attrs.delete("class")

		return
	}

	attrs.set("class", className)
}

const normalizeClassTokens = classesToNormalize => {
	const tokens = [...classesToNormalize].map(String)

	for (const token of tokens) {
		validateClassToken(token)
	}

	return tokens
}

const normalizeAttributeValue = value =>
	value == null ? undefined : String(value)

const normalizeAssignedClassName = value =>
	value == null || value === "" ? undefined : String(value)

const applyAttributeValue = (value, name, attributeValue) => {
	const attrs = getAttrs(value)

	if (attributeValue === undefined) {
		attrs.delete(name)

		return
	}

	attrs.set(name, attributeValue)
}

const validateClassToken = token => {
	if (token.length === 0) {
		throw new TypeError("Class name must not be empty")
	}

	if (/\s/.test(token)) {
		throw new TypeError("Class name must not contain whitespace")
	}
}
