import type { APIGatewayProxyResultV2 } from 'aws-lambda'
import id128 from 'id128'

export const handler = async (): Promise<APIGatewayProxyResultV2> => ({
	statusCode: 201,
	body: id128.Ulid.generate().toCanonical(),
})
