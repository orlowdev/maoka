/** @import { MaokaString } from "../maoka-string.d.ts" */

/** @type {MaokaString.IfInString} */
export const ifInString = callback => params => {
	if (isStringValue(params.value)) {
		return callback(params)
	}
}

export const attributes = {
	/** @type {MaokaString.AttributeGet} */
	get: name =>
		ifInString(({ value }) => getAttribute(value, name)),

	/** @type {MaokaString.AttributeSet} */
	set: (name, attributeValue = "") =>
		ifInString(({ value }) => {
			applyAttributeValue(value, name, String(attributeValue))
		}),

	/** @type {MaokaString.AttributeAssign} */
	assign: (name, getValue) =>
		ifInString(({ value, lifecycle }) => {
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
	/** @type {MaokaString.ClassesSet} */
	set: (...classesToSet) =>
		ifInString(({ value }) => {
			applyClassName(value, normalizeClassTokens(classesToSet).join(" "))
		}),

	/** @type {MaokaString.ClassesAdd} */
	add: (...classesToAdd) =>
		ifInString(({ value }) => {
			const nextClasses = new Set(getClassTokens(value))

			for (const className of normalizeClassTokens(classesToAdd)) {
				nextClasses.add(className)
			}

			applyClassTokens(value, nextClasses)
		}),

	/** @type {MaokaString.ClassesRemove} */
	remove: (...classesToRemove) =>
		ifInString(({ value }) => {
			const nextClasses = new Set(getClassTokens(value))

			for (const className of normalizeClassTokens(classesToRemove)) {
				nextClasses.delete(className)
			}

			applyClassTokens(value, nextClasses)
		}),

	/** @type {MaokaString.ClassesHas} */
	has: className =>
		ifInString(({ value }) => {
			validateClassToken(className)

			return getClassTokens(value).includes(className)
		}),

	/** @type {MaokaString.ClassesToggle} */
	toggle: (getEnabled, className) => {
		validateClassToken(className)

		return classes.assign(() => (getEnabled() ? className : ""))
	},

	/** @type {MaokaString.ClassesAssign} */
	assign: getClassName =>
		ifInString(({ value, lifecycle }) => {
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
	/** @type {MaokaString.AttributeGet} */
	get: name => attributes.get(`data-${name}`),

	/** @type {MaokaString.AttributeSet} */
	set: (name, value = "") => attributes.set(`data-${name}`, value),

	/** @type {MaokaString.AttributeAssign} */
	assign: (name, getValue) => attributes.assign(`data-${name}`, getValue),
}

export const aria = {
	/** @type {MaokaString.AttributeGet} */
	get: name => attributes.get(`aria-${name}`),

	/** @type {MaokaString.AttributeSet} */
	set: (name, value = "") => attributes.set(`aria-${name}`, value),

	/** @type {MaokaString.AttributeAssign} */
	assign: (name, getValue) => attributes.assign(`aria-${name}`, getValue),
}

/** @type {MaokaString.SetId} */
export const setId = id => attributes.set("id", id)

/** @type {MaokaString.AssignId} */
export const assignId = getId => attributes.assign("id", getId)

const isStringValue = value =>
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

const getAttribute = (value, name) => {
	const attributeValue = value.attrs.get(name)

	if (attributeValue === true) return ""

	return attributeValue
}

const getClassTokens = value => {
	const className = getAttribute(value, "class") ?? ""

	return className.split(/\s+/).filter(Boolean)
}

const applyClassTokens = (value, classTokens) => {
	applyClassName(value, [...classTokens].join(" "))
}

const applyClassName = (value, className) => {
	if (!className) {
		value.attrs.delete("class")

		return
	}

	value.attrs.set("class", className)
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
	if (attributeValue === undefined) {
		value.attrs.delete(name)

		return
	}

	value.attrs.set(name, attributeValue)
}

const validateClassToken = token => {
	if (token.length === 0) {
		throw new TypeError("Class name must not be empty")
	}

	if (/\s/.test(token)) {
		throw new TypeError("Class name must not contain whitespace")
	}
}
