
const { extractPdfText } = require('./lib/pdf-helper');
const fs = require('fs');
const path = require('path');

async function testOne() {
    const filename = '1769233173682-SN-RK-2.02_02_2023___________________________________________________________________________.pdf';
    console.log(`Testing specific file: ${filename}`);
    try {
        const filePath = path.join(__dirname, 'public/uploads/norms', filename);
        if (!fs.existsSync(filePath)) {
            console.log('File not found'); return;
        }
        const buffer = fs.readFileSync(filePath);
        console.log(`Read ${buffer.length} bytes.`);

        // Timeout promise
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));

        const text = await Promise.race([
            extractPdfText(buffer),
            timeout
        ]);

        console.log(`SUCCESS. Extracted ${text.length} chars.`);
        console.log('Preview:', text.substring(0, 200));
    } catch (e) {
        console.error('FAILED:', e);
    }
}
testOne();
