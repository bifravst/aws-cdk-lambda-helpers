import { aws_lambda as Lambda, Duration, Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { LambdaLogGroup } from './LambdaLogGroup.js'
import { Permissions as SettingsPermissions } from '@bifravst/aws-ssm-settings-helpers/cdk'
import type { PackedLambda } from './packLambda.js'
import { LambdaSource } from './LambdaSource.js'

/**
 * Creates a Lambda function with useful defaults:
 *
 * - Code from a PackedLambda
 * - Architecture: ARM64
 * - Runtime: Node.js 20
 * - timeout: 5 seconds
 * - memorySize: 1792 MB
 * - environment
 *   VERSION: set from the 'version' context
 *   NODE_NO_WARNINGS: disabled to get rid of Node.js warnings in the logs
 *   STACK_NAME: the current stack name
 *   DISABLE_METRICS: set to '1' of 'isTest'===true in the context
 * - a LambdaLogGroup
 * - policies that allow to access all SSM parameters below the current stack name
 */
export class PackedLambdaFn extends Construct {
	public readonly fn: Lambda.Function
	public constructor(
		parent: Construct,
		id: string,
		source: PackedLambda,
		props: Partial<Omit<Lambda.FunctionProps, 'code' | 'handler'>>,
	) {
		super(parent, id)

		const { environment, initialPolicy, ...rest } = props

		this.fn = new Lambda.Function(this, 'fn', {
			architecture: Lambda.Architecture.ARM_64,
			runtime: props.runtime ?? Lambda.Runtime.NODEJS_20_X,
			timeout: Duration.seconds(5),
			memorySize: 1792,
			environment: {
				VERSION: this.node.tryGetContext('version'),
				NODE_NO_WARNINGS: '1',
				STACK_NAME: Stack.of(this).stackName,
				DISABLE_METRICS: this.node.tryGetContext('isTest') === true ? '1' : '0',
				...environment,
			},
			initialPolicy: [
				...(initialPolicy ?? []),
				SettingsPermissions(Stack.of(this)),
			],
			...new LambdaLogGroup(this, 'fnLogs'),
			...rest,
			handler: source.handler,
			code: new LambdaSource(this, source).code,
		})
		this.fn.node.addMetadata('packedLambda:id', source.id)
		this.fn.node.addMetadata('packedLambda:hash', source.hash)
	}
}
