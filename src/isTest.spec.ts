import type { Construct } from 'constructs'
import assert from 'node:assert'
import { describe, it, mock } from 'node:test'
import { isTest } from './isTest.ts'

void describe('isTest()', () => {
	void it('should return true if the construct is a test', () => {
		const construct = {
			node: {
				tryGetContext: mock.fn<(context: string) => boolean>(() => true),
			},
		}
		const result = isTest(construct as unknown as Construct)
		assert.equal(result, true)
		assert.equal(construct.node.tryGetContext.mock.calls.length, 1)
		assert.equal(
			construct.node.tryGetContext.mock.calls[0]?.arguments[0],
			'isTest',
		)
	})
})
