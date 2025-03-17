export interface AIProvider {
    generateAnswer(params: {
        prompt: string,
        action: string,
        onEvent: (arg: { type: string, data?: { text: string } }) => void
    }): Promise<void>;
}

export class OpenRouterProvider implements AIProvider {
    private readonly apiUrl: string;
    private readonly model: string;

    constructor(model: string = 'amazon/nova-micro-v1') {
        this.apiUrl = 'https://api.leetcodeapp.com';
        this.model = model;
    }

    async generateAnswer(params: {
        prompt: string,
        action: 'analyze' | 'fix',
        onEvent: (arg: { type: string, data?: { text: string } }) => void
    }) {
        try {
            // Get the userId from chrome.storage.sync
            const userIdResult = await chrome.storage.sync.get('userId');
            const userId = userIdResult.userId;

            // Get problem title from storage instead of querying tabs
            const titleResult = await chrome.storage.local.get('currentLeetCodeProblemTitle');
            const problemTitle = titleResult.currentLeetCodeProblemTitle?.split('-')[0].trim() || '';

            // Get extension version from manifest
            const manifest = chrome.runtime.getManifest();
            const version = manifest.version;

            const response = await fetch(`${this.apiUrl}/api/generate`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'chrome-extension://hkbmmebmjcgpkfmlpjhghcpbokomngga'
                },
                body: JSON.stringify({
                    prompt: params.prompt,
                    model: this.model,
                    userId: userId,
                    version: version,
                    problemTitle: problemTitle,
                    action: params.action
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Backend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            if (data.data && data.data.text) {
                params.onEvent({
                    type: 'answer',
                    data: { text: data.data.text }
                });
                params.onEvent({ type: 'done' });
            }
        } catch (error) {
            console.error('Backend API error:', error);
            params.onEvent({
                type: 'error',
                data: { text: error.message }
            });
            throw error;
        }
    }
}
