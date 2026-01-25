
const { extractPdfText } = require('./lib/pdf-helper');
const fs = require('fs');
const path = require('path');

async function test() {
    console.log('Testing pdf-helper with current installation...');
    try {
        const normsDir = path.join(__dirname, 'public/uploads/norms');
        if (!fs.existsSync(normsDir)) {
            console.log('No norms dir'); return;
        }
        const files = fs.readdirSync(normsDir).filter(f => f.endsWith('.pdf'));
        if (files.length === 0) {
            console.log('No PDFs'); return;
        }

        const filePath = path.join(normsDir, files[0]);
        console.log('File:', filePath);
        const buffer = fs.readFileSync(filePath);

        const text = await extractPdfText(buffer);
        console.log('SUCCESS!');
        console.log('Extracted text length:', text.length);
        console.log('Preview:', text.substring(0, 100).replace(/\n/g, ' '));

    } catch (e) {
        console.error('FAIL:', e);
    }
}
test();
