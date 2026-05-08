const fs = require('fs');

const fullText = fs.readFileSync('output.txt', 'utf8');

const blocks = fullText.split('ARTDECON DE COLOMBIA S.A.S');

function parseAmount(str) {
    return parseInt(str.replace(/\./g, ''), 10);
}

for (let i = 1; i < blocks.length; i++) {
    const text = blocks[i];
    
    // Extract block between Deducidos and NETO A PAGAR
    const match = text.match(/Deducidos\s*\n([\s\S]*?)NETO A PAGAR/);
    if (!match) continue;
    
    const lines = match[1].trim().split('\n').map(l => l.trim()).filter(l => l !== '');
    
    // First two lines should be the totals
    if (lines.length < 2) continue;
    
    const totalDeducidos = parseAmount(lines[0]);
    const totalDevengados = parseAmount(lines[1]);
    
    const devengados = [];
    const deducidos = [];
    let currentSum = 0;
    
    // The rest are concepts and amounts
    // They appear as: Concept Name, then Amount
    for (let j = 2; j < lines.length; j += 2) {
        const concepto = lines[j];
        const valorStr = lines[j+1];
        if (!valorStr) break;
        
        const valor = parseAmount(valorStr);
        
        // Sometimes an extra empty line might misalign things, but filter(l => l !== '') fixes that.
        
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
