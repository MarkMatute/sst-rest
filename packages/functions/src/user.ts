import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { errorHandler } from "./error-handler";
import z from "zod";
import { getWalletByUserId } from "../../core/domain-models/wallet";
import { getTransactionsByUserId } from "../../core/domain-models/payment-notification";

export const wallet: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  try {
    const { userId } = z
      .object({
        userId: z.string(),
      })
      .parse(event.pathParameters);

    const wallet = await getWalletByUserId(userId);
    if (!wallet) {
      return {
        statusCode: 404,
        body: "Wallet not found.",
      };
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(wallet),
    };
  } catch (error) {
    return errorHandler(error);
  }
};

export const transactions: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  try {
    const { userId } = z
      .object({
        userId: z.string(),
      })
      .parse(event.pathParameters);

    const transactions = await getTransactionsByUserId(userId);
    if (!transactions) {
      return {
        statusCode: 404,
        body: "Transactions not found.",
      };
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(transactions),
    };
  } catch (error) {
    return errorHandler(error);
  }
};
