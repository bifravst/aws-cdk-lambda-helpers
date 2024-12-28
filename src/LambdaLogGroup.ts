import { aws_logs as Logs, Names, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { isTest } from './isTest.ts'

export class LambdaLogGroup extends Construct {
	public readonly logGroup: Logs.LogGroup
	constructor(
		parent: Construct,
		id: string,
		// Defaults to 30 days for production, 1 day for test
		retention?: Logs.RetentionDays,
	) {
		super(parent, id)
		this.logGroup = new Logs.LogGroup(this, 'logGroup', {
			retention:
				retention ??
				(isTest(this)
					? Logs.RetentionDays.ONE_DAY
					: Logs.RetentionDays.ONE_MONTH),
			logGroupName: `/${Stack.of(this).stackName}/fn/${id}-${Names.uniqueId(this)}`,
			logGroupClass: Logs.LogGroupClass.STANDARD, // INFREQUENT_ACCESS does not support custom metrics
			removalPolicy:
				this.node.getContext('isTest') === true
					? RemovalPolicy.DESTROY
					: RemovalPolicy.RETAIN,
		})
	}
}
