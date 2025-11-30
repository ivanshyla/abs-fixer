import { runtimeSecrets } from "@/runtime/secrets.generated";

type SecretKey = keyof typeof runtimeSecrets;

const applyIfMissing = (key: string, value?: string) => {
    if (!process.env[key] && value) {
        process.env[key] = value;
    }
};

export const ensureServerEnv = () => {
    applyIfMissing("APP_AWS_ACCESS_KEY_ID", runtimeSecrets.APP_AWS_ACCESS_KEY_ID);
    applyIfMissing("APP_AWS_SECRET_ACCESS_KEY", runtimeSecrets.APP_AWS_SECRET_ACCESS_KEY);
    applyIfMissing("APP_AWS_REGION", runtimeSecrets.APP_AWS_REGION);

    applyIfMissing("AWS_ACCESS_KEY_ID", process.env.APP_AWS_ACCESS_KEY_ID);
    applyIfMissing("AWS_SECRET_ACCESS_KEY", process.env.APP_AWS_SECRET_ACCESS_KEY);
    applyIfMissing("AWS_REGION", process.env.APP_AWS_REGION);

    applyIfMissing("STRIPE_SECRET_KEY", runtimeSecrets.STRIPE_SECRET_KEY);
    applyIfMissing("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", runtimeSecrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    applyIfMissing("STRIPE_WEBHOOK_SECRET", runtimeSecrets.STRIPE_WEBHOOK_SECRET);
};

ensureServerEnv();

export const getRuntimeSecret = (key: SecretKey) => runtimeSecrets[key];

