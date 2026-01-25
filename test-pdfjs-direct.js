// Test pdfjs-dist directly
const fs = require('fs');
const path = require('path');

async function testPDFJS() {
    try {
        // Import pdfjs-dist
        const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

        console.log('pdfjs-dist loaded successfully');
        console.log('Version:', pdfjsLib.version);

        // Test file
        const testFile = 'public/uploads/norms/1769228791719-SP-RK-2.02_102_2022-deystv-s-01.03.2023g.pdf';
        const dataBuffer = fs.readFileSync(testFile);

        console.log('File loaded, size:', dataBuffer.length);

        // Load PDF
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(dataBuffer),
        });

        const pdf = await loadingTask.promise;
        console.log('PDF loaded, pages:', pdf.numPages);

        // Extract text from first page
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');

        console.log('\n✓ Success!');
        console.log('First page text length:', text.length);
        console.log('First 300 chars:\n', text.substring(0, 300));

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testPDFJS();
