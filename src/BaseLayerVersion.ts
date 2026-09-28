import { aws_lambda as Lambda, Stack } from 'aws-cdk-lib'
import type { ILayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { LambdaSource } from './LambdaSource.ts'
import type { PackedLayer } from './packLayer.ts'

export class BaseLayerVersion extends Construct {
	public readonly layerVersion: ILayerVersion
	constructor(scope: Construct, baseLayer: PackedLayer) {
		super(scope, BaseLayerVersion.name)

		this.layerVersion = new Lambda.LayerVersion(this, 'baseLayer', {
			layerVersionName: `${Stack.of(this).stackName}-baseLayer`,
			code: new LambdaSource(this, {
				id: 'baseLayer',
				zipFilePath: baseLayer.layerZipFilePath,
				hash: baseLayer.hash,
			}).code,
			compatibleArchitectures: [Lambda.Architecture.ARM_64],
			compatibleRuntimes: [Lambda.Runtime.NODEJS_24_X],
		})
	}
}
