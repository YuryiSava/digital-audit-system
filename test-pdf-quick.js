const pdf = require('pdf-parse');
const fs = require('fs/promises');
const path = require('path');

async function testPdf() {
    const pdfPath = path.join(process.cwd(), 'SP-RK-2.02_101_2022-Pozharnaya-bezopasnost-zdaniy-i-sooruzheniy.pdf');

    console.log('Testing PDF:', pdfPath);
    console.log('File exists:', require('fs').existsSync(pdfPath));

    try {
        const dataBuffer = await fs.readFile(pdfPath);
        console.log('✓ File read, size:', dataBuffer.length, 'bytes');

        const pdfData = await pdf(dataBuffer);
        console.log('✓ PDF parsed!');
        console.log('  Pages:', pdfData.numpages);
        console.log('  Text length:', pdfData.text.length);
        console.log('  First 200 chars:', pdfData.text.substring(0, 200));
    } catch (error) {
        console.error('✗ ERROR:', error.message);
    }
}

testPdf();
