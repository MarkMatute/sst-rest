import { BaseItem } from "./base-item";
import { DynamoDB } from "aws-sdk";
import { Table } from "sst/node/table";
import { v4 } from "uuid";

// type wallet|user_id
export interface Wallet extends BaseItem {
  balance: number;
}

const dynamoDb = new DynamoDB.DocumentClient();

export async function getWalletByUserId(userId: string) {
  const results = await dynamoDb
    .query({
      TableName: Table.DigitalWallet.tableName,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1 = :gsiValue AND #type = :typeValue",
      ExpressionAttributeValues: {
        ":gsiValue": "wallet",
        ":typeValue": `wallet|${userId}`,
      },
      ExpressionAttributeNames: {
        "#type": "type",
      },
      Limit: 1,
    })
    .promise();
  if (results.Items) {
    return results.Items[0];
  }
  return null;
}

export async function createWalletForUser(userId: string) {
  const id = v4();
  const params = {
    TableName: Table.DigitalWallet.tableName,
    Item: {
      id,
      gsi1: "wallet",
      type: `wallet|${userId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      amount: 0,
      balance: 0,
    },
  };
  await dynamoDb.put(params).promise();
  const wallet = await getWalletByUserId(userId);
  return wallet;
}

export async function creditAmountToUserWallet(wallet: Wallet, amountInCents: number) {
    const { id, balance = 0 } = wallet;
    const newBalance = balance + amountInCents;

    const params = {
        TableName: Table.DigitalWallet.tableName,
        Key: {
          "id": id
        },
        UpdateExpression: "SET #balance = :balance", 
        ExpressionAttributeNames: {
          "#balance": 'balance',
        },
        ExpressionAttributeValues: {
          ":balance": newBalance
        },
        ReturnValues: "ALL_NEW"
      };
      const result = await dynamoDb.update(params).promise();
      return result.$response;
}
