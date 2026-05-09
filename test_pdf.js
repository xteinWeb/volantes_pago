const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText() {
    const dataBuffer = fs.readFileSync('TIRA DE PAGO BASICO TOP TALENT ABRIL 2026.pdf');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= 1; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join('\n');
        fullText += pageText + "\n";
    }
    console.log(fullText.substring(0, 1000));
}
extractText().catch(console.error);
