import { fromEnv } from '@bifravst/from-env'
import chalk from 'chalk'
import { updateLambdaCode } from '../src/updateLambdaCode.ts'
import { packTestLambdas } from './packTestLambdas.ts'

const { stackName } = fromEnv({
	stackName: 'STACK_NAME',
})(process.env)

// Instantiate the command
const update = updateLambdaCode()

// Pack the lambdas
const start = new Date()
const packs = await packTestLambdas()
console.debug('Packed lambdas in', new Date().getTime() - start.getTime(), 'ms')

// Pass stack and the lambdas to be updated
await update(stackName, packs, (arg, ...args) =>
	console.debug(chalk.blue(`[${stackName}]`), chalk.green(arg), ...args),
)
console.debug('Done')
console.debug(
	'Updated lambdas in',
	new Date().getTime() - start.getTime(),
	'ms',
)
