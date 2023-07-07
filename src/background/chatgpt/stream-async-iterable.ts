/*
    Make reading the stream easier by converting it to an async iterable.
*/

export async function* streamAsyncIterable(stream: ReadableStream) {
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}
