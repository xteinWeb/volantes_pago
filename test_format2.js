const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText() {
    const dataBuffer = fs.readFileSync('TIRA DE PAGO BASICO ARTDECON ABRIL 2026.pdf');
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
        const text = separator + parts[i];
        
        const devengados = [];
        const deducidos = [];
        
        if (text.includes("Total Devengado")) {
            // Format 2
            const devMatch = text.match(/Conceptos\s*\n([\s\S]*?)Total Devengado/);
            if (devMatch) {
                const lines = devMatch[1].trim().split('\n').map(l => l.trim()).filter(l => l !== '');
                for (let j = 0; j < lines.length; j += 2) {
                    const concepto = lines[j];
                    const valorStr = lines[j+1];
                    if (!valorStr) break;
                    const cleanVal = valorStr.replace(/[()]/g, '');
                    devengados.push({ concepto, valor: cleanVal });
                }
            }
            
            const dedMatch = text.match(/DEDUCIDOS\s*\n([\s\S]*?)Total Deducido/);
            if (dedMatch) {
                const lines = dedMatch[1].trim().split('\n').map(l => l.trim()).filter(l => l !== '');
                for (let j = 0; j < lines.length; j += 2) {
                    const concepto = lines[j];
                    const valorStr = lines[j+1];
                    if (!valorStr) break;
                    const cleanVal = valorStr.replace(/[()]/g, '');
                    deducidos.push({ concepto, valor: cleanVal });
                }
            }
        }
        
        if (i === 1) { // just print the first one
            console.log("Devengados:", devengados);
            console.log("Deducidos:", deducidos);
        }
    }
}
extractText().catch(console.error);
