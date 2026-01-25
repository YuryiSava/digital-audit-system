const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Load Key
let apiKey = '';
try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/OPENAI_API_KEY=(sk-proj-[a-zA-Z0-9_\-]+)/);
        if (match) apiKey = match[1];
    }
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

if (!apiKey) {
    console.error('❌ Could not find OPENAI_API_KEY in .env.local');
    process.exit(1);
}

console.log(`🔑 Key found: ${apiKey.substring(0, 15)}...`);
console.log('📡 Testing connection to api.openai.com...');

// 2. Make Request
const data = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Say Hello" }]
});

const req = https.request({
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': data.length
    }
}, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);

    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('🎉 SUCCESS! OpenAI is reachable.');
            const json = JSON.parse(body);
            console.log('Response:', json.choices[0].message.content);
        } else {
            console.error('❌ API Error:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ NETWORK ERROR:', e.message);
    if (e.message.includes('ETIMEDOUT') || e.message.includes('ECONNREFUSED')) {
        console.log('💡 TIP: Check your VPN or Firewall. You might need a proxy.');
    }
});

req.write(data);
req.end();
