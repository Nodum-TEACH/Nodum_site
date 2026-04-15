// AI Model Configuration
const AI_MODELS = {
    lmstudio: {
        name: 'LM Studio Remote',
        baseUrl: 'https://weebx.duckdns.org',
        apiKey: 'sk-lm-MnP7r7Dl:h2ZafXVv77GKbgKwcH8Q',
        model: 'google/gemma-4-e4b',
        type: 'openai-compatible'
    },
    lmstudio_local: {
        name: 'LM Studio Local',
        baseUrl: 'http://192.168.0.13:1236',
        apiKey: 'sk-lm-MnP7r7Dl:h2ZafXVv77GKbgKwcH8Q',
        model: 'google/gemma-4-e4b',
        type: 'openai-compatible'
    },
    // gemini: {
    //     name: 'Gemini 2.5 Flash Lite',
    //     baseUrl: 'https://generativelanguage.googleapis.com',
    //     apiKey: 'AIzaSyC2tAVEOCa6_lpmeawg-Mk_Ra8_t_Mz-bQ',
    //     model: 'gemini-2.5-flash-lite',
    //     type: 'gemini'
    // }
};

// Auto-detect local development server
let currentModel = 'lmstudio'; // Default to remote

// Check if running locally
if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
        currentModel = 'lmstudio_local';
        console.log('🔧 Using local LM Studio at http://192.168.0.13:1236');
    } else {
        console.log('🌐 Using remote LM Studio at https://weebx.duckdns.org');
    }
}
