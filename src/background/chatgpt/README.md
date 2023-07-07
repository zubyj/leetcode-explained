# ChatGPT Module

This module provides a TypeScript implementation for interacting with the OpenAI Chat API, specifically the `gpt-3.5-turbo` model. It includes utilities for fetching and managing access tokens, generating responses from the model, and handling server-sent events.

### Why we aren't using API Keys
Session token auth is used instead of API keys to keep the requests free. It's also easier for the user to just login to ChatGPT in their browser.

## Files

- `chatgpt.ts`: This is the main file of the module. It exports a function `getChatGPTAccessToken` for fetching and caching access tokens, and a class `ChatGPTProvider` for interacting with the OpenAI Chat API.

- `expiry-map.ts`: This file exports a utility class `ExpiryMap` for caching values with an expiration time.

- `fetch-sse.ts`: This file exports a function `fetchSSE` for making requests to a server-sent events (SSE) endpoint and handling the received events.

- `stream-async-iterable.ts`: This file exports a function `streamAsyncIterable` for creating an async iterable from a `ReadableStream`.

## Usage

First, import the `ChatGPTProvider` class from `chatgpt.ts`:

```typescript
import { ChatGPTProvider } from './chatgpt.ts';
```
Then, create an instance of ChatGPTProvider with your OpenAI API token:
```
const chatGPT = new ChatGPTProvider('your-token-here');
```
You can then use the generateAnswer method to get a response from the model:

```
chatGPT.generateAnswer({
    prompt: 'Hello, world!',
    onEvent: (arg) => {
        if (arg.type === 'answer') {
            console.log(arg.data?.text);
        }
    },
});
```
## Dependencies
This module depends on the following external packages:

- eventsource-parser: Used in fetch-sse.ts for parsing server-sent events.
- lodash-es: Used in fetch-sse.ts for checking if an object is empty.

## Project Structure
This module is located in the `src/background/chatgpt` directory of the project. The project also includes a `background.ts` file in the src/background directory, and a popup directory with files for a browser extension popup.

Please refer to the main project README for more information about the overall project structure and how to build and run the project.