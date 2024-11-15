import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import type { APIGatewayProxyResultV2 } from 'aws-lambda'
import { isLeft, left } from 'fp-ts/lib/Either.js'
import id128 from 'id128'
import { randomUUID } from 'node:crypto'

void new DynamoDBClient({})

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
	console.log(randomUUID())
	void isLeft(left('foo'))

	return {
		statusCode: 201,
		body: id128.Ulid.generate().toCanonical(),
	}
}
