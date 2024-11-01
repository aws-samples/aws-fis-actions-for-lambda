import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'Orders';
const PRIMARY_KEY = process.env.PRIMARY_KEY || 'Id';

export const handler = async (event, context) => {
    const requestedItemId = event.pathParameters.id;
    if (!requestedItemId) {
      return { statusCode: 400, body: `Error: You are missing the path parameter id` };
    }
    try {
      const data = await dynamo.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            [PRIMARY_KEY]: requestedItemId
          }
        })
      );
      return { statusCode: 200, body: JSON.stringify(data) };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: JSON.stringify(err) };
    }
  
}