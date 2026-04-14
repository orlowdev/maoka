/** @import { Maoka } from "../maoka" */

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
export const shouldComponentUpdate =
	compare =>
	({ lifecycle, props$ }) => {
		let prevProps = props$()

		lifecycle.beforeRefresh(() => {
			const nextProps = props$()
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
