import { Permissions as SettingsPermissions } from '@bifravst/aws-ssm-settings-helpers/cdk'
import { Duration, Stack, Tags } from 'aws-cdk-lib'
import {
	Architecture,
	Function as LambdaFunction,
	Runtime,
	type FunctionProps,
} from 'aws-cdk-lib/aws-lambda'
import type { ILogGroupRef } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { LambdaLogGroup } from './LambdaLogGroup.ts'
import { LambdaSource } from './LambdaSource.ts'
import type { PackedLambda } from './packLambda.ts'

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
	public readonly fn: LambdaFunction
	public readonly logGroup: ILogGroupRef
	public constructor(
		parent: Construct,
		id: string,
		source: PackedLambda,
		props: Partial<Omit<FunctionProps, 'code' | 'handler'>>,
	) {
		super(parent, id)

		const { environment, initialPolicy, architecture, ...rest } = props

		this.logGroup =
			props.logGroup ?? new LambdaLogGroup(this, 'fnLogs').logGroup

		this.fn = new LambdaFunction(this, 'fn', {
			architecture: architecture ?? Architecture.ARM_64,
			runtime: props.runtime ?? Runtime.NODEJS_24_X,
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
			...rest,
			logGroup: this.logGroup,
			handler: source.handler,
			code: new LambdaSource(this, source).code,
		})
		Tags.of(this.fn).add('packedLambda:id', source.id)
		Tags.of(this.fn).add('packedLambda:hash', source.hash)
	}
}
