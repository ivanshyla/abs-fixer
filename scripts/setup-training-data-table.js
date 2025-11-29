const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { CreateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

async function createTrainingDataTable() {
    const params = {
        TableName: "generation_training_data",
        KeySchema: [
            { AttributeName: "id", KeyType: "HASH" }, // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
        ],
        BillingMode: "PAY_PER_REQUEST", // On-demand pricing
        Tags: [
            {
                Key: "Purpose",
                Value: "ML Training Dataset",
            },
            {
                Key: "Project",
                Value: "ABS Fixer",
            },
        ],
    };

    try {
        const command = new CreateTableCommand(params);
        const response = await client.send(command);
        console.log("✅ Training data table created successfully!");
        console.log("Table ARN:", response.TableDescription.TableArn);
        console.log("Table Status:", response.TableDescription.TableStatus);
    } catch (error) {
        if (error.name === "ResourceInUseException") {
            console.log("ℹ️  Table already exists");
        } else {
            console.error("❌ Error creating table:", error);
            throw error;
        }
    }
}

createTrainingDataTable()
    .then(() => {
        console.log("\n✅ Setup complete!");
        console.log("\nNext steps:");
        console.log("1. Update IAM role to grant access to this table");
        console.log("2. Deploy the application");
        console.log("3. Test feedback collection");
        console.log("4. Check analytics endpoint with API key");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Setup failed:", error);
        process.exit(1);
    });
