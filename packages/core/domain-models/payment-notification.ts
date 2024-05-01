import { BaseItem } from "./base-item";
import z from "zod";
import { DynamoDB } from "aws-sdk";
import { Table } from "sst/node/table";
import { v4 } from "uuid";
import { convertToCents } from "../libs/helper";

const dynamoDb = new DynamoDB.DocumentClient();

// type notification|transaction_id
export interface PaymentNotification extends BaseItem {
  description: string;
  transactionType: "deposit" | "withdraw";
  type_method: "npp_payin";
  state: "successful" | "failed";
  user_id: string;
  user_name: string;
  amount: number;
  currency: string;
  debit_credit: "debit" | "credit";
}

export const paymentNotificationSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: z.enum(["deposit", "withdraw"]),
  type_method: z.string(),
  state: z.enum(["successful", "failed"]),
  user_id: z.string().uuid(),
  user_name: z.string(),
  amount: z.preprocess(Number, z.number()),
  currency: z.string(),
  debit_credit: z.enum(["debit", "credit"]),
  created_at: z.string(),
  updated_at: z.string(),
});

type CreatePaymentNotificationParams = z.infer<
  typeof paymentNotificationSchema
>;

export async function createPaymentNotification(
  params: CreatePaymentNotificationParams
) {
  const paymentNotification = paymentNotificationSchema.parse(params);
  const {
    description,
    user_id,
    created_at,
    updated_at,
    type: transactionType,
    type_method,
    state,
    user_name,
    amount,
    currency,
    debit_credit,
  } = paymentNotification;
  const id = v4();
  const createdPaymentNotification = await dynamoDb
    .put({
      TableName: Table.DigitalWallet.tableName,
      Item: {
        id,
        gsi1: "payment-notification",
        type: `payment-notification|${user_id}`,
        description,
        transactionType,
        type_method,
        state,
        user_id,
        user_name,
        amount: convertToCents(amount),
        currency,
        debit_credit,
        createdAt: created_at,
        updatedAt: updated_at,
      },
    })
    .promise();
  return createdPaymentNotification;
}

export async function getTransactionsByUserId(userId: string) {
  const results = await dynamoDb
    .query({
      TableName: Table.DigitalWallet.tableName,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1 = :gsiValue AND #type = :typeValue",
      ExpressionAttributeValues: {
        ":gsiValue": "payment-notification",
        ":typeValue": `payment-notification|${userId}`,
      },
      ExpressionAttributeNames: {
        "#type": "type",
      },
    })
    .promise();
  if (results.Items) {
    return results.Items;
  }
  return [];
}