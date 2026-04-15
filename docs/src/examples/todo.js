import maoka from "../../../index.js"

const TodoPreviewShell = maoka.html.section(({ props, value }) => {
	value.className = "todo-preview"

	return () => props().children
})

export const TodoTitle = maoka.html.h3(({ props }) => {
	return () => props().children
})

export const TodoStats = maoka.html.p(({ props, value }) => {
	return () => {
		const p = props()

		value.className = "todo-preview-stats"

		return `Done: ${p.done} / ${p.total}`
	}
})

export const TodoInput = maoka.html.input(({ props, value }) => {
	return () => {
		const p = props()

		value.placeholder = "What needs doing?"
		value.value = p.value
		value.oninput = event => p.onInput(event.currentTarget.value)

		return null
	}
})

export const AddTodoButton = maoka.html.button(({ value }) => {
	return () => {
		value.type = "submit"

		return "Add todo"
	}
})

export const TodoForm = maoka.html.form(({ props, value }) => {
	return () => {
		const p = props()

		value.className = "todo-preview-form"
		value.onsubmit = event => {
			event.preventDefault()
			p.onSubmit()
		}

		return [
			TodoInput(() => ({
				key: "input",
				value: p.value,
				onInput: p.onInput,
			})),
			AddTodoButton(() => ({ key: "add-button" })),
		]
	}
})

export const NewTodoForm = maoka.create(({ props, refresh$ }) => {
	let draft = ""
	const onInput = value => {
		draft = value
		refresh$()
	}

	const onSubmit = () => {
		const label = draft.trim()

		if (!label) return

		props().onAdd(label)
		draft = ""
		refresh$()
	}

	return () =>
		TodoForm(() => ({
			value: draft,
			onInput,
			onSubmit,
		}))
})

export const TodoCheckbox = maoka.html.input(({ props, value }) => {
	return () => {
		const p = props()

		value.type = "checkbox"
		value.checked = p.todo.done
		value.onchange = () => p.onToggle(p.todo.id)

		return null
	}
})

export const TodoLabel = maoka.html.span(({ props, value }) => {
	return () => {
		const p = props()

		value.className = p.done ? "is-done" : ""

		return p.children
	}
})

const TodoToggle = maoka.html.label(({ props, value }) => {
	return () => {
		const p = props()

		value.className = "todo-preview-toggle"

		return [
			TodoCheckbox(() => ({
				key: "checkbox",
				todo: p.todo,
				onToggle: p.onToggle,
			})),
			TodoLabel(() => ({
				key: "label",
				children: p.todo.label,
				done: p.todo.done,
			})),
		]
	}
})

export const RemoveTodoButton = maoka.html.button(({ props, value }) => {
	return () => {
		const p = props()

		value.type = "button"
		value.className = "todo-preview-remove"
		value.onclick = () => p.onRemove(p.todo.id)

		return "Remove"
	}
})

export const PlainTodoItem = maoka.html.li(({ props, value }) => {
	return () => {
		const p = props()

		value.className = "todo-preview-item"

		return [
			TodoToggle(() => ({
				key: "toggle",
				todo: p.todo,
				onToggle: p.onToggle,
			})),
			RemoveTodoButton(() => ({
				key: "remove",
				todo: p.todo,
				onRemove: p.onRemove,
			})),
		]
	}
})

export const TodoItem = maoka.html.li(({ props, value }) => {
	return () => {
		const p = props()

		value.className = "todo-preview-item"

		return [
			TodoToggle(() => ({
				key: "toggle",
				todo: p.todo,
				onToggle: p.onToggle,
			})),
			RemoveTodoButton(() => ({
				key: "remove",
				todo: p.todo,
				onRemove: p.onRemove,
			})),
		]
	}
})

export const TodoList = maoka.html.ul(({ props, value }) => {
	return () => {
		const p = props()

		value.className = "todo-preview-list"

		return p.items.map(todo =>
			p.itemComponent(() => ({
				key: todo.id,
				todo,
				onToggle: p.onToggle,
				onRemove: p.onRemove,
			})),
		)
	}
})

export const todoState$ = ({ refresh$ }) => {
	let nextId = 3
	let items = [
		{ id: 1, label: "Install maoka", done: true },
		{ id: 2, label: "Build a todo app", done: false },
	]

	return {
		get items() {
			return items
		},
		addTodo(label) {
			items = [...items, { id: nextId++, label, done: false }]
			refresh$()
		},
		toggleTodo(id) {
			items = items.map(todo =>
				todo.id === id ? { ...todo, done: !todo.done } : todo,
			)
			refresh$()
		},
		removeTodo(id) {
			items = items.filter(todo => todo.id !== id)
			refresh$()
		},
	}
}

export const TodoApp = maoka.create(({ use }) => {
	const todos = use(todoState$)

	return () => [
		TodoPreviewShell(() => ({
			children: [
				TodoTitle(() => ({ children: "Maoka todos" })),
				NewTodoForm(() => ({ onAdd: todos.addTodo })),
				TodoStats(() => ({
					total: todos.items.length,
					done: todos.items.filter(todo => todo.done).length,
				})),
				TodoList(() => ({
					items: todos.items,
					itemComponent: TodoItem,
					onToggle: todos.toggleTodo,
					onRemove: todos.removeTodo,
				})),
			],
		})),
	]
})
