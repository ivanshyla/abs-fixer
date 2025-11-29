import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || process.env.APP_AWS_REGION || "eu-north-1";

const explicitCredentials =
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : (process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY)
            ? {
                accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
            }
            : undefined;

const client = new DynamoDBClient({
    region,
    ...(explicitCredentials ? { credentials: explicitCredentials } : {}),
});

export const dynamo = DynamoDBDocumentClient.from(client);

export const TABLE_NAMES = {
    USERS: "abs_fixer_users",
    GENERATIONS: "abs_fixer_generations",
    PAYMENTS: "abs_fixer_payments",
    TRAINING_DATA: "generation_training_data",
};
