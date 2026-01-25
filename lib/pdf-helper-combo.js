const { extractPdfText: extractV1 } = require('./pdf-helper');
const { extractPdfTextV2: extractV2 } = require('./pdf-helper-v2');

async function extractPdfText(buffer) {
    console.log('[PdfHelper] Attempting V1 (pdf-parse)...');
    try {
        // Try V1 with a SHORT timeout (e.g. 5s) because it tends to hang
        const v1Promise = extractV1(buffer);
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('V1 Timeout')), 5000));

        return await Promise.race([v1Promise, timeout]);
    } catch (e) {
        console.warn(`[PdfHelper] V1 failed (${e.message}). Switching to V2 (pdf2json)...`);

        // Fallback to V2
        try {
            return await extractV2(buffer);
        } catch (e2) {
            console.error('[PdfHelper] V2 failed:', e2);
            throw new Error(`All PDF parsers failed. V1: ${e.message}, V2: ${e2.message}`);
        }
    }
}

module.exports = { extractPdfText };
