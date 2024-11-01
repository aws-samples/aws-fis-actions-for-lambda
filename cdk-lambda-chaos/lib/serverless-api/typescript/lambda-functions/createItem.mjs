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
    let body;
    let statusCode = 200;
    const headers = {
      "Content-Type": "application/json",
    };
    const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    if(!item[PRIMARY_KEY]){
        item[PRIMARY_KEY] = "001";
    }    
    try {
        body = await dynamo.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: item
            })
          );
    } catch (err) {
        statusCode = 400;
        body = err.message;
      } finally {
        body = JSON.stringify(body);
      }
    
      return {
        statusCode,
        body,
        headers,
      };
};