import { NextRequest, NextResponse } from 'next/server';
import { dynamo, TABLE_NAMES } from '@/lib/aws';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const ANALYTICS_API_KEY = process.env.ANALYTICS_API_KEY || 'dev_analytics_key_change_in_production';
const CACHE_TTL_MS = 60 * 1000;

type AnalyticsPayload = {
    totalGenerations: number;
    withFeedback: number;
    likeRate: number;
    likes: number;
    dislikes: number;
    byAbsType: Record<string, { likes: number; dislikes: number; rate: number }>;
    byProvider: Record<string, { likes: number; dislikes: number; rate: number }>;
    byStrengthRange: Record<string, { likes: number; dislikes: number; rate: number }>;
    topPromptVariations: Array<{
        prompt: string;
        likes: number;
        dislikes: number;
        rate: number;
    }>;
};

let analyticsCache: { data: AnalyticsPayload; expiresAt: number } | null = null;

export async function GET(req: NextRequest) {
    try {
        // Check API key
        const apiKey = req.headers.get('X-Analytics-Key');
        if (apiKey !== ANALYTICS_API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = Date.now();
        if (analyticsCache && analyticsCache.expiresAt > now) {
            return NextResponse.json(analyticsCache.data);
        }

        const generations = [];
        let ExclusiveStartKey: Record<string, unknown> | undefined;
        do {
            const response = await dynamo.send(new ScanCommand({
                TableName: TABLE_NAMES.GENERATIONS,
                ProjectionExpression: "id, abs_type, feedback, generationParams, model_used, prompt_used",
                ExclusiveStartKey,
            }));
            generations.push(...(response.Items || []));
            ExclusiveStartKey = response.LastEvaluatedKey;
        } while (ExclusiveStartKey);

        const totalGenerations = generations.length;
        const withFeedback = generations.filter(g => g.feedback).length;

        // Calculate overall like rate
        const feedbackItems = generations.filter(g => g.feedback);
        const likes = feedbackItems.filter(g => g.feedback === 'like').length;
        const dislikes = feedbackItems.filter(g => g.feedback === 'dislike').length;
        const likeRate = feedbackItems.length > 0 ? likes / feedbackItems.length : 0;

        // Aggregate by abs type
        const byAbsType: Record<string, { likes: number; dislikes: number; rate: number }> = {};
        for (const gen of feedbackItems) {
            const absType = gen.abs_type || 'unknown';
            if (!byAbsType[absType]) {
                byAbsType[absType] = { likes: 0, dislikes: 0, rate: 0 };
            }
            if (gen.feedback === 'like') byAbsType[absType].likes++;
            if (gen.feedback === 'dislike') byAbsType[absType].dislikes++;
        }
        for (const absType in byAbsType) {
            const total = byAbsType[absType].likes + byAbsType[absType].dislikes;
            byAbsType[absType].rate = total > 0 ? byAbsType[absType].likes / total : 0;
        }

        // Aggregate by provider
        const byProvider: Record<string, { likes: number; dislikes: number; rate: number }> = {};
        for (const gen of feedbackItems) {
            const provider = gen.generationParams?.provider || gen.model_used || 'unknown';
            if (!byProvider[provider]) {
                byProvider[provider] = { likes: 0, dislikes: 0, rate: 0 };
            }
            if (gen.feedback === 'like') byProvider[provider].likes++;
            if (gen.feedback === 'dislike') byProvider[provider].dislikes++;
        }
        for (const provider in byProvider) {
            const total = byProvider[provider].likes + byProvider[provider].dislikes;
            byProvider[provider].rate = total > 0 ? byProvider[provider].likes / total : 0;
        }

        // Aggregate by strength range
        const byStrengthRange: Record<string, { likes: number; dislikes: number; rate: number }> = {
            '0.1-0.3': { likes: 0, dislikes: 0, rate: 0 },
            '0.4-0.6': { likes: 0, dislikes: 0, rate: 0 },
            '0.7-1.0': { likes: 0, dislikes: 0, rate: 0 },
        };
        for (const gen of feedbackItems) {
            const strength = gen.generationParams?.strength || gen.strength || 0;
            let range = '0.7-1.0';
            if (strength <= 0.3) range = '0.1-0.3';
            else if (strength <= 0.6) range = '0.4-0.6';

            if (gen.feedback === 'like') byStrengthRange[range].likes++;
            if (gen.feedback === 'dislike') byStrengthRange[range].dislikes++;
        }
        for (const range in byStrengthRange) {
            const total = byStrengthRange[range].likes + byStrengthRange[range].dislikes;
            byStrengthRange[range].rate = total > 0 ? byStrengthRange[range].likes / total : 0;
        }

        // Top prompt variations (most liked)
        const promptStats: Record<string, { likes: number; dislikes: number }> = {};
        for (const gen of feedbackItems) {
            const prompt = gen.prompt_used || 'unknown';
            if (!promptStats[prompt]) {
                promptStats[prompt] = { likes: 0, dislikes: 0 };
            }
            if (gen.feedback === 'like') promptStats[prompt].likes++;
            if (gen.feedback === 'dislike') promptStats[prompt].dislikes++;
        }
        const topPromptVariations = Object.entries(promptStats)
            .map(([prompt, stats]) => ({
                prompt,
                likes: stats.likes,
                dislikes: stats.dislikes,
                rate: (stats.likes + stats.dislikes) > 0 ? stats.likes / (stats.likes + stats.dislikes) : 0,
            }))
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 10);

        const payload: AnalyticsPayload = {
            totalGenerations,
            withFeedback,
            likeRate,
            likes,
            dislikes,
            byAbsType,
            byProvider,
            byStrengthRange,
            topPromptVariations,
        };

        analyticsCache = {
            data: payload,
            expiresAt: now + CACHE_TTL_MS,
        };

        return NextResponse.json(payload);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Analytics error:', message);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
