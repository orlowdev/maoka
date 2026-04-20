import maoka from "../../../index.js"
import maokaDom from "../../../dom/index.js"
import "./code-block.css"

let selectedLanguage = "js"
const refreshSubscribers = new Set()

const keywords = new Set([
	"as",
	"const",
	"extends",
	"export",
	"from",
	"function",
	"get",
	"interface",
	"import",
	"let",
	"return",
	"type",
])

const booleans = new Set(["false", "true"])
const bracketPairs = {
	"(": ")",
	"[": "]",
	"{": "}",
}
const closingBrackets = new Set(Object.values(bracketPairs))

export const CodeBlock = maoka.html.section(
	({ lifecycle, props, refresh$, use }) => {
		use(maoka.jabs.classes.set("code-block"))

		lifecycle.afterMount(() => {
			refreshSubscribers.add(refresh$)

			return () => {
				refreshSubscribers.delete(refresh$)
			}
		})

		const select = nextLanguage => {
			selectedLanguage = nextLanguage

			for (const refresh of refreshSubscribers) refresh()
		}

		return () => {
			const p = props()
			const language = resolveLanguage(p)
			const code = normalizeCode(language === "js" ? p.js : p.ts)

			return [
				LanguageTabs(() => ({ language, props: p, select })),
				CodePanel(() => ({
					code,
					language,
					noShadow: p.noShadow,
				})),
			]
		}
	},
)

const LanguageTabs = maoka.html.div(({ props, use }) => {
	use(maoka.jabs.classes.set("code-tabs"))

	return () => {
		const p = props()

		return [
			p.props.js
				? LanguageTab(() => ({
						active: p.language === "js",
						language: "js",
						label: "JS",
						select: p.select,
					}))
				: null,
			p.props.ts
				? LanguageTab(() => ({
						active: p.language === "ts",
						language: "ts",
						label: "TS",
						select: p.select,
					}))
				: null,
		]
	}
})

const LanguageTab = maoka.html.button(({ props, use }) => {
	use(maoka.jabs.attributes.set("type", "button"))
	use(
		maoka.jabs.classes.assign(() =>
			["code-tab", `is-${props().language}`, props().active ? "is-active" : ""]
				.filter(Boolean)
				.join(" "),
		),
	)
	use(
		maokaDom.jabs.ifInDOM(({ value, lifecycle }) => {
			const sync = () => {
				value.onclick = () => props().select(props().language)
			}

			sync()
			lifecycle.beforeRefresh(() => {
				sync()

				return false
			})
		}),
	)

	return () => props().label
})

const CodePanel = maoka.html.div(({ props, use }) => {
	use(
		maoka.jabs.classes.assign(() => {
			const p = props()

			return ["code-panel", `is-${p.language}`, p.noShadow ? "is-flat" : ""]
				.filter(Boolean)
				.join(" ")
		}),
	)

	return () => {
		const p = props()

		return [Pre(() => ({ code: p.code }))]
	}
})

const Pre = maoka.html.pre(({ props }) => {
	return () => Code(() => ({ code: props().code }))
})

const Code = maoka.html.code(({ props }) => {
	return () =>
		splitLines(props().code).map((line, index) =>
			CodeLine(() => ({ key: index, line })),
		)
})

const CodeLine = maoka.html.span(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => getLineClassName(props().line)))

	return () => {
		const line = props().line

		return tokenize(line.code).map((token, index) =>
			Token(() => ({ key: index, token })),
		)
	}
})

const Token = maoka.html.span(({ props, use }) => {
	use(maoka.jabs.classes.assign(() => props().token.className))

	return () => props().token.value
})

const resolveLanguage = props => {
	if (selectedLanguage === "ts" && props.ts) return "ts"
	if (selectedLanguage === "js" && props.js) return "js"

	return props.js ? "js" : "ts"
}

const splitLines = code =>
	code.split("\n").map(rawLine => {
		const match = rawLine.match(/^(\s*)([+-])(.*)$/)

		if (!match) return { marker: "", code: rawLine }

		const [, indentation, marker, rest] = match

		return { marker, code: indentation + rest }
	})

const getLineClassName = line =>
	["code-line", line.marker === "+" ? "is-added" : "", line.marker === "-" ? "is-removed" : ""]
		.filter(Boolean)
		.join(" ")

const tokenize = code => {
	const tokens = []
	const bracketStack = []
	let index = 0

	while (index < code.length) {
		const char = code[index]
		const next = code[index + 1]

		if (char === "/" && next === "/") {
			const end = findLineEnd(code, index)

			push(tokens, code.slice(index, end), "syntax-comment")
			index = end
			continue
		}

		if (char === "/" && next === "*") {
			const end = code.indexOf("*/", index + 2)
			const tokenEnd = end === -1 ? code.length : end + 2

			push(tokens, code.slice(index, tokenEnd), "syntax-comment")
			index = tokenEnd
			continue
		}

		if (isQuote(char)) {
			const end = findStringEnd(code, index, char)
			const value = code.slice(index, end)

			push(
				tokens,
				value,
				includesMaoka(value) ? "syntax-string syntax-maoka" : "syntax-string",
			)
			index = end
			continue
		}

		if (isIdentifierStart(char)) {
			const end = findIdentifierEnd(code, index)
			const value = code.slice(index, end)

			push(tokens, value, getIdentifierClass(code, index, end, value))
			index = end
			continue
		}

		if (isNumberStart(char, next)) {
			const end = findNumberEnd(code, index)

			push(tokens, code.slice(index, end), "syntax-number")
			index = end
			continue
		}

		if (bracketPairs[char]) {
			bracketStack.push(char)
			push(tokens, char, getBracketClass(bracketStack.length))
			index++
			continue
		}

		if (closingBrackets.has(char)) {
			push(tokens, char, getBracketClass(bracketStack.length))
			bracketStack.pop()
			index++
			continue
		}

		push(tokens, char, isOperator(char) ? "syntax-operator" : "")
		index++
	}

	return tokens
}

const push = (tokens, value, className) => {
	tokens.push({ value, className })
}

const findLineEnd = (code, index) => {
	const end = code.indexOf("\n", index)

	return end === -1 ? code.length : end
}

const findStringEnd = (code, index, quote) => {
	let cursor = index + 1

	while (cursor < code.length) {
		if (code[cursor] === "\\") {
			cursor += 2
			continue
		}

		if (code[cursor] === quote) return cursor + 1

		cursor++
	}

	return code.length
}

const findIdentifierEnd = (code, index) => {
	let cursor = index + 1

	while (cursor < code.length && isIdentifier(code[cursor])) cursor++

	return cursor
}

const findNumberEnd = (code, index) => {
	let cursor = index + 1

	while (cursor < code.length && /[\d._]/.test(code[cursor])) cursor++

	return cursor
}

const getIdentifierClass = (code, start, end, value) => {
	if (includesMaoka(value)) return "syntax-maoka"
	if (isObjectKey(code, start, end, value)) return "syntax-property"
	if (isTypeIdentifier(code, start, end, value)) return "syntax-type"
	if (keywords.has(value)) return "syntax-keyword"
	if (booleans.has(value)) return "syntax-boolean"
	if (isFunctionIdentifier(code, end, value)) return "syntax-function"

	return ""
}

const isObjectKey = (code, start, end, value) => {
	if (keywords.has(value)) return false

	const previous = findPreviousSignificantChar(code, start)
	const next = findNextSignificantChar(code, end)

	if (previous === ".") return false

	return next === ":"
}

const isTypeIdentifier = (code, start, end, value) => {
	if (keywords.has(value) || booleans.has(value)) return false

	const nextWord = findNextWord(code, end)

	if (value.startsWith("$")) return true
	if (nextWord === "extends") return true

	return false
}

const isFunctionIdentifier = (code, end, value) => {
	if (keywords.has(value)) return false

	let cursor = end

	while (/\s/.test(code[cursor])) cursor++

	return code[cursor] === "("
}

const findPreviousSignificantChar = (code, index) => {
	let cursor = index - 1

	while (cursor >= 0 && /\s/.test(code[cursor])) cursor--

	return cursor >= 0 ? code[cursor] : ""
}

const findNextSignificantChar = (code, index) => {
	let cursor = index

	while (cursor < code.length && /\s/.test(code[cursor])) cursor++

	return cursor < code.length ? code[cursor] : ""
}

const findNextWord = (code, index) => {
	let cursor = index

	while (cursor < code.length && /\s/.test(code[cursor])) cursor++

	if (!isIdentifierStart(code[cursor])) return ""

	const end = findIdentifierEnd(code, cursor)

	return code.slice(cursor, end)
}


const getBracketClass = depth =>
	`syntax-bracket syntax-bracket-${((depth - 1) % 4) + 1}`

const isIdentifierStart = char => /[$_a-zA-Z]/.test(char)

const isIdentifier = char => /[$_\w]/.test(char)

const isNumberStart = (char, next) =>
	/\d/.test(char) || (char === "." && /\d/.test(next))

const isOperator = char => /[=+\-*/%<>!?:.,]/.test(char)

const isQuote = char => char === "'" || char === '"' || char === "`"

const includesMaoka = value => value.toLowerCase().includes("maoka")

const normalizeCode = code => {
	const lines = code.replaceAll("\t", "  ").split("\n")
	const firstLine = lines.findIndex(line => line.trim())
	const lastLine = lines.findLastIndex(line => line.trim())
	const trimmedLines = lines.slice(firstLine, lastLine + 1)
	const indentation = Math.min(
		...trimmedLines
			.filter(line => line.trim())
			.map(line => line.match(/^ */)[0].length),
	)

	return trimmedLines.map(line => line.slice(indentation)).join("\n")
}
