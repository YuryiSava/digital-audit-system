const PDFParser = require("pdf2json");

function extractPdfTextV2(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1); // 1 = text content only

        pdfParser.on("pdfParser_dataError", errData => {
            console.error('[PdfHelperV2] Error:', errData.parserError);
            reject(new Error(errData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", pdfData => {
            try {
                // pdfData is the raw JSON data
                // We need to extract text from it. 
                // getRawTextContent() returns text.
                const text = pdfParser.getRawTextContent();
                console.log(`[PdfHelperV2] Success. Text len: ${text.length}`);
                resolve(text);
            } catch (e) {
                reject(e);
            }
        });

        try {
            pdfParser.parseBuffer(buffer);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = { extractPdfTextV2 };
