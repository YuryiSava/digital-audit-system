const fs = require('fs');
const iconv = require('iconv-lite');

// Read with Windows-1251 encoding
const buffer = fs.readFileSync('аудит театр txt.txt');
const text = iconv.decode(buffer, 'win1251');

// Write as UTF-8
fs.writeFileSync('astana-report.txt', text, 'utf8');

// Show first 1000 chars
console.log('Converted successfully!');
console.log('\nFirst 1000 characters:');
console.log(text.substring(0, 1000));
console.log('\n\nFile saved as: astana-report.txt');
