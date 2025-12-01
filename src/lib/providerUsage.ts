import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLE_NAMES } from "@/lib/aws";

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

export async function recordProviderUsage(provider: string, amount = 1) {
  if (!TABLE_NAMES.PROVIDER_USAGE) {
    return;
  }

  const period = getCurrentPeriod();

  try {
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAMES.PROVIDER_USAGE,
      Key: { provider, period },
      UpdateExpression: "SET updated_at = :updatedAt ADD usage_count :amount",
      ExpressionAttributeValues: {
        ":updatedAt": new Date().toISOString(),
        ":amount": amount,
      },
    }));
  } catch (error) {
    console.error("Failed to record provider usage", provider, error);
  }
}

