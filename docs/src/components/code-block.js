import maoka from "../../../index.js"
import "./code-block.css"

const keywords = new Set([
	"as",
	"const",
	"export",
	"from",
	"function",
	"get",
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

export const CodeBlock = maoka.html.section(({ props$, refresh$, value }) => {
	let language = props$().js ? "js" : "ts"

	value.className = "code-block"

	const select = nextLanguage => {
		language = nextLanguage
		refresh$()
	}

	return () => {
		const props = props$()
		const code = normalizeCode(language === "js" ? props.js : props.ts)

		return [
			LanguageTabs(() => ({ language, props, select })),
			CodePanel(() => ({ code, language })),
		]
	}
})

const LanguageTabs = maoka.html.div(({ props$, value }) => {
	value.className = "code-tabs"

	return () => [
		props$().props.js
			? LanguageTab(() => ({
					active: props$().language === "js",
					language: "js",
					label: "JS",
					select: props$().select,
				}))
			: null,
		props$().props.ts
			? LanguageTab(() => ({
					active: props$().language === "ts",
					language: "ts",
					label: "TS",
					select: props$().select,
				}))
			: null,
	]
})

const LanguageTab = maoka.html.button(({ props$, value }) => {
	value.type = "button"
	value.onclick = () => props$().select(props$().language)

	return () => {
		value.className = [
			"code-tab",
			`is-${props$().language}`,
			props$().active ? "is-active" : "",
		]
			.filter(Boolean)
			.join(" ")

		return props$().label
	}
})

const CodePanel = maoka.html.div(({ props$, value }) => {
	return () => {
		value.className = `code-panel is-${props$().language}`

		return [
			Pre(() => ({ code: props$().code })),
		]
	}
})

const Pre = maoka.html.pre(({ props$ }) => {
	return () => Code(() => ({ code: props$().code }))
})

const Code = maoka.html.code(({ props$ }) => {
	return () =>
		tokenize(props$().code).map((token, index) =>
			Token(() => ({ key: index, token })),
		)
})

const Token = maoka.html.span(({ props$, value }) => {
	return () => {
		const { token } = props$()

		value.className = token.className

		return token.value
	}
})

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

			push(tokens, value, getIdentifierClass(code, end, value))
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

const getIdentifierClass = (code, end, value) => {
	if (includesMaoka(value)) return "syntax-maoka"
	if (keywords.has(value)) return "syntax-keyword"
	if (booleans.has(value)) return "syntax-boolean"
	if (isFunctionIdentifier(code, end, value)) return "syntax-function"

	return ""
}

const isFunctionIdentifier = (code, end, value) => {
	if (keywords.has(value)) return false

	let cursor = end

	while (/\s/.test(code[cursor])) cursor++

	return code[cursor] === "("
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
