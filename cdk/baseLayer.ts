import { packLayer, type PackedLayer } from '../src/layer.js'
import pJson from '../package.json'

const dependencies: Array<
	keyof (typeof pJson)['devDependencies'] | keyof (typeof pJson)['dependencies']
> = ['id128']

export const pack = async (): Promise<PackedLayer> =>
	packLayer({
		id: 'baseLayer',
		dependencies,
	})