
const { extractPdfText } = require('./lib/pdf-helper-combo');
const fs = require('fs');
const path = require('path');

async function debugCombo() {
    const normsDir = path.join(__dirname, 'public/uploads/norms');
    console.log(`Scanning: ${normsDir}`);

    if (!fs.existsSync(normsDir)) {
        console.log('Dir not found'); return;
    }

    const files = fs.readdirSync(normsDir).filter(f => f.endsWith('.pdf'));
    // Sort by newest
    files.sort((a, b) => fs.statSync(path.join(normsDir, b)).mtimeMs - fs.statSync(path.join(normsDir, a)).mtimeMs);

    console.log(`Found ${files.length} PDFs`);

    for (const file of files) {
        console.log(`\n---------------------------------------------------`);
        console.log(`Testing File: ${file}`);
        const absPath = path.join(normsDir, file);
        const stats = fs.statSync(absPath);
        console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        try {
            const buffer = fs.readFileSync(absPath);
            console.log('Starting extraction...');
            const startTime = Date.now();

            const text = await extractPdfText(buffer);

            const duration = (Date.now() - startTime) / 1000;
            console.log(`Extraction COMPLETE in ${duration}s`);
            console.log(`Text Length: ${text.length}`);
            console.log(`Preview: ${text.substring(0, 100).replace(/\n/g, ' ')}...`);
        } catch (e) {
            console.error(`FAILED: ${e.message}`);
            // console.error(e);
        }
    }
}

debugCombo();
