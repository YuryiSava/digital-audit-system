
const fs = require('fs');
const path = require('path');
const pdfLib = require('pdf-parse');

async function testCoreParsing() {
    console.log('--- Testing PDF Parsing Logic ---');

    const filePath = path.join(process.cwd(), 'public', 'dummy.pdf');
    if (!fs.existsSync(filePath)) {
        console.error('Dummy file not found!');
        return;
    }

    const dataBuffer = fs.readFileSync(filePath);

    console.log('pdf export:', pdfLib);

    // Try finding the render function
    let parseFunc = pdfLib;
    if (typeof pdfLib !== 'function' && typeof pdfLib.default === 'function') {
        parseFunc = pdfLib.default;
    }

    try {
        const data = await parseFunc(dataBuffer);
        const text = data.text;
        console.log('PDF Text extracted:', text.length, 'chars');
        console.log('Preview:', text.substring(0, 100));

        // Logic from parsing.ts
        const lines = text.split('\n');
        const chunks = [];

        let currentClause = '';
        let currentText = '';
        const clauseRegex = /^(\d+(\.\d+)+)\.?\s+/;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const match = trimmed.match(clauseRegex);
            if (match) {
                if (currentClause) {
                    chunks.push({ clause: currentClause, text: currentText.trim() });
                }
                currentClause = match[1];
                currentText = trimmed.substring(match[0].length);
            } else {
                if (currentClause) {
                    currentText += ' ' + trimmed;
                }
            }
        }
        if (currentClause) {
            chunks.push({ clause: currentClause, text: currentText.trim() });
        }

        console.log(`Extracted ${chunks.length} chunks.`);
        console.log(JSON.stringify(chunks, null, 2));

    } catch (e) {
        console.error('PDF Parse Error:', e);
    }
}

testCoreParsing();
