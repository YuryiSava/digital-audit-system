const pdfParseLib = require('pdf-parse');

async function extractPdfText(buffer) {
    try {
        console.log(`[PdfHelper] Processing buffer of size: ${buffer.length}`);

        let parseFunc = pdfParseLib;
        if (typeof parseFunc !== 'function' && parseFunc.default) {
            parseFunc = parseFunc.default;
        }

        if (typeof parseFunc === 'function') {
            // Create a promise that rejects after 5 seconds
            const timeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('PDF parsing timed out after 15s')), 15000);
            });

            const parsePromise = parseFunc(buffer);

            // Race between parsing and timeout
            const data = await Promise.race([parsePromise, timeout]);

            console.log(`[PdfHelper] Text extracted. Length: ${data.text.length}`);
            return data.text;
        }

        throw new Error('pdf-parse library interface not recognized');

    } catch (e) {
        console.error('[PdfHelper] Error:', e);
        throw new Error(`PDF Helper failed: ${e.message}`);
    }
}

module.exports = { extractPdfText };
