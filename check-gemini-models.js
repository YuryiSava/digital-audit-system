const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Read API Key from .env (parsing manually to avoid dependencies)
let apiKey = '';
try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=(.+)/);
        if (match) apiKey = match[1].trim();
    }
} catch (e) {
    console.error('Error reading .env:', e.message);
}

if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env');
    process.exit(1);
}

// 2. Fetch Models
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('=== AVAILABLE GEMINI MODELS ===');
                // Filter for "generateContent" support and "flash" in name
                const usefulModels = json.models
                    .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                    .map(m => m.name);

                usefulModels.forEach(name => console.log(name));
            } else {
                console.error('API Error:', json);
            }
        } catch (e) {
            console.error('Parse Error:', e.message);
            console.log('Raw Data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Network Error:', e.message);
});
