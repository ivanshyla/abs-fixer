const applyIfMissing = (targetKey: string, ...fallbackKeys: string[]) => {
    if (process.env[targetKey]) {
        return;
    }

    for (const fallbackKey of fallbackKeys) {
        const fallbackValue = process.env[fallbackKey];
        if (fallbackValue) {
            process.env[targetKey] = fallbackValue;
            return;
        }
    }
};

const REQUIRED_KEYS = [
    "AWS_REGION",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
];

export const ensureServerEnv = () => {
    applyIfMissing("AWS_ACCESS_KEY_ID", "APP_AWS_ACCESS_KEY_ID");
    applyIfMissing("AWS_SECRET_ACCESS_KEY", "APP_AWS_SECRET_ACCESS_KEY");
    applyIfMissing("AWS_REGION", "APP_AWS_REGION");

    const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`[runtime] Missing server environment variables: ${missing.join(", ")}`);
    }
};

ensureServerEnv();

