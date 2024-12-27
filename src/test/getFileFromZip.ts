import fs from 'node:fs'
import unzip, { type Entry } from 'unzip-stream'

export const getFileFromZip = async (
	zipFilePath: string,
	filename: string,
): Promise<string> => {
	let found = false
	let content = ''
	await new Promise<void>((resolve, reject) => {
		fs.createReadStream(zipFilePath)
			.pipe(unzip.Parse())
			.on('entry', (entry: Entry) => {
				if (entry.path === filename) {
					found = true
					entry.on('data', (data) => (content += data))
				} else {
					entry.autodrain()
				}
			})
			.on('error', reject)
			.on('end', resolve)
	})
	if (!found) {
		throw new Error(`File not found in zip: ${filename}`)
	}
	return content
}
