import { CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { stackOutput } from '@bifravst/cloudformation-helpers'
import { fromEnv } from '@bifravst/from-env'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { StackOutputs } from './cdk/TestStack.ts'

void describe('end-to-end tests', () => {
	void it('should return an ULID', async () => {
		const { stackName } = fromEnv({
			stackName: 'STACK_NAME',
		})(process.env)
		const { lambdaURL } = await stackOutput(
			new CloudFormationClient({}),
		)<StackOutputs>(stackName)

		const res = await fetch(new URL(lambdaURL))
		assert.equal(res.ok, true)
		assert.equal(res.status, 201)
		assert.match(await res.text(), /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/)
	})

	void it('the lambda with aliased imports should work', async () => {
		const { stackName } = fromEnv({
			stackName: 'STACK_NAME',
		})(process.env)
		const { lambdaAliasImportsURL } = await stackOutput(
			new CloudFormationClient({}),
		)<StackOutputs>(stackName)

		const res = await fetch(new URL(lambdaAliasImportsURL))
		assert.equal(res.ok, true)
		assert.equal(res.status, 201)
		assert.equal(parseInt(await res.text(), 10), 42 + 17)
	})
})
