import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export const handler = async (): Promise<APIGatewayProxyResultV2> => ({
	statusCode: 200,
	body: 'UPDATED',
})
