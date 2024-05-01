import { Api, Table, StackContext, Queue } from "sst/constructs";

export function MainStack({ stack }: StackContext) {
  // DynamoDB
  const table = new Table(stack, "DigitalWallet", {
    // TODO: Improvement on how to sync the models
    fields: {
      // common
      gsi1: "string",
      id: "string",
      type: "string",
      createdAt: "string",
      updatedAt: "string",

      // payment notification
      description: "string",
      transactionType: "string",
      type_method: "string",
      state: "string",
      user_id: "string",
      user_name: "string",
      // amount
      currency: "string",
      debit_credit: "string",

      // transaction
      amount: "number",

      // wallet
      balance: "number",
    },
    primaryIndex: {
      partitionKey: "id",
    },
    globalIndexes: {
      gsi1: {
        partitionKey: "gsi1",
        sortKey: "type",
      },
    },
  });

  // Queue
  const queue = new Queue(stack, "PaymentNotificationQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/wallet.webhookConsumer",
        bind: [table],
      },
    },
  });

  // API Gateway
  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        bind: [table, queue],
      },
    },
    routes: {
      "POST /wallet/webhook": "packages/functions/src/wallet.webhookProducer",
      "GET /user/{userId}/wallet": "packages/functions/src/user.wallet",
      "GET /user/{userId}/transactions":
        "packages/functions/src/user.transactions",
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
