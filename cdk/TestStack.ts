import type { App } from 'aws-cdk-lib'
import { CfnOutput, Duration, aws_lambda as Lambda, Stack } from 'aws-cdk-lib'
import { LambdaSource } from '../src/cdk.ts'
import type { PackedLayer } from '../src/layer.ts'
import { PackedLambdaFn } from '../src/PackedLambdaFn.ts'
import type { TestLambdas } from './packTestLambdas.ts'

export class TestStack extends Stack {
	public constructor(
		parent: App,
		id: string,
		{
			lambdaSources,
			layer,
		}: {
			lambdaSources: TestLambdas
			layer: PackedLayer
		},
	) {
		super(parent, id, {})

		const baseLayer = new Lambda.LayerVersion(this, 'baseLayer', {
			layerVersionName: `${Stack.of(this).stackName}-baseLayer`,
			code: new LambdaSource(this, {
				id: 'baseLayer',
				zipFilePath: layer.layerZipFilePath,
				hash: layer.hash,
			}).code,
			compatibleArchitectures: [Lambda.Architecture.ARM_64],
			compatibleRuntimes: [Lambda.Runtime.NODEJS_22_X],
		})

		const lambda = new PackedLambdaFn(this, 'fn', lambdaSources.test, {
			timeout: Duration.seconds(1),
			description: 'Returns a ULID',
			layers: [baseLayer],
		})

		const url = lambda.fn.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})

		new CfnOutput(this, 'lambdaURL', {
			exportName: `${Stack.of(this).stackName}:lambdaURL`,
			description: 'API endpoint',
			value: url.url,
		})

		const lambdaAliasImports = new PackedLambdaFn(
			this,
			'aliasImportsFn',
			lambdaSources.testAliasImports,
			{
				timeout: Duration.seconds(1),
				description: 'Uses aliased imports',
				layers: [baseLayer],
			},
		)

		const urlAliasImports = lambdaAliasImports.fn.addFunctionUrl({
			authType: Lambda.FunctionUrlAuthType.NONE,
		})

		new CfnOutput(this, 'lambdaAliasImportsURL', {
			exportName: `${Stack.of(this).stackName}:lambdaAliasImportsURL`,
			description: 'API endpoint for the lambda using alias imports',
			value: urlAliasImports.url,
		})
	}
}

export type StackOutputs = {
	lambdaURL: string
	lambdaAliasImportsURL: string
}
