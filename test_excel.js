const fs = require('fs');
const XLSX = require('xlsx');

const file_path = r = "Tira de Pago  BASICO TOP TALENT JUNIO 2026.xls";
const arrayBuffer = fs.readFileSync(file_path);

function cleanVal(val) {
    if (val === null || val === undefined) return "";
    return String(val).strip ? String(val).trim() : String(val);
}

function formatNumber(val) {
    if (val === null || val === undefined || val === "") return "";
    const num = Math.abs(Number(val));
    if (isNaN(num)) return String(val).trim();
    return num.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    
    console.log("Total rows:", data.length);
    
    const volantes = [];
    const numRows = data.length;
    const selectedEmpresaId = "1";
    let r = 0;
    
    while (r < numRows) {
        const row = data[r] || [];
        let empresa = "";
        let empresaColIdx = -1;
        for (let c = 0; c < row.length; c++) {
            const val = cleanVal(row[c]);
            if (val.includes("TOP TALENT") || val.includes("ARTDECON")) {
                empresa = val;
                empresaColIdx = c;
                break;
            }
        }
        
        if (!empresa) {
            r++;
            continue;
        }
        
        const startRow = r;
        console.log(`\n--- Block start at row ${startRow} ---`);
        console.log("Empresa:", empresa, "col:", empresaColIdx);
        
        let nit = "";
        if (startRow + 1 < numRows) {
            nit = cleanVal(data[startRow + 1][empresaColIdx]);
            if (nit.toLowerCase().startsWith("nit.")) {
                nit = nit.substring(4).trim();
            }
        }
        
        function getValueAfterLabel(labelText, maxSearch = 6) {
            for (let offset = 1; offset < maxSearch; offset++) {
                const currR = startRow + offset;
                if (currR >= numRows) break;
                const currRow = data[currR] || [];
                for (let cIdx = 0; cIdx < currRow.length; cIdx++) {
                    const val = cleanVal(currRow[cIdx]);
                    if (val.toLowerCase().includes(labelText.toLowerCase())) {
                        for (let nextC = cIdx + 1; nextC < currRow.length; nextC++) {
                            const nextVal = cleanVal(currRow[nextC]);
                            if (nextVal !== "" && nextVal !== ":") {
                                return nextVal;
                            }
                        }
                    }
                }
            }
            return "";
        }
        
        let periodo = getValueAfterLabel("Periodo");
        if (!periodo) {
            periodo = getValueAfterLabel("Periodo Liq");
        }
        
        let concepto = "";
        if (startRow + 2 < numRows) {
            concepto = cleanVal(data[startRow + 2][empresaColIdx]);
        }
        
        const contrato = getValueAfterLabel("Contrato");
        let nombre = "";
        if (startRow + 3 < numRows) {
            nombre = cleanVal(data[startRow + 3][empresaColIdx]);
        }
        
        let documento = "";
        if (startRow + 4 < numRows) {
            documento = cleanVal(data[startRow + 4][empresaColIdx]);
            if (documento.endsWith(".0")) {
                documento = documento.substring(0, documento.length - 2);
            }
        }
        
        let dias = getValueAfterLabel("Dias Laborados");
        if (dias.endsWith(".0")) {
            dias = dias.substring(0, dias.length - 2);
        }
        
        let isBono = false;
        let netoFormatted = "";
        const devengados = [];
        const deducidos = [];
        
        if (startRow + 5 < numRows) {
            const row5 = data[startRow + 5] || [];
            for (let cIdx = 0; cIdx < row5.length; cIdx++) {
                const val = cleanVal(row5[cIdx]);
                if (val.toLowerCase().includes("neto a pagar")) {
                    isBono = true;
                    for (let nextC = cIdx + 1; nextC < row5.length; nextC++) {
                        const nextVal = row5[nextC];
                        if (nextVal !== null && nextVal !== undefined && String(nextVal).trim() !== "") {
                            netoFormatted = formatNumber(nextVal);
                            break;
                        }
                    }
                    break;
                }
            }
        }
        
        console.log("isBono:", isBono);
        
        if (isBono) {
            if (concepto && netoFormatted) {
                devengados.push({ concepto, valor: netoFormatted });
            }
            r = startRow + 8;
        } else {
            let currR = startRow + 5;
            let state = "init";
            
            while (currR < numRows && state !== "done") {
                const rowData = data[currR] || [];
                const rowStr = rowData.map(x => cleanVal(x)).join(" ").toLowerCase();
                
                console.log(`Row ${currR} state ${state} content:`, rowStr);
                
                if (rowStr.includes("devengados") && !rowStr.includes("total")) {
                    state = "devengados";
                    currR += 2;
                    continue;
                } else if (rowStr.includes("deducidos") && !rowStr.includes("total")) {
                    state = "deducidos";
                    currR += 1;
                    continue;
                } else if (rowStr.includes("neto a pagar")) {
                    for (let cIdx = 0; cIdx < rowData.length; cIdx++) {
                        if (cleanVal(rowData[cIdx]).toLowerCase().includes("neto a pagar")) {
                            for (let nextC = cIdx + 1; nextC < rowData.length; nextC++) {
                                const nextVal = rowData[nextC];
                                if (nextVal !== null && nextVal !== undefined && String(nextVal).trim() !== "") {
                                    netoFormatted = formatNumber(nextVal);
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    state = "done";
                    currR += 1;
                    continue;
                } else if (rowStr.includes("total devengado") || rowStr.includes("total deducido")) {
                    currR += 1;
                    continue;
                }
                
                if (state === "devengados") {
                    const conceptName = cleanVal(rowData[0]);
                    let valLiquidado = "";
                    for (let cVal = rowData.length - 1; cVal >= 0; cVal--) {
                        const valStr = cleanVal(rowData[cVal]);
                        if (valStr !== "") {
                            valLiquidado = formatNumber(rowData[cVal]);
                            break;
                        }
                    }
                    console.log(`   Devengado parsed: conceptName=${conceptName}, valLiquidado=${valLiquidado}`);
                    if (conceptName && valLiquidado) {
                        devengados.push({ concepto: conceptName, valor: valLiquidado });
                    }
                } else if (state === "deducidos") {
                    const conceptName = cleanVal(rowData[0]);
                    let valLiquidado = "";
                    for (let cVal = rowData.length - 1; cVal >= 0; cVal--) {
                        const valStr = cleanVal(rowData[cVal]);
                        if (valStr !== "") {
                            valLiquidado = formatNumber(rowData[cVal]);
                            break;
                        }
                    }
                    console.log(`   Deducido parsed: conceptName=${conceptName}, valLiquidado=${valLiquidado}`);
                    if (conceptName && valLiquidado) {
                        deducidos.push({ concepto: conceptName, valor: valLiquidado });
                    }
                }
                currR++;
            }
            r = currR;
        }
        
        volantes.push({
            empresa, nit, periodo, concepto, nombre, documento, contrato, dias, netoAPagar: netoFormatted, devengados, deducidos
        });
        
        // Print first parsed volante
        if (volantes.length === 1) {
            console.log("\nFirst volante parsed object:");
            console.log(JSON.stringify(volantes[0], null, 2));
            break;
        }
    }
}

parseExcel(arrayBuffer);
