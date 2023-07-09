/*
    Reads the data stream of messages sent by the OpenAI Chat API as the response.
*/

import { createParser } from '../../../node_modules/eventsource-parser/dist/index.js';
import { isEmpty } from '../../../node_modules/lodash-es/lodash.js';
import { streamAsyncIterable } from './stream-async-iterable.js';

export async function fetchSSE(
    resource: string,
    options: RequestInit & { onMessage: (message: string) => void }) {
    const { onMessage, ...fetchOptions } = options;
    const resp = await fetch(resource, fetchOptions);
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`);
    }
    const parser = createParser((event) => {
        if (event.type === 'event') {
            onMessage(event.data);
        }
    });
    for await (const chunk of streamAsyncIterable(resp.body || new ReadableStream())) {
        const str = new TextDecoder().decode(chunk);
        parser.feed(str);
    }
}
