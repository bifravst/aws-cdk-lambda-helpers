import assert from 'node:assert'
import fs from 'node:fs/promises'
import os from 'node:os'
import path, { dirname } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { packLayer } from './packLayer.ts'
import { getFileFromZip } from './test/getFileFromZip.ts'

const tmpDir = os.tmpdir()

await describe('packLayer()', async () => {
	await it('should include a .npmrc file if present', async () => {
		const distDir = path.join(await fs.mkdtemp(`${tmpDir}${path.sep}`), 'jsr')
		const layer = await packLayer({
			baseDir: path.join(
				dirname(fileURLToPath(import.meta.url)),
				'test-data',
				'jsr',
			),
			distDir,
			id: 'jsr-layer',
			dependencies: ['@nrfcloud/wait-for-it'],
		})

		const npmrc = await getFileFromZip(layer.layerZipFilePath, 'nodejs/.npmrc')
		assert.equal(
			npmrc.includes(`@jsr:registry=https://npm.jsr.io`),
			true,
			'The .npmrc file should contain the JSR registry',
		)
	})
})
