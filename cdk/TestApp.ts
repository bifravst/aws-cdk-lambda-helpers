import { App } from 'aws-cdk-lib'
import { TestStack } from './TestStack.js'

export class TestApp extends App {
	public constructor(
		id: string,
		args: ConstructorParameters<typeof TestStack>[2],
	) {
		super({
			context: {
				isTest: true,
			},
		})

		new TestStack(this, id, args)
	}
}
