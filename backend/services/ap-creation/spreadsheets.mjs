import ExcelJS from 'exceljs';

const limit = (v, n = 1000) => String(v ?? '').slice(0, n);
const allowedFunctions = new Set([
  'SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'COUNTA',
  'IF', 'SUMIF', 'COUNTIF', 'ROUND', 'ABS', 'IFERROR'
]);

function cellValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (typeof value.formula !== 'string') return null;
    const formula = value.formula.replace(/^=/, '').trim();
    if (formula.length > 200 ||
        !/^[A-Za-z0-9_+\-*/().,:!$ <>'"=&%]+$/.test(formula)) {
      throw new Error('UNSAFE_SPREADSHEET_FORMULA');
    }
    const calls = [...formula.matchAll(/\b([A-Za-z_][\w.]*)\s*\(/g)];
    if (calls.some(m => !allowedFunctions.has(m[1].toUpperCase()))) {
      throw new Error('UNSUPPORTED_SPREADSHEET_FUNCTION');
    }
    return { formula };
  }
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  return value == null ? null : limit(value, 2000);
}

// Rebuild formulas for an explicitly recognizable monthly operating budget.
// Do not attempt to guess formula semantics for arbitrary spreadsheets.
function repairMonthlyBudget(sheet,cols,records,totals){
  const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  if(cols.length!==14 ||
     !months.every((month,i)=>cols[i+1].header.toLowerCase().startsWith(month)) ||
     !/^(annual|yearly|year)\s*total$/i.test(cols[13].header.trim()))return false;

  const labels=records.map(row=>String(row[cols[0].key]??'').trim());
  const income=labels.findIndex(label=>/^(income|revenue)$/i.test(label));
  const expenses=labels.findIndex(label=>/^expenses?$/i.test(label));
  const profit=labels.findIndex(label=>/^(?:net\s+(?:profit|income)|monthly\s+profit)$/i.test(label));
  // Some valid budgets have a flat Revenue / Cost categories / Net Profit
  // layout rather than dedicated INCOME and EXPENSES section rows.
  const expenseCategory=/^(payroll|salar(?:y|ies)|wages?|marketing|advertising|operating expenses?|rent|utilities|hosting|software|insurance|travel|taxes|cost of goods|costs?|expenses?|supplies|maintenance|subscriptions|professional fees)\b/i;
  const flat=income===0 && expenses===-1 &&
    profit===labels.length-1 && profit>=2 &&
    labels.slice(1,profit).every(label=>expenseCategory.test(label));
  if(!flat && (income<0 || expenses<=income+1 || profit<=expenses+1))return false;

  const incomes=[];
  const costs=[];
  if(flat){
    incomes.push(income+5);
    for(let i=income+1;i<profit;i++)costs.push(i+5);
  }else{
    for(let i=income+1;i<expenses;i++){
      if(!labels[i] || /\b(sub)?totals?\b/i.test(labels[i]))return false;
      incomes.push(i+5);
    }
    for(let i=expenses+1;i<profit;i++){
      if(!labels[i] || /\b(sub)?totals?\b/i.test(labels[i]))return false;
      costs.push(i+5);
    }
  }
  if(!incomes.length || !costs.length)return false;

  // Protect against irregular subtotals, hidden calculations and gaps.
  for(const row of [...incomes,...costs]){
    for(let col=2;col<=13;col++){
      const value=sheet.getRow(row).getCell(col).value;
      if(value!==null && typeof value!=='number' &&
         !(typeof value==='object'&&typeof value.formula==='string'))
        return false;
    }
  }

  const profitRow=profit+5;
  for(const row of [...incomes,...costs])
    sheet.getCell(`N${row}`).value={formula:`SUM(B${row}:M${row})`};

  for(let col=2;col<=13;col++){
    let num=col,letter='';
    while(num){num--;letter=String.fromCharCode(65+num%26)+letter;num=Math.floor(num/26);}
    const revenue=`SUM(${letter}${incomes[0]}:${letter}${incomes.at(-1)})`;
    const expense=`SUM(${letter}${costs[0]}:${letter}${costs.at(-1)})`;
    sheet.getCell(`${letter}${profitRow}`).value={formula:`${revenue}-${expense}`};
  }
  sheet.getCell(`N${profitRow}`).value={formula:`SUM(B${profitRow}:M${profitRow})`};
  if(totals && /^grand\s+totals?$/i.test(String(totals.label||'')))
    sheet.getCell(`N${records.length+5}`).value={formula:`N${profitRow}`};
  return true;
}

export async function renderXLSX(plan) {
  const sheets = plan?.sheets;
  if (!Array.isArray(sheets) || !sheets.length || sheets.length > 6)
    throw new Error('INVALID_SPREADSHEET_PLAN');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AP Synapse';
  workbook.title = limit(plan.title, 150);
  workbook.calcProperties.fullCalcOnLoad = true;

  const gold = 'FFB39250';
  const dark = 'FF242424';
  const white = 'FFFFFFFF';
  const light = 'FFF6F3EC';

  const currencySymbol = /^[₹$€£¥]$/.test(plan.currencySymbol || '')
    ? plan.currencySymbol : '';
  const moneyFormat = currencySymbol
    ? `"${currencySymbol}"#,##0.00;[Red]("${currencySymbol}"#,##0.00)`
    : '#,##0.00;[Red](#,##0.00)';

  const names = new Set();

  for (let si = 0; si < sheets.length; si++) {
    const source = sheets[si];
    const columns = source?.columns;
    const rows = source?.rows;

    if (!Array.isArray(columns) || !columns.length ||
        columns.length > 16 || !Array.isArray(rows) ||
        rows.length > 250) {
      throw new Error('INVALID_SPREADSHEET_DIMENSIONS');
    }

    const rawName = limit(source.name || `Sheet ${si + 1}`, 28)
      .replace(/[\\/?*:[\]]/g, '_') || `Sheet ${si + 1}`;
    let name = rawName;
    let suffix = 2;
    while (names.has(name.toLowerCase())) {
      name = `${rawName.slice(0, 26)} ${suffix++}`;
    }
    names.add(name.toLowerCase());

    const sheet = workbook.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 4 }]
    });

    const seenKeys = new Set();
    const cols = columns.map((column, index) => {
      const key = limit(column.key || `column_${index + 1}`, 60);
      if (seenKeys.has(key)) throw new Error('DUPLICATE_COLUMN_KEY');
      seenKeys.add(key);
      return {
        key,
        header: limit(column.header || key, 80),
        width: Math.max(12, Math.min(42, Number(column.width) || 20)),
        type: ['text', 'number', 'currency', 'percent', 'date']
          .includes(column.type) ? column.type : 'text'
      };
    });

    sheet.columns = cols.map(c => ({ key: c.key, width: c.width }));

    sheet.mergeCells(1, 1, 1, cols.length);
    const title = sheet.getCell(1, 1);
    title.value = limit(source.title || plan.title || name, 150);
    title.font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: white } };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dark } };
    title.alignment = { vertical: 'middle', indent: 1 };
    sheet.getRow(1).height = 38;

    if (cols.length > 1) sheet.mergeCells(2, 1, 2, cols.length);
    sheet.getCell(2, 1).value = limit(source.subtitle || plan.subtitle || '', 200);
    sheet.getCell(2, 1).font = {
      name: 'Aptos', size: 10, italic: true, color: { argb: 'FF6C6253' }
    };
    sheet.getRow(2).height = 24;

    const heading = sheet.getRow(4);
    heading.height = 28;

    cols.forEach((column, i) => {
      const cell = heading.getCell(i + 1);
      cell.value = column.header;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: gold } };
      cell.font = { name: 'Aptos', bold: true, color: { argb: white }, size: 11 };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });

    rows.forEach((record, index) => {
      if (!record || typeof record !== 'object' || Array.isArray(record))
        throw new Error('INVALID_SPREADSHEET_ROW');

      const row = sheet.getRow(index + 5);
      row.height = 23;

      cols.forEach((column, j) => {
        const cell = row.getCell(j + 1);
        cell.value = cellValue(record[column.key]);
        cell.font = { name: 'Aptos', size: 10, color: { argb: dark } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: column.type === 'text' ? 'left' : 'right'
        };
        if (index % 2 === 1)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: light } };

        if (column.type === 'currency') cell.numFmt = moneyFormat;
        if (column.type === 'number') cell.numFmt = '#,##0.00';
        if (column.type === 'percent') cell.numFmt = '0.00%';
        if (column.type === 'date') cell.numFmt = 'dd mmm yyyy';
      });
    });

    if (source.totals && typeof source.totals === 'object') {
      const totalRow = sheet.getRow(rows.length + 5);
      totalRow.height = 29;

      cols.forEach((column, i) => {
        const cell = totalRow.getCell(i + 1);
        const formula = source.totals.formulas?.[column.key];
        cell.value = formula
          ? cellValue({ formula })
          : i === 0 ? limit(source.totals.label || 'Total', 80) : null;
        cell.font = { name: 'Aptos', bold: true, color: { argb: dark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8D9B8' } };
        if (column.type === 'currency') cell.numFmt = moneyFormat;
        if (column.type === 'percent') cell.numFmt = '0.00%';
      });
    }

    // Correct generated financial formulas only where the budget layout
    // can be inferred unambiguously from row and column labels.
    repairMonthlyBudget(sheet,cols,rows,source.totals);

    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: Math.max(4, rows.length + 4), column: cols.length }
    };
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
