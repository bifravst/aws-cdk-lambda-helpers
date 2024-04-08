import assert from 'node:assert/strict'
import { it, describe } from 'node:test'
import { ImportFromFolderNameError, packLambda } from './packLambda.js'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import os from 'node:os'

const tmpDir = os.tmpdir()

void describe('packLambda()', () => {
	// See https://github.com/aws/aws-lambda-nodejs-runtime-interface-client/issues/93#issuecomment-2042201321
	void it('should fail if it imports from a folder on the same level that has the same name as the handler module', async () =>
		assert.rejects(
			async () =>
				packLambda({
					sourceFile: path.join(
						dirname(fileURLToPath(import.meta.url)),
						'test-data',
						'module-folder-named-like-handler-bug',
						'same-level',
						'acme.ts',
					),
					zipFile: path.join(
						await fs.mkdtemp(`${tmpDir}${path.sep}`),
						'acme.zip',
					),
				}),
			ImportFromFolderNameError,
		))

	void it('should not fail if it a folder with the same name is on a different level', async () =>
		assert.doesNotReject(async () =>
			packLambda({
				sourceFile: path.join(
					dirname(fileURLToPath(import.meta.url)),
					'test-data',
					'module-folder-named-like-handler-bug',
					'different-level',
					'lambda',
					'acme.ts',
				),
				zipFile: path.join(
					await fs.mkdtemp(`${tmpDir}${path.sep}`),
					'acme.zip',
				),
			}),
		))
})
