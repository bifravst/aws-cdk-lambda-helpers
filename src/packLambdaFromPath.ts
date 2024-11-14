import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { packLambda, type PackedLambda } from './packLambda.js'

export const packLambdaFromPath = async ({
	id,
	sourceFilePath,
	handlerFunction: handlerFunctionArg,
	baseDir: baseDirArg,
	distDir: distDirArg,
	tsConfigFilePath,
}: {
	id: string
	sourceFilePath: string
	handlerFunction?: string
	/**
	 * @default process.cwd()
	 */
	baseDir?: string
	/**
	 * @default ${baseDir}/dist/lambdas
	 */
	distDir?: string
	/**
	 * Pass the path to the tsconfig.json file if you want to use paths from the tsconfig.json file.
	 */
	tsConfigFilePath?: string
}): Promise<PackedLambda> => {
	const distDir = distDirArg ?? path.join(process.cwd(), 'dist', 'lambdas')
	const baseDir = baseDirArg ?? process.cwd()
	const handlerFunction = handlerFunctionArg ?? 'handler'
	try {
		await mkdir(distDir, {
			recursive: true,
		})
	} catch {
		// Directory exists
	}
	const zipFile = path.join(distDir, `${id}.zip`)
	const { handler, hash } = await packLambda({
		sourceFilePath: path.join(baseDir, sourceFilePath),
		zipFilePath: zipFile,
		tsConfigFilePath,
	})
	return {
		id,
		zipFilePath: zipFile,
		handler: handler.replace('.js', `.${handlerFunction}`),
		hash,
	}
}
