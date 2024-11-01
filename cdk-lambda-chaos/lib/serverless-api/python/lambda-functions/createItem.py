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
    
    # Assume the JSON payload is in the 'body' key of the event
    try:
        payload = json.loads(event['body'])
    except (KeyError, json.JSONDecodeError):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON payload'})
        }
    
    # Check if the primary key is present in the payload
    if primary_key not in payload:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Missing primary key: {primary_key}'})
        }
    
    # Write the payload to DynamoDB
    try:
        table.put_item(Item=payload)
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Item saved successfully'})
    }
