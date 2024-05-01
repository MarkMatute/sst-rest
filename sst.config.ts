import { SSTConfig } from "sst";
import { MainStack } from "./stacks/MainStack";

export default {
  config(_input) {
    return {
      name: "valorem-wallet-api",
      region: "ap-southeast-1",
    };
  },
  stacks(app) {
    app.setDefaultRemovalPolicy("destroy");
    app.stack(MainStack);
  },
} satisfies SSTConfig;
