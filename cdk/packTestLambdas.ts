import type { PackedLambda } from '../src/packLambda.js'
import { packLambdaFromPath } from '../src/packLambdaFromPath.js'

export type TestLambdas = {
	test: PackedLambda
	testAliasImports: PackedLambda
}

export const packTestLambdas = async (): Promise<TestLambdas> => ({
	test: await packLambdaFromPath({
		id: 'test',
		sourceFilePath: 'cdk/lambda.ts',
	}),
	testAliasImports: await packLambdaFromPath({
		id: 'testAliasImports',
		sourceFilePath: 'cdk/lambda-with-subpath.ts',
	}),
})
