// PDF parsing utility that works with pdf-parse v2.x
const fs = require('fs/promises');

async function parsePDFFile(filePath) {
    try {
        // Read file
        const dataBuffer = await fs.readFile(filePath);
        console.log('File size:', dataBuffer.length, 'bytes');

        // Import pdf-parse
        const pdfModule = require('pdf-parse');

        // pdf-parse v2.x uses PDFParse class
        const { PDFParse, VerbosityLevel } = pdfModule;

        if (!PDFParse) {
            throw new Error('PDFParse class not found in pdf-parse module');
        }

        // Create parser instance with verbosity option
        const parser = new PDFParse({ verbosity: VerbosityLevel?.ERRORS || 0 });

        // Load PDF from file path
        await parser.load({ url: filePath });

        // Get text
        const text = await parser.getText();

        return {
            success: true,
            text: text,
            length: text.length
        };

    } catch (error) {
        console.error('Parsing error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Test
const testFile = process.argv[2] || 'public/uploads/norms/1769228791719-SP-RK-2.02_102_2022-deystv-s-01.03.2023g.pdf';
parsePDFFile(testFile)
    .then(result => {
        if (result.success) {
            console.log('\n✓ Success!');
            console.log('Text length:', result.length);
            console.log('First 300 chars:\n', result.text.substring(0, 300));
        } else {
            console.log('\n✗ Failed:', result.error);
        }
    });

module.exports = { parsePDFFile };
