import { spawn } from 'child_process'
import { createWriteStream } from 'fs'
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { glob } from 'glob'
import path from 'path'
import { ZipFile } from 'yazl'
import { checkSumOfFiles, checkSumOfStrings } from './checksumOfFiles.js'
import { fileURLToPath } from 'node:url'

export type PackedLayer = { layerZipFile: string; hash: string }

export const packLayer = async ({
	id,
	dependencies,
	baseDir,
	distDir,
	installCommand,
}: {
	id: string
	dependencies: string[]
	/**
	 * @default process.cwd()
	 */
	baseDir?: string
	/**
	 * @default ${baseDir}/dist/layers
	 */
	distDir?: string
	/**
	 * Returns the command to run, the first element is the command (e.g. `npm`) and the rest are its arguments.
	 */
	installCommand?: (args: {
		packageFile: string
		packageLockFile: string
	}) => [string, ...Array<string>]
}): Promise<PackedLayer> => {
	const base = baseDir ?? process.cwd()
	const dist = distDir ?? path.join(base, 'dist', 'layers')
	const packageJsonFile = path.join(base, 'package.json')
	const packageLockJsonFile = path.join(base, 'package-lock.json')
	const { dependencies: deps, devDependencies: devDeps } = JSON.parse(
		await readFile(packageJsonFile, 'utf-8'),
	)

	const layerDir = path.join(dist, id)
	const nodejsDir = path.join(layerDir, 'nodejs')

	try {
		await rm(layerDir, { recursive: true })
	} catch {
		// Folder does not exist.
	}

	await mkdir(nodejsDir, { recursive: true })

	const depsToBeInstalled = dependencies.reduce(
		(resolved, dep) => {
			const resolvedDependency = deps[dep] ?? devDeps[dep]
			if (resolvedDependency === undefined)
				throw new Error(
					`Could not resolve dependency "${dep}" in ${packageJsonFile}!`,
				)
			return {
				...resolved,
				[dep]: resolvedDependency,
			}
		},
		{} as Record<string, string>,
	)

	const checkSumFiles = [
		// Include this script, so artefact is updated if the way it's built is changed
		fileURLToPath(import.meta.url),
	]

	const packageJSON = path.join(nodejsDir, 'package.json')
	await writeFile(
		packageJSON,
		JSON.stringify({
			dependencies: depsToBeInstalled,
		}),
		'utf-8',
	)
	checkSumFiles.push(packageJSON)

	let hasLockFile = true
	try {
		// package-lock.json may not exist
		await stat(packageLockJsonFile)
		const packageLock = path.join(nodejsDir, 'package-lock.json')
		await copyFile(packageLockJsonFile, packageLock)
		checkSumFiles.push(packageLock)
	} catch {
		hasLockFile = false
		// pass
	}

	await new Promise<void>((resolve, reject) => {
		const [cmd, ...args] = installCommand?.({
			packageFile: packageJSON,
			packageLockFile: packageLockJsonFile,
		}) ?? [
			'npm',
			hasLockFile ? 'ci' : 'i',
			'--ignore-scripts',
			'--only=prod',
			'--no-audit',
		]
		const p = spawn(cmd, args, {
			cwd: nodejsDir,
		})
		p.on('close', (code) => {
			if (code !== 0) {
				const msg = `${cmd} ${args.join(
					' ',
				)} in ${nodejsDir} exited with code ${code}.`
				return reject(new Error(msg))
			}
			return resolve()
		})
	})

	const filesToAdd = await glob(`**`, {
		cwd: layerDir,
		nodir: true,
	})
	const zipfile = new ZipFile()
	filesToAdd.forEach((f) => {
		zipfile.addFile(path.join(layerDir, f), f)
	})

	const zipFileName = await new Promise<string>((resolve) => {
		const zipFileName = path.join(dist, `${id}.zip`)
		zipfile.outputStream
			.pipe(createWriteStream(zipFileName))
			.on('close', () => {
				resolve(zipFileName)
			})
		zipfile.end()
	})

	return {
		layerZipFile: zipFileName,
		hash: checkSumOfStrings([
			JSON.stringify(dependencies),
			await checkSumOfFiles(checkSumFiles),
		]),
	}
}
