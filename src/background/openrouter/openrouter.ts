export interface AIProvider {
    generateAnswer(params: {
        prompt: string,
        onEvent: (arg: { type: string, data?: { text: string } }) => void
    }): Promise<void>;
}

export class OpenRouterProvider implements AIProvider {
    private readonly apiKey: string;
    private readonly model: string;

    constructor(apiKey: string, model: string = 'amazon/nova-micro-v1') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateAnswer(params: { prompt: string, onEvent: (arg: { type: string, data?: { text: string } }) => void }) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://github.com/zubyj/leetcode-explained',
                    'X-Title': 'Leetcode Explained'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{
                        role: 'user',
                        content: params.prompt
                    }],
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                params.onEvent({
                    type: 'answer',
                    data: { text: data.choices[0].message.content }
                });
                params.onEvent({ type: 'done' });
            }
        } catch (error) {
            console.error('OpenRouter API error:', error);
            throw error;
        }
    }
}
