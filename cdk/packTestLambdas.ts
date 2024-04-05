import type { PackedLambda } from '../src/packLambda.js'
import { packLambdaFromPath } from '../src/packLambdaFromPath.js'

export type TestLambdas = {
	test: PackedLambda
}

export const packTestLambdas = async (): Promise<TestLambdas> => ({
	test: await packLambdaFromPath('test', 'cdk/lambda.ts'),
})
