# Maoka

Maoka is a UI library for on-demand rendering of user interfaces. It separates
component creation from rendering, keeps components renderer-agnostic, exposes
lifecycle behavior through small composable hooks called jabs, and ships with
both DOM and in-memory test renderers.

## Fast Start

Install the package:

```bash
npm i maoka
```

Create a small component and render it into the DOM:

```ts
import maoka from "maoka"
import { render } from "maoka/dom"

const Greeting = maoka.html.h1<{ name: string }>(({ props }) => {
	return () => `Hello, ${props().name}`
})

render(
	document.body,
	Greeting(() => ({ name: "Maoka" })),
)
```

What is happening here:

- `maoka.html.h1(...)` creates a component blueprint bound to an `h1` renderer
  value.
- The definition function is the create phase. It runs once for the node.
- The returned function is the render phase. It produces output from current
  props.
- `render(...)` comes from `maoka/dom` and mounts the component into a real DOM
  container.

## Why Maoka

Maoka is built around a few core ideas that show up consistently across the
runtime, the DOM adapter, the test adapter, and the docs examples.

### Create And Render Are Separate

In Maoka, a component definition runs once when a node is created. That is where
you keep durable state, register lifecycle handlers, hit with jabs, and wire
behavior. If the component needs visible output, the definition returns a render
function. That render function can run later on creation and on accepted
refreshes.

This split lets components keep stable internal behavior without rebuilding
setup on every render.

### Components Are Renderer-Agnostic

Components produce Maoka nodes, not DOM nodes directly. The same component model
is used by:

- `maoka/dom` for real browser rendering
- `maoka/test` for in-memory testing
- `maoka/rendering` for lower-level renderer integration

That means component logic, lifecycle semantics, refresh behavior, and
reconciliation can be exercised without a browser.

### Refresh Is Explicit And Controlled

Components refresh through `refresh$()`. Before a render runs, lifecycle and jab
handlers can decide whether a refresh should proceed, be skipped, or continue
asynchronously.

This is what powers behaviors such as:

- skipping refreshes
- handling async refresh continuations

### Reconciliation Tracks Identity

Children are reconciled by key when a key exists, or by position otherwise.
Matching nodes are reused rather than remounted, which keeps create-phase state
and lifecycle intact while renderer values are moved, inserted, refreshed, or
removed.

The test suite also confirms related behavior such as keyed reordering without
remounting and unkeyed remounts when component identity changes.

### Jabs Keep Behavior Composable

Jabs are direct hooks invoked through `use(jab)`. A jab receives the same
component params as the component itself, so it can work with:

- `props()`
- `refresh$()`
- `lifecycle`
- nested `use(...)`

This makes refresh policy, mount/unmount work, and error handling composable
without pushing everything into component bodies.

## Public Surface

Maoka exposes a small set of entry points:

### `maoka`

The root module exports:

- the default `maoka` runtime namespace
- `maoka.create(...)` for renderer-agnostic components
- `maoka.pure(...)` for components with a fixed renderer-facing tag
- `maoka.html`, `maoka.svg`, and `maoka.math` tagged component maps
- `maoka.jabs` for built-in behavior helpers
- `MAOKA` for exported tag constant collections

Use this module when you are defining components and jabs.

### `maoka/dom`

The DOM adapter exports `render(container, component, options?)` and
DOM-specific helpers. Use it when you want to mount Maoka components into a
browser DOM tree.

The repo test suite verifies DOM behaviors including:

- rendering nested templates into a container
- child refresh without remounting
- keyed DOM moves, removals, and insertions
- mixed text and component children

### `maoka/test`

The test adapter exports:

- `render(...)` for rendering a component into an in-memory tree
- `renderJab(...)` for probing a jab with real Maoka params
- helpers such as `flush()`, `text()`, `toJSON()`, and `findByTag(...)`

Use it when you want behavior tests without a browser or `jsdom`.

### `maoka/rendering`

This module re-exports the lower-level rendering implementation used to build
renderer integrations. Use it when you are working on Maoka internals or
implementing another renderer.

## Repository Map

This repo is a library workspace, not an application. The main areas are:

- [`index.js`](./index.js): root public exports for the runtime
- [`src/`](./src): core runtime implementation, built-in jabs, constants, and
  runtime tests
- [`dom/`](./dom): DOM renderer adapter and its tests
- [`test/`](./test): in-memory test renderer and its tests
- [`rendering/`](./rendering): renderer-agnostic rendering internals and tests
- [`docs/`](./docs): the documentation site source, examples, shared UI
  components, dev server, and static build script
- [`maoka.d.ts`](./maoka.d.ts): root TypeScript type surface

If you are trying to understand how Maoka works end to end, a good reading order
is:

1. `README.md`
2. [`docs/pages/index/`](./docs/pages/index)
3. [`docs/pages/api/`](./docs/pages/api)
4. [`src/`](./src), then the adapter you care about

## Docs And Examples

The repository includes a small docs site under [`docs/`](./docs). Its current
pages are:

- [`docs/pages/index/`](./docs/pages/index): landing page, positioning, and a
  runnable hello-world style demo
- [`docs/pages/api/`](./docs/pages/api): exported surface, signatures, and usage
  examples for the runtime and adapters
- [`docs/pages/best-practices/`](./docs/pages/best-practices): opinionated
  guidance for naming refresh-capable jabs, structuring blueprints, placing
  async work, and keeping renderer-specific behavior explicit
- [`docs/pages/component-lifecycle/`](./docs/pages/component-lifecycle): create
  vs render, lifecycle hooks, refresh flow, unmount behavior, error handling,
  and `beforeCreate(...)`
- [`docs/pages/jabs/`](./docs/pages/jabs): built-in jabs such as `noRefresh`,
  `shouldComponentRefresh`, and `errorBoundary`, plus custom jab examples
- [`docs/pages/testing/`](./docs/pages/testing): component and jab testing with
  the in-memory renderer
- [`docs/src/examples/`](./docs/src/examples): example code used by the docs
  site and covered by tests

To run the docs locally:

```bash
bun install
bun docs
```

The local server prints a URL such as `http://localhost:3000`. From there, the
docs pages are served at routes like:

- `/`
- `/api`
- `/best-practices`
- `/component-lifecycle`
- `/jabs`
- `/testing`

### Best Practices Snapshot

The full guidance lives in
[`docs/pages/best-practices/`](./docs/pages/best-practices). The compact version
is:

- name refresh-capable jabs with a trailing `$`, including wrapper jabs that
  call other `$` jabs
- declare blueprints outside components and pass data through props instead of
  parent closures
- prefer `beforeRefresh` continuations for async render-adjacent work so Maoka
  keeps handling refresh flow and async errors
- keep jabs responsibly tamed: side effects should be paired with the correct
  lifecycle hooks and cleanup points
- in parent-child refresh conflicts, prefer letting children own their own
  refreshes
- arrays are valid render output, but use keys when identity or order can change
- keep create phase readable: state first, then helpers/handlers, then
  value-returning jabs, then void jabs
- never call `refresh$()` during render
- keep at least one error boundary near the app entry
- guard renderer-specific `value` work with renderer-specific helpers such as
  `maokaDom.jabs.ifInDOM`

## Development

This repository uses Bun for local development scripts.

Install dependencies:

```bash
bun install
```

Run the docs server in watch mode:

```bash
bun docs
```

Build the static docs output:

```bash
bun run build
```

That runs:

```bash
bun run build:docs
```

Run the test suite:

```bash
bun test
```

## Testing And Reliability

The current test suite covers the library from several angles:

- core runtime behavior in [`src/*.test.js`](./src)
- renderer-agnostic refresh and reconciliation internals in
  [`rendering/src/`](./rendering/src)
- DOM adapter behavior in [`dom/src/`](./dom/src)
- in-memory test renderer behavior in [`test/src/`](./test/src)
- docs UI and example behavior in [`docs/src/`](./docs/src)

The passing tests in this repository currently verify behavior such as:

- create-only components and components with render phases
- keyed reuse and reordering
- prop-driven refresh behavior and shallow-equality skips
- async refresh continuations
- mount and unmount lifecycle ordering
- descendant error bubbling and error boundaries
- DOM reconciliation and child updates without remounting
- testing components and jabs without a browser

## Where To Start

If you want to use Maoka:

- start with the Fast Start example above
- read [`docs/pages/api/`](./docs/pages/api) for the exported surface
- read [`docs/pages/testing/`](./docs/pages/testing) if you plan to test
  components or jabs

If you want to work on Maoka itself:

- read [`src/`](./src) for the public runtime model
- read [`rendering/src/`](./rendering/src) for reconciliation and refresh
  internals
- read [`dom/src/`](./dom/src) or [`test/src/`](./test/src) depending on the
  adapter you want to change
- keep the docs pages in sync when public behavior changes

## Contributing Orientation

Maoka uses a deliberately small public API, but the runtime semantics are
precise. When changing behavior, treat the following as part of the contract:

- create phase vs render phase separation
- keyed child identity and reconciliation
- lifecycle hook ordering
- jab behavior and refresh control
- consistency between the DOM and test adapters

In practice, the safest workflow is:

1. change the runtime or adapter code
2. add or update tests near the behavior you changed
3. update the docs page or example that explains that behavior

That keeps the repo useful both as a package source and as documentation for how
the package works.
