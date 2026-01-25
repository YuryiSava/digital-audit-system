
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function debugFiles() {
    const dir = path.join(__dirname, 'public/uploads/norms');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

    // Sort by time
    files.sort((a, b) => {
        return fs.statSync(path.join(dir, b)).mtime.getTime() -
            fs.statSync(path.join(dir, a)).mtime.getTime();
    });

    console.log('--- Debugging Top 2 Files ---');

    for (let i = 0; i < Math.min(files.length, 2); i++) {
        const file = files[i];
        console.log(`\nFile: ${file}`);
        const buffer = fs.readFileSync(path.join(dir, file));
        console.log(`Size: ${buffer.length} bytes`);

        try {
            const data = await pdf(buffer);
            console.log(`Pages: ${data.numpages}`);
            console.log(`Info:`, data.info);
            console.log(`Text Length: ${data.text.length}`);
            console.log(`Start of Text: [${data.text.substring(0, 100).replace(/\n/g, '\\n')}]`);

            if (data.text.trim().length === 0) {
                console.warn('!!! WARNING: Text is empty (Scanned PDF?)');
            }
        } catch (e) {
            console.error('PARSE ERROR:', e.message);
        }
    }
}

debugFiles();
