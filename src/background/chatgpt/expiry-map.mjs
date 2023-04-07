
/*
The ExpiryMap class provides a way to store key-value pairs with an expiration time.
The get, set, and delete methods are used to retrieve, update, and delete values in the map, respectively.
The clearTimeout method is used to clear a previously set timeout for a given key.

We use an  instance of ExpiryMap to cache the access token returned by getChatGPTAccessToken() for 10 seconds 
before it expires. If the token is requested again before it expires, it is retrieved from the cache rather
than making another HTTP request to the OpenAI Chat API.
*/

class ExpiryMap {
    constructor(expiryMs) {
        this.expiryMs = expiryMs;
        this.map = new Map();
        this.timeouts = new Map();
    }

    get(key) {
        return this.map.get(key);
    }

    set(key, value) {
        this.clearTimeout(key);
        this.map.set(key, value);
        this.timeouts.set(
            key,
            setTimeout(() => {
                this.delete(key);
            }, this.expiryMs)
        );
    }

    delete(key) {
        this.clearTimeout(key);
        this.map.delete(key);
    }

    clearTimeout(key) {
        const timeout = this.timeouts.get(key);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(key);
        }
    }
}

export { ExpiryMap as default };
