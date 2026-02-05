/**
 * Патч для pdf-parse - исправляет ENOENT ошибку с test/data/05-versions-space.pdf
 * Запускается автоматически после npm install (см. package.json postinstall)
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../node_modules/pdf-parse/index.js');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Патчим debug режим
    if (content.includes('!module.parent')) {
        content = content.replace(
            'let isDebugMode = !module.parent;',
            'let isDebugMode = false; // Patched by scripts/patch-pdf-parse.js'
        );
        fs.writeFileSync(targetFile, content);
        console.log('✅ pdf-parse patched successfully');
    } else if (content.includes('isDebugMode = false')) {
        console.log('✅ pdf-parse already patched');
    } else {
        console.log('⚠️ pdf-parse structure changed, patch may not work');
    }
} else {
    console.log('⚠️ pdf-parse not found');
}
