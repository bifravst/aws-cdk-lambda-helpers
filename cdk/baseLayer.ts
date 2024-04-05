import { packLayer, type PackedLayer } from '../src/layer.js'

export const pack = async (): Promise<PackedLayer> =>
	packLayer({
		id: 'baseLayer',
		dependencies: ['id128'],
	})
