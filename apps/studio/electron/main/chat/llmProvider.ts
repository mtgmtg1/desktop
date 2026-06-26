// [Flow: Read user AI provider settings -> Build OpenAI-compatible config -> Return language model]
import { createOpenAI } from '@ai-sdk/openai';
import type { StreamRequestType } from '@onlook/models/chat';
import { LLMProvider } from '@onlook/models/llm';
import { type LanguageModelV1 } from 'ai';
import { PersistentStorage } from '../storage';
export interface OnlookPayload {
    requestType: StreamRequestType;
}

export async function initModel(
    provider: LLMProvider,
    model: string,
    _payload: OnlookPayload,
): Promise<LanguageModelV1> {
    switch (provider) {
        case LLMProvider.OPENAI:
            return await getOpenAICompatibleProvider(model);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

async function getOpenAICompatibleProvider(model: string): Promise<LanguageModelV1> {
    const settings = PersistentStorage.USER_SETTINGS.read();
    const aiProvider = settings?.aiProvider;

    if (!aiProvider?.endpoint) {
        throw new Error('AI endpoint is not configured. Please set it in Preferences.');
    }

    const config: {
        apiKey?: string;
        baseURL?: string;
        headers?: Record<string, string>;
    } = {
        baseURL: aiProvider.endpoint,
    };

    if (aiProvider.apiKey) {
        config.apiKey = aiProvider.apiKey;
    }

    const openai = createOpenAI(config);
    return openai(model);
}
