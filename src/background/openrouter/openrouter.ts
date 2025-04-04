export class OpenRouterProvider {
    private readonly apiUrl: string;
    private readonly model: string;

    private readonly authToken = 'leetSauce420';

    constructor(model: string = 'amazon/nova-micro-v1') {
        this.apiUrl = 'https://api.leetcodeapp.com';
        this.model = model;
    }

    async generateAnswer(params: {
        prompt: string,
        action: string,
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
                    'Authorization': 'Bearer ' + this.authToken,
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
                let errorMessage = 'Unknown error';
                
                if (errorData.code && errorData.message) {
                    switch (errorData.code) {
                        case 'AUTH_TOKEN_MISSING':
                            errorMessage = 'Authentication token is missing';
                            break;
                        case 'AUTH_TOKEN_INVALID':
                            errorMessage = 'Authentication token is invalid';
                            break;
                        case 'VALIDATION_ERROR':
                            errorMessage = 'Invalid request: ' + errorData.message;
                            break;
                        case 'API_ERROR':
                            errorMessage = 'API Error: ' + errorData.message;
                            break;
                        case 'NETWORK_ERROR':
                            errorMessage = 'Network error occurred';
                            break;
                        case 'SERVER_ERROR':
                            errorMessage = 'Server error: ' + errorData.message;
                            break;
                        default:
                            errorMessage = errorData.message || 'An unexpected error occurred';
                    }
                }

                throw new Error(`${errorMessage} (${response.status})`);
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
                data: { text: (error as Error).message }
            });
            throw error;
        }
    }
} 