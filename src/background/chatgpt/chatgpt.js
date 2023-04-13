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

// Send feedback about quality of responses to the OpenAI Chat API.
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
Generates answers to prompts
Cleans up conversations when done.
*/
export class ChatGPTProvider {
    constructor(token) {
        this.token = token;
        this.modelName = 'gpt-3.5-turbo'
    }

    async generateAnswer(params) {
        let conversationId;

        const cleanup = () => {
            if (conversationId) {
                setConversationProperty(this.token, conversationId, { is_visible: false });
            }
        };
        await fetchSSE('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.token}`,
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
                const text = data.choices[0].delta.content
                if (text) {
                    conversationId = data.id
                    params.onEvent({
                        type: 'answer',
                        data: {
                            text,
                            messageId: data.id,
                            conversationId: data.id,
                        },
                    });
                }
            },
        });
        return { cleanup };
    }
}

