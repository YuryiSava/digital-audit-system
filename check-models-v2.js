require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('No API key'); process.exit(1); }

async function listModels() {
    // Try v1beta
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.models) {
            console.log('Available Models (v1beta):');
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log('Error listing models:', data);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

listModels();
