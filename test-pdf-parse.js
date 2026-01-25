// Test pdf-parse module structure
const pdfParse = require('pdf-parse');

console.log('=== PDF-Parse Module Info ===');
console.log('Type:', typeof pdfParse);
console.log('Is function:', typeof pdfParse === 'function');
console.log('Has default:', pdfParse.default !== undefined);
console.log('Keys:', Object.keys(pdfParse));
console.log('Constructor name:', pdfParse.constructor?.name);

if (pdfParse.default) {
    console.log('\nDefault export type:', typeof pdfParse.default);
    console.log('Default is function:', typeof pdfParse.default === 'function');
}

console.log('\n=== Test Complete ===');
