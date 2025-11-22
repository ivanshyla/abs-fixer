const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const TABLES = [
    {
        TableName: "abs_fixer_users",
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }], // id = email
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        BillingMode: "PAY_PER_REQUEST",
    },
    {
        TableName: "abs_fixer_generations",
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "user_id", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "user_id-index",
                KeySchema: [{ AttributeName: "user_id", KeyType: "HASH" }],
                Projection: { ProjectionType: "ALL" },
            },
        ],
        BillingMode: "PAY_PER_REQUEST",
    },
    {
        TableName: "abs_fixer_payments",
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "user_id", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "user_id-index",
                KeySchema: [{ AttributeName: "user_id", KeyType: "HASH" }],
                Projection: { ProjectionType: "ALL" },
            },
        ],
        BillingMode: "PAY_PER_REQUEST",
    },
];

async function setup() {
    try {
        const { TableNames } = await client.send(new ListTablesCommand({}));
        console.log("Existing tables:", TableNames);

        for (const tableConfig of TABLES) {
            if (TableNames.includes(tableConfig.TableName)) {
                console.log(`Table ${tableConfig.TableName} already exists.`);
            } else {
                console.log(`Creating table ${tableConfig.TableName}...`);
                await client.send(new CreateTableCommand(tableConfig));
                console.log(`Table ${tableConfig.TableName} created.`);
            }
        }
        console.log("Setup complete.");
    } catch (err) {
        console.error("Error setting up DynamoDB:", err);
    }
}

setup();
