import {
	type CloudFormationClient,
	paginateListStackResources,
	type StackResourceSummary,
} from '@aws-sdk/client-cloudformation'
import {
	GetFunctionCommand,
	type LambdaClient,
	LastUpdateStatus,
	TagResourceCommand,
	UpdateFunctionCodeCommand,
	UpdateFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import pRetry from 'p-retry'
import type { PackedLambda } from './packLambda.ts'

const updateLambda =
	({
		lambda,
		packs,
		debug,
		forceUpdate,
	}: {
		lambda: LambdaClient
		packs: Record<string, PackedLambda>
		forceUpdate?: true
		debug?: typeof console.debug
	}) =>
	async (lambdaResource: StackResourceSummary) => {
		const info = await lambda.send(
			new GetFunctionCommand({
				FunctionName: lambdaResource.PhysicalResourceId,
			}),
		)
		const packed = Object.values(packs).find(
			(p) => p.id === info.Tags?.['packedLambda:id'],
		)
		if (packed === undefined) {
			debug?.(`[${info.Tags?.['packedLambda:id']}]`, 'No pack found for lambda')
			return
		}
		debug?.(`[${packed.id}]`, 'found pack')

		if ((forceUpdate ?? false) === false) {
			if (packed.hash === info.Tags?.['packedLambda:hash']) {
				debug?.(`[${packed.id}]`, 'No update needed')
				return
			}
		}

		if (packed.hash !== info.Tags?.['packedLambda:hash']) {
			debug?.(`[${packed.id}]`, 'Updating lambda')
		}

		const updateResult = await lambda.send(
			new UpdateFunctionCodeCommand({
				FunctionName: lambdaResource.PhysicalResourceId,
				ZipFile: new Uint8Array(await readFile(packed.zipFilePath)),
			}),
		)

		debug?.(`[${packed.id}]`, 'RevisionId', updateResult.RevisionId)
		debug?.(`[${packed.id}]`, 'CodeSha256', updateResult.CodeSha256)

		await pRetry(
			async () => {
				const updateStatus = (
					await lambda.send(
						new GetFunctionCommand({
							FunctionName: lambdaResource.PhysicalResourceId,
						}),
					)
				).Configuration?.LastUpdateStatus
				assert.equal(
					updateStatus,
					LastUpdateStatus.Successful,
					`Lambda update should have succeeded, got ${updateStatus}`,
				)
			},
			{
				minTimeout: 1000,
				maxTimeout: 1000,
				retries: 10,
			},
		)

		debug?.(`[${packed.id}]`, `updating config to trigger reload ...`)

		await Promise.all([
			lambda.send(
				new UpdateFunctionConfigurationCommand({
					FunctionName: lambdaResource.PhysicalResourceId,
					Environment: {
						Variables: {
							...info.Configuration?.Environment?.Variables,
							PACKED_LAMBDA_HASH: packed.hash,
						},
					},
				}),
			),
			lambda.send(
				new TagResourceCommand({
					Resource: info.Configuration!.FunctionArn,
					Tags: {
						'packedLambda:hash': packed.hash,
					},
				}),
			),
		])
	}

export const updateLambdaCode =
	({ cf, lambda }: { cf: CloudFormationClient; lambda: LambdaClient }) =>
	async (
		stackName: string,
		packedLambdas: Record<string, PackedLambda>,
		debug?: (...args: Array<any>) => void,
	): Promise<void> => {
		const u = updateLambda({
			lambda,
			packs: packedLambdas,
			debug,
		})
		const p: Array<Promise<void>> = []

		for await (const page of paginateListStackResources(
			{ client: cf },
			{
				StackName: stackName,
			},
		)) {
			p.push(
				...((page.StackResourceSummaries ?? [])
					.filter(
						(resource) => resource.ResourceType === 'AWS::Lambda::Function',
					)
					.map(u) ?? []),
			)
		}

		await Promise.all(p)
	}
