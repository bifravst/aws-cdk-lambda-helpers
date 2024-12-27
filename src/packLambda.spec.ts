import assert from 'node:assert'
import fs from 'node:fs/promises'
import os from 'node:os'
import path, { dirname } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { packLambda } from './packLambda.ts'
import { getFileFromZip } from './test/getFileFromZip.ts'

const tmpDir = os.tmpdir()

await describe('packLambda()', async () => {
	await it('should convert .ts imports to .js', async () => {
		const zipFilePath = path.join(
			await fs.mkdtemp(`${tmpDir}${path.sep}`),
			'resolve-paths.zip',
		)
		await packLambda({
			sourceFilePath: path.join(
				dirname(fileURLToPath(import.meta.url)),
				'test-data',
				'resolve-paths',
				'lambda.ts',
			),
			tsConfigFilePath: path.join(
				dirname(fileURLToPath(import.meta.url)),
				'test-data',
				'resolve-paths',
				'tsconfig.json',
			),
			zipFilePath,
		})

		const handler = await getFileFromZip(zipFilePath, 'lambda.js')
		assert.equal(
			handler.includes(`import { foo2 } from '#foo/2.js'`),
			true,
			'The import should be converted to .js',
		)

		await assert.doesNotReject(
			getFileFromZip(zipFilePath, 'foo/2.js'),
			'The ZIP file should contain the imported file',
		)
	})
})
