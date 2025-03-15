export interface AIProvider {
    generateAnswer(params: {
        prompt: string,
        onEvent: (arg: { type: string, data?: { text: string } }) => void
    }): Promise<void>;
}

export class OpenRouterProvider implements AIProvider {
    private readonly apiUrl: string;
    private readonly model: string;

    constructor(apiKey: string, model: string = 'amazon/nova-micro-v1') {
        this.apiUrl = 'https://api.leetcodeapp.com';
        this.model = model;
    }

    async generateAnswer(params: { prompt: string, onEvent: (arg: { type: string, data?: { text: string } }) => void }) {
        try {
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
                    action: 'fix' // You may want to pass this as a parameter
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
