/*
 * Compile source for NPM
 */

import swc from '@swc/core'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { updateImports } from '../src/updateImports.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const outDir = path.resolve(__dirname, '..', 'npm')

try {
	rmSync(outDir, { recursive: true })
} catch {
	// pass
}

for await (const file of glob('src/*.ts')) {
	let compiled = (
		await swc.transformFile(file, {
			jsc: {
				parser: {
					syntax: 'typescript',
				},
				target: 'es2024',
			},
			module: {
				type: 'es6',
			},
		})
	).code

	compiled = updateImports(compiled)

	const targetFile = path.join(outDir, file.replace(/\.ts$/, '.js'))

	mkdirSync(dirname(targetFile), { recursive: true })

	writeFileSync(targetFile, compiled, 'utf8')

	console.log(file)
}
