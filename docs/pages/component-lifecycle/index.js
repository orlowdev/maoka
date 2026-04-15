import "./style.css"
import maoka from "../../../index.js"
import { render } from "../../../dom/index.js"
import { CodeBlock } from "../../src/components/code-block.js"
import { DocsNav } from "../../src/components/docs-nav.js"

const lifecycleExample = `const Component = maoka.create(({ lifecycle }) => {
	// Create phase. Runs only once.

	lifecycle.afterMount(() => {
		// afterMount hook. Runs once after the node is inserted.

		// Optional. Registers a beforeUnmount lifecycle hook if provided.
		return () => {
			// Before unmount cleanup. Runs before the node is removed.
		}
	})

	lifecycle.beforeRefresh(() => {
		// beforeRefresh hook. Runs on every refresh.

		// Not returning true means refresh is not needed.
		return true
	})

	lifecycle.beforeUnmount(() => {
		// Before remove node from tree. Unsubscribe here.
	})

	lifecycle.afterUnmount(() => {
		// After remove node from tree.
	})

	lifecycle.onError((error, descendantError) => {
		// Own errors arrive as error.
		// Descendant errors arrive as descendantError containers.
	})

	return () => {
		// Render phase. Runs on creation and on every refresh
		// that was not skipped by a beforeRefresh handler.
	}
})

const PatchedComponent = Component().beforeCreate(params => {
	// Do stuff here even before the component is created.
})`

const createExample = `const Counter = maoka.html.button(({ value, props, refresh$ }) => {
	let count = props().initialCount

	value.type = "button"
	value.onclick = () => {
		count++
		refresh$()
	}

	return () => \`Count: \${count}\`
})

render(document.body, Counter(() => ({ initialCount: 0 })))`

const renderExample = `const Count = maoka.html.span(({ props }) => {
	// Create phase. Runs once.

	return () => {
		// Render phase. Runs after create and after accepted refreshes.
		return \`Count: \${props().count}\`
	}
})

const Counter = maoka.create(({ refresh$ }) => {
	let count = 0

	return () => [
		Count(() => ({ key: "count", count })),
		maoka.html.button(({ value }) => {
			value.onclick = () => {
				count++
				refresh$()
			}

			return () => "+"
		})(),
	]
})`

const mountExample = `const AutoFocusInput = maoka.html.input(({ lifecycle, value }) => {
	value.type = "text"

	lifecycle.afterMount(() => {
		value.focus()
		value.scrollIntoView({ block: "nearest" })
	})

	return () => ""
})`

const refreshExample = `const Digit = maoka.html.span(({ lifecycle, props }) => {
	let previousDigit = props().digit

	lifecycle.beforeRefresh(() => {
		const nextDigit = props().digit
		const shouldRender = nextDigit !== previousDigit

		previousDigit = nextDigit

		return shouldRender
	})

	return () => props().digit
})`

const asyncRefreshExample = `const Profile = maoka.html.article(({ lifecycle, props, refresh$ }) => {
	let isLoading = false
	let loadedId = null
	let profile = null

	lifecycle.beforeRefresh(() => {
		const { id } = props()

		if (loadedId === id) return true

		if (!isLoading) {
			isLoading = true
			refresh$()

			return false
		}

		return async () => {
			profile = await fetch(\`/api/profiles/\${id}\`).then(response =>
				response.json(),
			)
			loadedId = id
			isLoading = false

			return true
		}
	})

	return () => {
		if (isLoading) return "Loading..."

		return profile?.name ?? "No profile"
	}
})`

const destroyExample = `const SocketStatus = maoka.html.output(({ lifecycle, refresh$ }) => {
	let status = "connecting"
	const socket = new WebSocket("wss://example.test")

	socket.onopen = () => {
		status = "online"
		refresh$()
	}

	lifecycle.beforeUnmount(() => {
		socket.close()
	})

	return () => status
})`

const unmountExample = `const WindowSize = maoka.html.output(({ lifecycle, refresh$ }) => {
	let label = \`\${window.innerWidth} x \${window.innerHeight}\`
	const onResize = () => {
		label = \`\${window.innerWidth} x \${window.innerHeight}\`
		refresh$()
	}

	lifecycle.afterMount(() => {
		window.addEventListener("resize", onResize)

		return () => {
			window.removeEventListener("resize", onResize)
		}
	})

	lifecycle.afterUnmount(() => {
		console.info("WindowSize left the tree")
	})

	return () => label
})`

const errorExample = `const UserCard = maoka.html.article(({ lifecycle, props, refresh$ }) => {
	let errorMessage = ""

	lifecycle.onError((error, descendantError) => {
		errorMessage = error?.message ?? descendantError.error.message
		descendantError?.handle()
		refresh$()
	})

	return () => {
		if (errorMessage) return \`Could not render user: \${errorMessage}\`

		const user = props().user

		if (!user.name) throw new Error("Missing user name")

		return user.name
	}
})`

const errorBoundaryExample = `const UserBoundary = maoka.html.section(({ use }) => {
	use(maoka.jabs.errorBoundary(error => {
		console.info("User subtree failed", error)
	}))

	return () => UserCard()
})`

const beforeCreateExample = `const TraceablePanel = maoka.html.section(({ props }) => {
	return () => props().title
})

const Panel = TraceablePanel(() => ({ key: "settings", title: "Settings" }))
	.beforeCreate(({ key }) => {
		console.info("creating panel", key)
	})
	.beforeCreate(({ lifecycle }) => {
		lifecycle.beforeUnmount(() => console.info("panel removed"))
	})`

const Page = maoka.create(() => () => [
	maoka.html.main(({ value }) => {
		value.className = "docs-layout"

		return () => [
			DocsNav(),
			maoka.html.article(() => () => [
				Hero(),
				Section(() => ({
					id: "tldr",
					title: "TL;DR",
					body: [
						"Maoka has two stable component phases: create and render. Create runs once when the node is made. Render runs immediately after create and again after refresh work that was not skipped by beforeRefresh.",
						"Lifecycle hooks are optional handlers available through the lifecycle object. They let components and jabs attach behavior around refresh, mount, unmount, and errors without changing the two-phase component shape.",
					],
				})),
				CodeBlock(() => ({ js: lifecycleExample })),
				Section(() => ({
					id: "create",
					title: "Create phase",
					body: [
						"Create phase is the component definition call. It always runs once for a node, before the first render result is applied. Put stable wiring here: local state, event callbacks, lifecycle registration, and jabs that should attach to this node.",
						"Create is a good place for values that should survive many renders. The returned render function closes over those values and reads the current props when it needs them.",
					],
					code: createExample,
				})),
				Section(() => ({
					id: "render",
					title: "Render phase",
					body: [
						"Render phase is the function returned from create. It runs once during creation and then again when the node refreshes and beforeRefresh does not skip the render.",
						"Render should describe the current output: text, child components, empty values, or mixed renderable lists. Keep durable setup out of render; put that work in create or lifecycle hooks instead.",
					],
					code: renderExample,
				})),
				Section(() => ({
					id: "hooks",
					title: "Lifecycle hooks",
					body: [
						"Lifecycle hooks live on params.lifecycle and are also available inside jabs through the same params object. They are not phases by themselves; they are optional hooks around refresh, mount, unmount, and error handling.",
						"Use hooks for side effects and policies: focus after insertion, decide whether a refresh should render, clean up before removal, observe that a node is gone, or recover from an error.",
					],
				})),
				Section(() => ({
					id: "after-mount",
					title: "afterMount hook",
					body: [
						"afterMount runs once, after the renderer inserts the node into its mounted parent. Use it for DOM work that needs a real parent relationship: focus, scrollIntoView, measurements, observers, and browser APIs that expect an inserted element.",
						"If an afterMount handler returns a function, Maoka registers that function as a beforeUnmount cleanup. This keeps setup and teardown in the same closure, while still cleaning up before the renderer removes the node.",
					],
					code: mountExample,
				})),
				Section(() => ({
					id: "before-refresh",
					title: "beforeRefresh hook",
					body: [
						"beforeRefresh handlers run before a queued node renders again. Return true when the node should run its render function. Leave the return value empty when the node can skip its own render while descendants continue their refresh checks.",
						"Use this hook when a component can cheaply decide whether its own output changed. Keyed children still get their own refresh checks, so a parent can stay quiet while a smaller piece updates.",
					],
					code: refreshExample,
				})),
				Section(() => ({
					id: "patterns",
					title: "Patterns",
					body: [
						"For async work tied to props, keep the work in beforeRefresh. Set local loading state, request another refresh, and return false from the first pass. The next pass can return an async continuation.",
						"When beforeRefresh returns an async continuation, Maoka renders the current state first, waits for the continuation, routes rejected errors through onError, and renders again only when the continuation returns true.",
						"This keeps async state inside the component lifecycle instead of moving errors and refresh policy into detached promise chains.",
					],
					code: asyncRefreshExample,
				})),
				Section(() => ({
					id: "before-unmount",
					title: "beforeUnmount hook",
					body: [
						"beforeUnmount runs after Maoka decides a node is stale and before the renderer removes that node from the tree. Use it when teardown needs the value to still be attached, or when the external resource should close before the renderer mutates the parent.",
						"Child beforeUnmount handlers run before parent beforeUnmount handlers. That gives nested components a chance to release their own resources before the parent tears down the larger context.",
					],
					code: destroyExample,
				})),
				Section(() => ({
					id: "after-unmount",
					title: "afterUnmount hook",
					body: [
						"afterUnmount runs after the renderer removes the node from its parent. Use it for post-removal notifications and cleanup that should observe the detached value.",
						"You can register afterUnmount manually when cleanup really should observe the detached value. Cleanup returned from afterMount is registered as beforeUnmount instead, so setup teardown runs while the node is still attached.",
					],
					code: unmountExample,
				})),
				Section(() => ({
					id: "error",
					title: "onError hook",
					body: [
						"onError receives this node's own errors as the first argument. If a child fails without its own onError handler, the error bubbles upward in a descendant error container.",
						"The container arrives as the second argument. It exposes the original error, whether it has been handled, and a handle method. Bubbling continues until a parent handler marks the container as handled; otherwise the error is thrown.",
						"For subtree boundaries, prefer maoka.jabs.errorBoundary. It reads the descendant container, passes the original error to your handler, and marks the container as handled.",
					],
					code: `${errorExample}\n\n${errorBoundaryExample}`,
				})),
				Section(() => ({
					id: "before-create",
					title: "Before create",
					body: [
						"beforeCreate is not part of params.lifecycle. It is a method on the component returned by a blueprint call, and it runs with component params right before the component definition.",
						"Use beforeCreate when a component should stay abstract, but a specific use site needs to enrich it with context, policy, tracing, or renderer-specific behavior. It chains on the component and runs once for that node creation.",
					],
					code: beforeCreateExample,
				})),
			]),
		]
	})(),
])

const Hero = maoka.html.header(() => () => [
	maoka.html.p(({ value }) => {
		value.className = "eyebrow"

		return () => "Maoka lifecycle"
	})(),
	maoka.html.h1(() => () => "Component lifecycle"),
	maoka.html.div(({ value }) => {
		value.className = "lifecycle-callout"

		return () =>
			"Lifecycle methods are available in jabs too, so behavior layers can use them to handle side effects, cleanup, recovery, and refresh policy without moving that work into the component body."
	})(),
])

const Section = maoka.html.section(({ props, value }) => {
	value.id = props().id

	return () => [
		maoka.html.h2(() => () => props().title),
		...props().body.map(body => maoka.html.p(() => () => body)()),
		props().code ? CodeBlock(() => ({ js: props().code })) : null,
	]
})

render(document.body, Page())
