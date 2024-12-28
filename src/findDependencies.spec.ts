import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { URL } from 'node:url'
import { findDependencies } from './findDependencies.ts'

const __dirname = new URL('.', import.meta.url).pathname

void describe('findDependencies()', () => {
	void it('should return a list of external dependencies', () => {
		const { packages } = findDependencies({
			sourceFilePath: path.join(__dirname, '..', 'cdk', 'lambda.ts'),
		})
		assert.equal(
			packages.has('id128'),
			true,
			"Should include the 'id128' package",
		)
		assert.equal(
			packages.has('aws-lambda'),
			false,
			"Should not include the type-only 'aws-lambda' package",
		)
		assert.equal(
			packages.has('node:crypto'),
			false,
			'Should not include built-in node dependencies',
		)
		assert.equal(
			packages.has('fp-ts'),
			true,
			'Should include the top-level package only',
		)
		assert.equal(
			packages.has('@aws-sdk/client-dynamodb'),
			false,
			'Should not include AWS SDK packages',
		)
	})

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
			'#foo': './foo/index.ts',
			'#foo/*': './foo/*',
		})
	})
})
