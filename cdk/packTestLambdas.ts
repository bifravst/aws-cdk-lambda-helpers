import path from 'node:path'
import type { PackedLambda } from '../src/packLambda.ts'
import { packLambdaFromPath } from '../src/packLambdaFromPath.ts'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

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
		tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.base.json'),
	}),
})
