import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { URL } from 'node:url'
import { findDependencies } from './findDependencies.js'

const __dirname = new URL('.', import.meta.url).pathname

void describe('findDependencies()', () => {
	void it('should honor tsconfig.json paths', () => {
		const { dependencies } = findDependencies({
			sourceFilePath: path.join(
				__dirname,
				'test-data',
				'resolve-paths',
				'lambda.ts',
			),
			tsConfigFilePath: path.join(
				__dirname,
				'test-data',
				'resolve-paths',
				'tsconfig.json',
			),
		})
		assert.equal(
			dependencies.includes(
				path.join(__dirname, 'test-data', 'resolve-paths', 'foo', 'index.ts'),
			),
			true,
			'Should include the index.ts file',
		)
		assert.equal(
			dependencies.includes(
				path.join(__dirname, 'test-data', 'resolve-paths', 'foo', '1.ts'),
			),
			true,
			'Should include the module referenced in the index.ts file',
		)
		assert.equal(
			dependencies.includes(
				path.join(__dirname, 'test-data', 'resolve-paths', 'foo', '2.ts'),
			),
			true,
			'Should include the module file',
		)
	})

	void it('should return an import map', () => {
		const { importsSubpathPatterns } = findDependencies({
			sourceFilePath: path.join(
				__dirname,
				'test-data',
				'resolve-paths',
				'lambda.ts',
			),
			tsConfigFilePath: path.join(
				__dirname,
				'test-data',
				'resolve-paths',
				'tsconfig.json',
			),
		})

		assert.deepEqual(importsSubpathPatterns, {
			'#foo': './foo/index.js',
			'#foo/*': './foo/*',
		})
	})
})
