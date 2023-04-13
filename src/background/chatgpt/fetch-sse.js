import { createParser } from '../../../node_modules/eventsource-parser/dist/index.js';
import { isEmpty } from '../../../node_modules/lodash-es/lodash.js';
import { streamAsyncIterable } from './stream-async-iterable.js';

export async function fetchSSE(resource, options) {
    const { onMessage, ...fetchOptions } = options;
    const resp = await fetch(resource, fetchOptions);
    if (!resp.ok) {
        const error = await resp.json().catch(() => ({}));
        // if (error.detail.code === 'model_cap_exceeded') {
        //     const message = `${error.detail.message}. ${error.detail.clears_in} seconds remaining`;
        //     document.getElementById('user-message').innerText = message;
        // }
        throw new Error(!isEmpty(error) ? JSON.stringify(error) : `${resp.status} ${resp.statusText}`);
    }
    const parser = createParser((event) => {
        if (event.type === 'event') {
            onMessage(event.data);
        }
    });
    for await (const chunk of streamAsyncIterable(resp.body)) {
        const str = new TextDecoder().decode(chunk);
        parser.feed(str);
    }
}