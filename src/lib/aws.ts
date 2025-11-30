import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const readEnv = (key: string): string | undefined => process.env[key];

const region = readEnv("AWS_REGION") || readEnv("APP_AWS_REGION") || "eu-north-1";

const accessKeyId = readEnv("AWS_ACCESS_KEY_ID") || readEnv("APP_AWS_ACCESS_KEY_ID");
const secretAccessKey = readEnv("AWS_SECRET_ACCESS_KEY") || readEnv("APP_AWS_SECRET_ACCESS_KEY");

const explicitCredentials = accessKeyId && secretAccessKey
    ? { accessKeyId, secretAccessKey }
    : undefined;

const client = new DynamoDBClient({
    region,
    credentials: explicitCredentials ?? defaultProvider(),
});

export const dynamo = DynamoDBDocumentClient.from(client);

export const TABLE_NAMES = {
    USERS: "abs_fixer_users",
    GENERATIONS: "abs_fixer_generations",
    PAYMENTS: "abs_fixer_payments",
    TRAINING_DATA: "generation_training_data",
};
