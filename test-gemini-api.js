// Test Gemini API key and available models
const apiKey = 'AIzaSyDb_MGvfq0GvML8CustGjePPT6xHaePKDo';

async function testGeminiAPI() {
    try {
        // Test 1: List available models
        console.log('=== Testing Gemini API ===\n');
        console.log('1. Fetching available models...');

        const modelsResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );

        if (!modelsResponse.ok) {
            console.error('Models API error:', modelsResponse.status, await modelsResponse.text());
        } else {
            const modelsData = await modelsResponse.json();
            console.log('Available models (FULL LIST):');
            // Log raw names to be sure
            console.log(JSON.stringify(modelsData.models.map(m => m.name), null, 2));
        }

        // Test 2: Try simple text generation
        console.log('\n2. Testing text generation with gemini-pro...');

        const testResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Say hello in Russian' }]
                    }]
                })
            }
        );

        if (!testResponse.ok) {
            console.error('Generation error:', testResponse.status, await testResponse.text());
        } else {
            const result = await testResponse.json();
            console.log('Success! Response:', result.candidates?.[0]?.content?.parts?.[0]?.text);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testGeminiAPI();
