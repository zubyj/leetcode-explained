/*
    Authorizes the extension with the OpenAI Chat API and manages interactions with it.
*/


import ExpiryMap from './expiry-map.js';
import { uuidv4 } from './uuid.js';
import { fetchSSE } from './fetch-sse.js';

const KEY_ACCESS_TOKEN = 'accessToken';
const cache = new ExpiryMap(10 * 1000);

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

// Mangages interactions with the OpenAI Chat API.
export class ChatGPTProvider {
    private readonly token: string;
    private readonly modelName: string;

    constructor(token: string) {
        this.token = token;
        this.modelName = 'gpt-3.5-turbo';
    }

    async generateAnswer(params: { prompt: string, onEvent: (arg: { type: string, data?: { text: string } }) => void }) {
        await fetchSSE('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: params.prompt,
                    },
                ],
                model: this.modelName,
                stream: true,
                user: uuidv4(),
            }),
            onMessage(message: string) {
                console.debug('sse message', message);
                if (message === '[DONE]') {
                    params.onEvent({ type: 'done' });
                    return;
                }
                let data;
                try {
                    data = JSON.parse(message);
                } catch (err) {
                    console.error(err);
                    return;
                }
                const text = data.choices[0].delta.content;
                if (text) {
                    params.onEvent({
                        type: 'answer',
                        data: {
                            text,
                        },
                    });
                }
            },
        });
    }
}
