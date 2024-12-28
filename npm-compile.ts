/*
 * Compile source for NPM
 */

import swc from '@swc/core'
import { glob } from 'glob'
import { mkdirSync, writeFileSync } from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { updateImports } from './src/updateImports.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

for (const file of glob.sync('src/**/*.ts')) {
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

	const targetFile = path.join(__dirname, 'dist', file.replace(/\.ts$/, '.js'))

	mkdirSync(dirname(targetFile), { recursive: true })

	writeFileSync(targetFile, compiled, 'utf8')

	console.log(file)
}
