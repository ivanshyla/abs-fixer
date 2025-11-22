import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.APP_AWS_REGION || "eu-north-1",
    credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
    },
});

export const dynamo = DynamoDBDocumentClient.from(client);

export const TABLE_NAMES = {
    USERS: "abs_fixer_users",
    GENERATIONS: "abs_fixer_generations",
    PAYMENTS: "abs_fixer_payments",
};
