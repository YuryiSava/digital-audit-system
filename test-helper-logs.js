
const { extractPdfText } = require('./lib/pdf-helper');
const fs = require('fs');
const path = require('path');

async function test() {
    console.log('Testing pdf-helper with public/uploads/norms...');
    try {
        const normsDir = path.join(__dirname, 'public/uploads/norms');
        const files = fs.readdirSync(normsDir).filter(f => f.endsWith('.pdf'));

        console.log(`Found ${files.length} pdf files.`);

        // Sort by time desc
        files.sort((a, b) => {
            return fs.statSync(path.join(normsDir, b)).mtime.getTime() -
                fs.statSync(path.join(normsDir, a)).mtime.getTime();
        });

        for (const file of files) {
            console.log(`\n--- Testing ${file} ---`);
            const filePath = path.join(normsDir, file);
            const buffer = fs.readFileSync(filePath);
            console.log(`Size: ${buffer.length}`);

            try {
                const text = await extractPdfText(buffer);
                console.log(`SUCCESS. Length: ${text?.length}`);
            } catch (e) {
                console.log(`ERROR: ${e.message}`);
                console.log(e);
            }
        }
    } catch (e) {
        console.error('Main FAIL:', e);
    }
}
test();
