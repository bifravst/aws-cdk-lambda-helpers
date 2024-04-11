import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { packLambda, type PackedLambda } from './packLambda.js'

export const packLambdaFromPath = async (
	id: string,
	sourceFile: string,
	handlerFunction = 'handler',
	/**
	 * @default process.cwd()
	 */
	baseDir = process.cwd(),
	/**
	 * @default ${baseDir}/dist/lambdas
	 */
	distDir: string = path.join(process.cwd(), 'dist', 'lambdas'),
): Promise<PackedLambda> => {
	try {
		await mkdir(distDir, {
			recursive: true,
		})
	} catch {
		// Directory exists
	}
	const zipFile = path.join(distDir, `${id}.zip`)
	const { handler, hash } = await packLambda({
		sourceFile: path.join(baseDir, sourceFile),
		zipFile,
	})
	return {
		id,
		zipFile,
		handler: handler.replace('.js', `.${handlerFunction}`),
		hash,
	}
}
