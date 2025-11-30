import { dynamo, TABLE_NAMES } from "@/lib/aws";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

type PaymentRecord = {
  id: string;
  stripe_payment_status?: string;
  credits_total?: number;
  credits_used?: number;
};

const SUCCESS_STATUS = "succeeded";

const calculateRemaining = (payment?: PaymentRecord | null) => {
  if (!payment) return 0;
  const total = payment.credits_total ?? 0;
  const used = payment.credits_used ?? 0;
  return Math.max(total - used, 0);
};

export const fetchPayment = async (paymentId: string) => {
  const paymentResponse = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAMES.PAYMENTS,
      Key: { id: paymentId },
    }),
  );

  return paymentResponse.Item as PaymentRecord | undefined;
};

export const ensurePaymentHasCredits = (payment?: PaymentRecord) => {
  if (!payment) {
    return { ok: false, reason: "missing_payment", remainingCredits: 0 as const };
  }

  const remainingCredits = calculateRemaining(payment);
  const statusOk = payment.stripe_payment_status === SUCCESS_STATUS;

  return {
    ok: statusOk && remainingCredits > 0,
    reason: statusOk ? (remainingCredits > 0 ? null : "no_credits") : "pending_payment",
    remainingCredits,
  };
};

export const reserveCredit = async (paymentId: string) => {
  const result = await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAMES.PAYMENTS,
      Key: { id: paymentId },
      UpdateExpression: "SET credits_used = if_not_exists(credits_used, :zero) + :inc",
      ConditionExpression:
        "stripe_payment_status = :succeeded AND (attribute_not_exists(credits_used) OR credits_used < credits_total)",
      ExpressionAttributeValues: {
        ":zero": 0,
        ":inc": 1,
        ":succeeded": SUCCESS_STATUS,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  const payment = result.Attributes as PaymentRecord;
  const remainingCredits = calculateRemaining(payment);

  return { payment, remainingCredits };
};

export const requirePaymentId = (paymentId?: string | null) => {
  if (!paymentId) {
    throw new Error("Missing paymentId. Please complete payment to continue.");
  }
  return paymentId;
};
