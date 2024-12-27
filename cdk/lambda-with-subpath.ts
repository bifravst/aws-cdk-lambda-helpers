import { foo } from '#lib'
import { foo2 } from '#lib/2.ts'
import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export const handler = async (): Promise<APIGatewayProxyResultV2> => ({
	statusCode: 201,
	body: (foo() + foo2()).toString(),
})
