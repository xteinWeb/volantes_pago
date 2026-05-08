const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

function parseSingleVolante(text) {
    const volante = {
        empresa: "ARTDECON DE COLOMBIA S.A.S",
        nit: "900.621.056-1",
        periodoLiquidacion: "",
        concepto: "",
        empleadoNombre: "",
        documento: "",
        contrato: "",
        diasLaborados: "30",
        netoAPagar: "",
        devengados: [],
        deducidos: []
    };

    // Devengados
    const bonificacionMatch = text.match(/Bonificación\s*([\d\.]+)/);
    console.log("Match Bonificacion:", bonificacionMatch);
    if (bonificacionMatch) {
        volante.devengados.push({
            concepto: "Bonificación",
            valor: bonificacionMatch[1]
        });
    }

    const domingosMatch = text.match(/Domingos y Festivos\s*([\d\.]+)/);
    console.log("Match Domingos:", domingosMatch);
    if (domingosMatch) {
        volante.devengados.push({
            concepto: "Domingos y Festivos",
            valor: domingosMatch[1]
        });
    }

    return volante;
}

function parseVolantes(text) {
    const separator = "ARTDECON DE COLOMBIA S.A.S";
    const parts = text.split(separator);
    const result = [];

    for (let i = 1; i < parts.length; i++) {
        const chunk = separator + parts[i];
        try {
            const volante = parseSingleVolante(chunk);
            if (volante) result.push(volante);
        } catch (e) {
            console.error("Error parseando un volante", e);
        }
    }
    return result;
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
    
    const volantes = parseVolantes(fullText);
    console.log(JSON.stringify(volantes[0].devengados, null, 2));
}
extractText().catch(console.error);
