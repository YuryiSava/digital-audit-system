const path = require('path');
const fs = require('fs');

console.log('--- DEBUGGING PDF-PARSE ---');

function tryRequire(name) {
    try {
        console.log(`Trying require('${name}')...`);
        const lib = require(name);
        console.log(`SUCCESS! Type: ${typeof lib}`);
        console.log('Keys:', Object.keys(lib));
        if (lib.default) {
            console.log('Default export keys:', Object.keys(lib.default));
        }
        return lib;
    } catch (e) {
        console.log(`FAILED: ${e.message.split('\n')[0]}`);
        return null;
    }
}

// 1. Standard
tryRequire('pdf-parse');

// 2. Direct CJS
tryRequire('pdf-parse/dist/pdf-parse/cjs/index.cjs');

// 3. Check node_modules structure
const basePath = path.join(__dirname, 'node_modules', 'pdf-parse');
if (fs.existsSync(basePath)) {
    console.log('node_modules/pdf-parse exists.');
    console.log('Files in root:', fs.readdirSync(basePath));
    const distPath = path.join(basePath, 'dist');
    if (fs.existsSync(distPath)) {
        console.log('dist exists');
    }
} else {
    console.log('node_modules/pdf-parse NOT FOUND!');
}
