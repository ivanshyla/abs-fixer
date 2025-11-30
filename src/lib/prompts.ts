import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type PromptEntry = {
    prompt: string;
    negativePrompt?: string;
};

type PromptRecord = Record<string, PromptEntry>;

type PromptFileShape = {
    absTypes: PromptRecord;
};

let cachedPromptRecord: PromptRecord | null = null;

const normalizePath = (filepath?: string) => {
    if (!filepath) return undefined;
    return path.isAbsolute(filepath) ? filepath : path.resolve(process.cwd(), filepath);
};

const parsePromptPayload = (payload: string, source: string): PromptRecord => {
    try {
        const parsed = JSON.parse(payload) as PromptRecord | PromptFileShape;
        if (parsed && typeof parsed === "object" && "absTypes" in parsed) {
            return parsed.absTypes;
        }
        return parsed as PromptRecord;
    } catch (error) {
        throw new Error(`Unable to parse prompt configuration from ${source}: ${(error as Error).message}`);
    }
};

const loadPromptsFromFilesystem = (): PromptRecord => {
    const searchPaths = [
        normalizePath(process.env.ABS_PROMPTS_PATH),
        path.resolve(process.cwd(), "config/prompts.json"),
        path.resolve(process.cwd(), "config/prompts.example.json"),
    ].filter(Boolean) as string[];

    for (const candidate of searchPaths) {
        if (existsSync(candidate)) {
            const payload = readFileSync(candidate, "utf-8");
            return parsePromptPayload(payload, candidate);
        }
    }

    throw new Error(
        "Prompt configuration not found. Set ABS_PROMPTS_JSON, ABS_PROMPTS_PATH, or create config/prompts.json.",
    );
};

const getPromptRecord = (): PromptRecord => {
    if (cachedPromptRecord) {
        return cachedPromptRecord;
    }

    const envPayload = process.env.ABS_PROMPTS_JSON;
    if (envPayload?.trim()) {
        cachedPromptRecord = parsePromptPayload(envPayload, "ABS_PROMPTS_JSON");
        return cachedPromptRecord;
    }

    cachedPromptRecord = loadPromptsFromFilesystem();
    return cachedPromptRecord;
};

const resolvePromptEntry = (absType: string): PromptEntry => {
    const record = getPromptRecord();
    const entry = record[absType];
    if (entry) {
        return entry;
    }

    const availableTypes = Object.keys(record);
    if (!availableTypes.length) {
        throw new Error("Prompt configuration is empty.");
    }

    const fallbackType = record.natural_fit ? "natural_fit" : availableTypes[0];
    return record[fallbackType];
};

export const getPromptForAbsType = (absType: string) => {
    return resolvePromptEntry(absType).prompt;
};

export const getNegativePrompt = (absType: string) => {
    return getPromptRecord()[absType]?.negativePrompt ?? "";
};

export const getGenerationParams = (type: string, intensity: number = 50) => {
    if (type.startsWith('weight_loss') || type === 'ozempic') {
        return {
            strength: 0.65,
            guidance_scale: 4.0,
            num_inference_steps: 35
        };
    }
    return {
        strength: 0.1 + (intensity / 100) * 0.9, // Default dynamic strength
        guidance_scale: 2.5,
        num_inference_steps: 25
    };
};
