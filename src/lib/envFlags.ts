const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "off") {
    return false;
  }
  if (normalized === "true" || normalized === "1" || normalized === "on") {
    return true;
  }
  return fallback;
};

const defaultDemoFallback = process.env.NODE_ENV === "production" ? false : true;

export const DEMO_MODE = parseBoolean(
  process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE,
  defaultDemoFallback
);

export const PERSISTENCE_ENABLED = parseBoolean(
  process.env.NEXT_PUBLIC_ENABLE_PERSISTENCE ?? process.env.ENABLE_PERSISTENCE,
  false
);

export const SERVER_CREDITS_ENABLED = parseBoolean(
  process.env.NEXT_PUBLIC_ENABLE_SERVER_CREDITS ?? process.env.ENABLE_SERVER_CREDITS,
  false
);

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const envInitialCredits =
  parseNumber(process.env.NEXT_PUBLIC_INITIAL_CREDITS ?? process.env.INITIAL_CREDITS);

export const DEFAULT_FREE_CREDITS =
  envInitialCredits ?? (DEMO_MODE ? 999 : 6);

export const DEMO_RESULT_URL = "/result.png";

