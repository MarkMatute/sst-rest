import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  SQSEvent,
} from "aws-lambda";
import {
  createPaymentNotification,
  paymentNotificationSchema,
} from "../../core/domain-models/payment-notification";
import { getUserById } from "../../core/domain-models/user";
import {
  Wallet,
  createWalletForUser,
  creditAmountToUserWallet,
  getWalletByUserId,
} from "../../core/domain-models/wallet";
import { convertToCents } from "../../core/libs/helper";
import { errorHandler } from "./error-handler";
import z from "zod";
import AWS from "aws-sdk";
import { Queue } from "sst/node/queue";
import crypto from "crypto";
import dotenv from 'dotenv';
dotenv.config();

const sqs = new AWS.SQS();

const webhookBodySchema = z.object({
  transactions: z.array(paymentNotificationSchema),
});

export const webhookProducer: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {

  // HMAC auth
  const { authorization } = event.headers;
  const splitAuth = authorization?.split(" ");

  if (!splitAuth || splitAuth.length < 2) {
    return {
      statusCode: 401,
      body: "Authentication failed",
    };
  }
  const signature = splitAuth[1];

  const generatedSignature = crypto
    .createHmac("sha256", process.env.HMAC_SECRET || 'DEFAULT_SECRET')
    .update(JSON.stringify(JSON.parse(event.body!)))
    .digest("hex");

  if (signature !== generatedSignature) {
    return {
      statusCode: 401,
      body: "Authentication failed",
    };
  }

  try {
    const body = webhookBodySchema.parse(JSON.parse(event.body!));

    const { transactions } = body;

    const Entries = transactions.map((paymentNotification) => ({
      Id: paymentNotification.id,
      MessageBody: JSON.stringify(paymentNotification),
      MessageAttributes: {
        VisibilityTimeout: {
          DataType: "Number",
          StringValue: "300",
        },
      },
    }));

    await sqs
      .sendMessageBatch({
        QueueUrl: Queue.PaymentNotificationQueue.queueUrl,
        Entries,
      })
      .promise();

    return {
      statusCode: 204,
      headers: {
        "content-type": "application/json",
      },
    };
  } catch (error) {
    return errorHandler(error);
  }
};

const processPaymentNotification = async (
  paymentNotification: z.infer<typeof paymentNotificationSchema>
) => {
  const { user_id, state, amount, type } = paymentNotification;

  // get user
  const user = await getUserById(user_id);
  if (!user) {
    throw Error("User not found.");
  }

  // create payment notification
  await createPaymentNotification(paymentNotification);

  if (state === "successful" && type === 'deposit' ) {
    // get user wallet
    let wallet = await getWalletByUserId(user_id);
    if (!wallet) {
      wallet = await createWalletForUser(user_id);
    }

    // credit amount to wallet
    await creditAmountToUserWallet(wallet as Wallet, convertToCents(amount));
  }
};

export const webhookConsumer = async (event: SQSEvent) => {
  const records: any[] = event.Records;
  const failedItemIds = [];
  for (const record of records) {
    try {
      await processPaymentNotification(JSON.parse(record.body));
    } catch (error) {
      console.log(error);
      failedItemIds.push(record.messageId);
    }
  }
  // TODO: track failures
  console.log(failedItemIds, "failedItemIds");
  return {
    failedItemIds,
  };
};
