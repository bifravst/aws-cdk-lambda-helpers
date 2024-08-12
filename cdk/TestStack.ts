import type { App } from 'aws-cdk-lib'
import { CfnOutput, Duration, aws_lambda as Lambda, Stack } from 'aws-cdk-lib'
import { LambdaSource } from '../src/cdk.js'
import type { PackedLayer } from '../src/layer.js'
import { PackedLambdaFn } from '../src/PackedLambdaFn.js'
import type { TestLambdas } from './packTestLambdas.js'

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
				zipFile: layer.layerZipFile,
				hash: layer.hash,
			}).code,
			compatibleArchitectures: [Lambda.Architecture.ARM_64],
			compatibleRuntimes: [Lambda.Runtime.NODEJS_20_X],
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
			exportName: `${this.stackName}:lambdaURL`,
			description: 'API endpoint',
			value: url.url,
		})
	}
}

export type StackOutputs = {
	lambdaURL: string
}
