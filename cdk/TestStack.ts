import {
	App,
	CfnOutput,
	Duration,
	aws_lambda as Lambda,
	Stack,
} from 'aws-cdk-lib'
import { LambdaLogGroup, LambdaSource } from '../src/cdk.js'
import type { PackedLayer } from '../src/layer.js'
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

		const fn = new Lambda.Function(this, 'fn', {
			handler: lambdaSources.test.handler,
			architecture: Lambda.Architecture.ARM_64,
			runtime: Lambda.Runtime.NODEJS_20_X,
			timeout: Duration.seconds(1),
			memorySize: 1792,
			code: new LambdaSource(this, lambdaSources.test).code,
			description: 'Returns a ULID',
			environment: {
				NODE_NO_WARNINGS: '1',
			},
			layers: [baseLayer],
			...new LambdaLogGroup(this, 'fnLogs'),
		})

		const url = fn.addFunctionUrl({
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
