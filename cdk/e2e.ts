import { fromEnv } from '@bifravst/from-env'
import { TestApp } from './TestApp.js'
import { pack as packBaseLayer } from './baseLayer.js'
import { packTestLambdas } from './packTestLambdas.js'
const { stackName } = fromEnv({
	stackName: 'STACK_NAME',
})(process.env)

new TestApp(stackName, {
	lambdaSources: await packTestLambdas(),
	layer: await packBaseLayer(),
})
