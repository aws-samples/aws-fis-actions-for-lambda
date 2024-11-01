import os
import json
import boto3

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    # Retrieve table name and primary key from environment variables
    table_name = os.environ.get('TABLE_NAME')
    primary_key = os.environ.get('PRIMARY_KEY')
    
    if not table_name or not primary_key:
        raise ValueError('TABLE_NAME and PRIMARY_KEY environment variables must be set')
    
    table = dynamodb.Table(table_name)
    
    # Assume the resource path parameter is in the 'pathParameters' key of the event
    try:
        resource_id = event['pathParameters']['id']
    except KeyError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing resource ID'})
        }
    
    # Delete the item from DynamoDB
    try:
        response = table.delete_item(Key={primary_key: resource_id})
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    
    if response['ResponseMetadata']['HTTPStatusCode'] == 200:
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Item deleted successfully'})
        }
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Item not found'})
        }
