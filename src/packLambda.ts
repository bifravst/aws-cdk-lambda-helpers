import swc from '@swc/core'
import { createWriteStream } from 'node:fs'
import { parse } from 'path'
import yazl from 'yazl'
import { checkSumOfFiles } from './checksumOfFiles.js'
import { commonParent } from './commonParent.js'
import { findDependencies } from './findDependencies.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export type PackedLambda = {
	id: string
	zipFile: string
	handler: string
	hash: string
}

const removeCommonAncestor =
	(parentDir: string) =>
	(file: string): string => {
		const p = parse(file)
		const jsFileName = [
			p.dir.replace(parentDir.slice(0, parentDir.length - 1), ''),
			`${p.name}.js`,
		]
			.join('/')
			// Replace leading slash
			.replace(/^\//, '')

		return jsFileName
	}

/**
 * In the bundle we only include code that's not in the layer.
 */
export const packLambda = async ({
	sourceFile,
	zipFile,
	debug,
	progress,
}: {
	sourceFile: string
	zipFile: string
	debug?: (label: string, info: string) => void
	progress?: (label: string, info: string) => void
}): Promise<{ handler: string; hash: string }> => {
	const deps = findDependencies(sourceFile)
	const lambdaFiles = [sourceFile, ...deps]

	const zipfile = new yazl.ZipFile()

	const stripCommon = removeCommonAncestor(commonParent(lambdaFiles))

	const handler = stripCommon(sourceFile)

	// Make sure that the handler does not import from a folder with the same name in the folder
	const handlerInfo = path.parse(handler)
	const handlerName = handlerInfo.name
	const handlerDir = handlerInfo.dir
	const handlerDepsFromSameDirectory = deps
		.map(stripCommon)
		.filter((d) =>
			handlerDir === '' ? true : d.startsWith(`${handlerDir}${path.sep}`),
		)
	const handlerDepsFolderNames = new Set(
		handlerDepsFromSameDirectory.map((s) => s.split('/')[0]),
	)
	if (handlerDepsFolderNames.has(handlerName)) {
		throw new ImportFromFolderNameError(handlerName)
	}

	// Compile files
	for (const file of lambdaFiles) {
		const compiled = (
			await swc.transformFile(file, {
				jsc: {
					target: 'es2022',
				},
			})
		).code
		debug?.(`compiled`, compiled)
		const jsFileName = stripCommon(file)
		zipfile.addBuffer(Buffer.from(compiled, 'utf-8'), jsFileName)
		progress?.(`added`, jsFileName)
	}

	const hash = await checkSumOfFiles([
		...lambdaFiles,
		// Include this script, so artefact is updated if the way it's built is changed
		fileURLToPath(import.meta.url),
	])

	// Mark it as ES module
	zipfile.addBuffer(
		Buffer.from(
			JSON.stringify({
				type: 'module',
			}),
			'utf-8',
		),
		'package.json',
	)
	progress?.(`added`, 'package.json')

	await new Promise<void>((resolve) => {
		zipfile.outputStream.pipe(createWriteStream(zipFile)).on('close', () => {
			resolve()
		})
		zipfile.end()
	})
	progress?.(`written`, zipFile)

	return { handler: stripCommon(sourceFile), hash }
}

/**
 * @see https://github.com/aws/aws-lambda-nodejs-runtime-interface-client/issues/93#issuecomment-2042201321
 */
export class ImportFromFolderNameError extends Error {
	public readonly folderName: string
	constructor(folderName: string) {
		super(
			`Import from folder with same name as handler ("${folderName}") not allowed!`,
		)
		this.name = 'ImportFromFolderNameError'
		this.folderName = folderName
	}
}
