/*
    Reads the data stream of messages sent by the OpenAI Chat API as the response.
*/

import { createParser } from '../../../node_modules/eventsource-parser/dist/index.js';
import { isEmpty } from '../../../node_modules/lodash-es/lodash.js';
import { streamAsyncIterable } from './stream-async-iterable.js';

export async function fetchSSE(
    resource: string,
    options: {
        onMessage: (message: string) => void;
        method?: string;
        headers?: Record<string, string>;
        body?: string;
    }
): Promise<void> {
    const { onMessage, ...fetchOptions } = options;
    const resp = await fetch(resource, fetchOptions);
    if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
    }
    const reader = resp.body?.getReader();
    if (!reader) {
        throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') continue;
            if (trimmedLine === 'data: [DONE]') {
                onMessage('[DONE]');
                return;
            }
            if (trimmedLine.startsWith('data: ')) {
                onMessage(trimmedLine.slice(6));
            }
        }
    }
}
