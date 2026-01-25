// Test pdf-parse v2.x usage
const fs = require('fs');
const path = require('path');

async function testPdfParse() {
    try {
        const { PDFParse } = require('pdf-parse');

        console.log('=== Testing PDFParse ===');
        console.log('PDFParse type:', typeof PDFParse);
        console.log('PDFParse prototype:', Object.getOwnPropertyNames(PDFParse.prototype));

        // Try to find a test PDF
        const testPdfPath = path.join(__dirname, 'public', 'uploads', 'norms', '1769228791719-SP-RK-2.02_102_2022-deystv-s-01.03.2023g.pdf');

        if (fs.existsSync(testPdfPath)) {
            console.log('\nTest PDF found:', testPdfPath);
            const dataBuffer = fs.readFileSync(testPdfPath);
            console.log('Buffer size:', dataBuffer.length);

            // Try different approaches
            console.log('\n--- Approach 1: new PDFParse().parse() ---');
            try {
                const parser = new PDFParse();
                const result = await parser.parse(dataBuffer);
                console.log('Success! Text length:', result.text?.length || 0);
            } catch (e) {
                console.log('Failed:', e.message);
            }

            console.log('\n--- Approach 2: PDFParse() as function ---');
            try {
                const result = await PDFParse(dataBuffer);
                console.log('Success! Text length:', result.text?.length || 0);
            } catch (e) {
                console.log('Failed:', e.message);
            }

        } else {
            console.log('Test PDF not found at:', testPdfPath);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testPdfParse();
