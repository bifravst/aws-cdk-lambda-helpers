import pJson from '../package.json' with { type: 'json' }
import { packLayer, type PackedLayer } from '../src/layer.ts'

const dependencies: Array<
	keyof (typeof pJson)['devDependencies'] | keyof (typeof pJson)['dependencies']
> = ['id128', 'fp-ts']

export const pack = async (): Promise<PackedLayer> =>
	packLayer({
		id: 'baseLayer',
		dependencies,
	})
