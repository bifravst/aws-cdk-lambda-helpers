import { AssetHashType, aws_lambda as Lambda } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import type { PackedLambda } from './packLambda.ts'

export class LambdaSource extends Construct {
	public readonly code: Lambda.AssetCode
	constructor(
		parent: Construct,
		packedLambda: Pick<PackedLambda, 'zipFilePath' | 'id' | 'hash'>,
	) {
		super(parent, `${packedLambda.id}Source`)

		this.code = Lambda.Code.fromAsset(packedLambda.zipFilePath, {
			assetHash: packedLambda.hash,
			assetHashType: AssetHashType.CUSTOM,
		})
	}
}
