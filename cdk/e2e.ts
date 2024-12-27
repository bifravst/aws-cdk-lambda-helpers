import { fromEnv } from '@bifravst/from-env'
import { TestApp } from './TestApp.ts'
import { pack as packBaseLayer } from './baseLayer.ts'
import { packTestLambdas } from './packTestLambdas.ts'
const { stackName } = fromEnv({
	stackName: 'STACK_NAME',
})(process.env)

new TestApp(stackName, {
	lambdaSources: await packTestLambdas(),
	layer: await packBaseLayer(),
})
