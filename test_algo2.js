const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

function parseAmount(str) {
    return parseInt(str.replace(/\./g, ''), 10);
}

function parseBlock(text) {
    const match = text.match(/Deducidos\s*\n([\s\S]*?)NETO A PAGAR/);
    if (!match) return;
    
    const lines = match[1].trim().split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length < 2) return;
    
    const totalDeducidos = parseAmount(lines[0]);
    const totalDevengados = parseAmount(lines[1]);
    
    const devengados = [];
    const deducidos = [];
    let currentSum = 0;
    
    for (let j = 2; j < lines.length; j += 2) {
        const concepto = lines[j];
        const valorStr = lines[j+1];
        if (!valorStr) break;
        
        const valor = parseAmount(valorStr);
        
        if (totalDeducidos > 0 && currentSum < totalDeducidos) {
            deducidos.push({ concepto, valor: valorStr });
            currentSum += valor;
        } else {
            devengados.push({ concepto, valor: valorStr });
        }
    }
    
    console.log("Totales:", { totalDeducidos, totalDevengados });
    console.log("Devengados:", devengados);
    console.log("Deducidos:", deducidos);
    console.log("-------------------");
}

async function extractText() {
    const dataBuffer = fs.readFileSync('Tira de pago BONO ARTDECON ABRIL 2026.pdf');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join('\n');
        fullText += pageText + "\n";
    }
    
    const separator = "ARTDECON DE COLOMBIA S.A.S";
    const parts = fullText.split(separator);
    for (let i = 1; i < parts.length; i++) {
        parseBlock(separator + parts[i]);
    }
}
extractText().catch(console.error);
