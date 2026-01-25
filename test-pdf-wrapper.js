// Simple wrapper for pdf-parse to handle different versions
const fs = require('fs');

async function parsePDF(dataBuffer) {
    try {
        // Try to use pdf-parse in the simplest way possible
        const pdfParse = require('pdf-parse');

        // pdf-parse can be used as a function directly
        if (typeof pdfParse === 'function') {
            return await pdfParse(dataBuffer);
        }

        // Or it might have a default export
        if (pdfParse.default && typeof pdfParse.default === 'function') {
            return await pdfParse.default(dataBuffer);
        }

        // Or it might be a class
        if (pdfParse.PDFParse) {
            const parser = new pdfParse.PDFParse();
            await parser.load(dataBuffer);
            const text = await parser.getText();
            return { text };
        }

        throw new Error('Unable to determine pdf-parse API');

    } catch (error) {
        console.error('PDF parsing error:', error);
        throw error;
    }
}

// Test with a real file
const testFile = process.argv[2];
if (testFile && fs.existsSync(testFile)) {
    const buffer = fs.readFileSync(testFile);
    parsePDF(buffer)
        .then(result => {
            console.log('Success!');
            console.log('Text length:', result.text?.length || 0);
            console.log('First 200 chars:', result.text?.substring(0, 200));
        })
        .catch(err => {
            console.error('Failed:', err.message);
        });
} else {
    console.log('Usage: node test-pdf-wrapper.js <path-to-pdf>');
}

module.exports = { parsePDF };
