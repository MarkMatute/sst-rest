import { BaseItem } from "./base-item";
import { DynamoDB } from "aws-sdk";
import { Table } from "sst/node/table";

// type user|
export interface User extends BaseItem {}

const dynamoDb = new DynamoDB.DocumentClient();

export async function getUserById(userId: string) {
  const results = await dynamoDb
    .get({
      TableName: Table.DigitalWallet.tableName,
      Key: {
        id: userId,
      },
    })
    .promise();
  return results.Item;
}
