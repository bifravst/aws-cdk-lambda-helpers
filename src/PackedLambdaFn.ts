import { Permissions as SettingsPermissions } from '@bifravst/aws-ssm-settings-helpers/cdk'
import {
	Duration,
	aws_lambda as Lambda,
	Stack,
	type aws_logs as Logs,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { LambdaLogGroup } from './LambdaLogGroup.js'
import { LambdaSource } from './LambdaSource.js'
import type { PackedLambda } from './packLambda.js'

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
 * - a LambdaLogGroup (if not provided)
 * - policies that allow to access all SSM parameters below the current stack name
 */
export class PackedLambdaFn extends Construct {
	public readonly fn: Lambda.Function
	public readonly logGroup: Logs.ILogGroup
	public constructor(
		parent: Construct,
		id: string,
		source: PackedLambda,
		props: Partial<Omit<Lambda.FunctionProps, 'code' | 'handler'>>,
	) {
		super(parent, id)

		const { environment, initialPolicy, ...rest } = props

		this.logGroup =
			props.logGroup ?? new LambdaLogGroup(this, 'fnLogs').logGroup

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
				PACKED_LAMBDA_ID: source.id,
				PACKED_LAMBDA_HASH: source.hash,
				...environment,
			},
			initialPolicy: [
				...(initialPolicy ?? []),
				SettingsPermissions(Stack.of(this)),
			],
			...rest,
			logGroup: this.logGroup,
			handler: source.handler,
			code: new LambdaSource(this, source).code,
		})
		this.fn.node.addMetadata('packedLambda:id', source.id)
		this.fn.node.addMetadata('packedLambda:hash', source.hash)
	}
}
