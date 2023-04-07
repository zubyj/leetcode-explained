/*
This file is the main module that manages interactions with the OpenAI Chat API. It exports a ChatGPTProvider class that has methods for getting available models, generating answers to prompts, and cleaning up conversations.
The getChatGPTAccessToken function fetches an access token from the OpenAI Chat API and caches it using the ExpiryMap class from the expiry-map.mjs module.
The sendMessageFeedback and setConversationProperty functions send feedback about the quality of responses and update conversation properties, respectively, to the OpenAI Chat API.
The request function is a helper function that sends an HTTP request to the OpenAI Chat API with the provided method, path, and data.
Finally, the uuidv4 and fetchSSE functions are imported from the uuid.js and fetch-sse.js modules, respectively, which provide functionality for generating UUIDs and sending Server-Sent Events (SSE) requests to the OpenAI Chat API.
*/

import ExpiryMap from './expiry-map.mjs';
import { uuidv4 } from './uuid.js';
import { fetchSSE } from './fetch-sse.js'

// HTTP request to the OpenAI Chat API. 
async function request(token, method, path, data) {
    return fetch(`https://chat.openai.com/backend-api${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
    });
}

// Send feedback about quality of resposnes to the OpenAI Chat API.
export async function sendMessageFeedback(token, data) {
    await request(token, 'POST', '/conversation/message_feedback', data);
}

// Update conversation properties to the OpenAI Chat API.
export async function setConversationProperty(token, conversationId, propertyObject) {
    await request(token, 'PATCH', `/conversation/${conversationId}`, propertyObject);
}

const KEY_ACCESS_TOKEN = 'accessToken';

const cache = new ExpiryMap(10 * 1000);

// Gets an access token from the OpenAI Chat API and caches it using the ExpiryMap.
export async function getChatGPTAccessToken() {
    if (cache.get(KEY_ACCESS_TOKEN)) {
        return cache.get(KEY_ACCESS_TOKEN);
    }
    const resp = await fetch('https://chat.openai.com/api/auth/session');
    if (resp.status === 403) {
        throw new Error('CLOUDFLARE');
    }
    const data = await resp.json().catch(() => ({}));
    if (!data.accessToken) {
        throw new Error('UNAUTHORIZED');
    }
    cache.set(KEY_ACCESS_TOKEN, data.accessToken);
    return data.accessToken;
}


/*
Mangages interactions with the OpenAI Chat API.
1. Gets available models
2. Generates answers to prompts
3. Cleans up conversations when done.
*/
export class ChatGPTProvider {
    constructor(token) {
        this.token = token;
    }

    async fetchModels() {
        const resp = await request(this.token, 'GET', '/models').then((r) => r.json());
        return resp.models;
    }

    async getModelName() {
        try {
            const models = await this.fetchModels();
            return models[0].slug;
        } catch (err) {
            console.error(err);
            return 'text-davinci-002-render';
        }
    }

    async generateAnswer(params) {
        let conversationId;

        const cleanup = () => {
            if (conversationId) {
                setConversationProperty(this.token, conversationId, { is_visible: false });
            }
        };

        const modelName = await this.getModelName();
        console.debug('Using model:', modelName);

        await fetchSSE('https://chat.openai.com/backend-api/conversation', {
            method: 'POST',
            signal: params.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                action: 'next',
                messages: [
                    {
                        id: uuidv4(),
                        role: 'user',
                        content: {
                            content_type: 'text',
                            parts: [params.prompt],
                        },
                    },
                ],
                model: modelName,
                parent_message_id: uuidv4(),
            }),
            onMessage(message) {
                console.debug('sse message', message);
                if (message === '[DONE]') {
                    params.onEvent({ type: 'done' });
                    cleanup();
                    return;
                }
                let data;
                try {
                    data = JSON.parse(message);
                } catch (err) {
                    console.error(err);
                    return;
                }
                const text = data.message?.content?.parts?.[0];
                if (text) {
                    conversationId = data.conversation_id;
                    params.onEvent({
                        type: 'answer',
                        data: {
                            text,
                            messageId: data.message.id,
                            conversationId: data.conversation_id,
                        },
                    });
                }
            },
        });
        return { cleanup };
    }
}

