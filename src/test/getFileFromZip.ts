import fs from 'node:fs'
import unzip, { type Entry } from 'unzip-stream'

/**
 * Resolves once the matching entry has been fully read.
 *
 * Note: the parser's `end` event fires once the archive has been parsed, which
 * can be before the (inflated) data of the last entries has been emitted, so
 * we must wait for the entry's own `end` event.
 */
export const getFileFromZip = async (
	zipFilePath: string,
	filename: string,
): Promise<string> =>
	new Promise<string>((resolve, reject) => {
		let found = false
		fs.createReadStream(zipFilePath)
			.pipe(unzip.Parse())
			.on('entry', (entry: Entry) => {
				if (entry.path !== filename) {
					entry.autodrain()
					return
				}
				found = true
				const chunks: Buffer[] = []
				entry
					.on('data', (chunk: Buffer) => chunks.push(chunk))
					.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
					.on('error', reject)
			})
			.on('error', reject)
			.on('end', () => {
				if (!found) reject(new Error(`File not found in zip: ${filename}`))
			})
	})
