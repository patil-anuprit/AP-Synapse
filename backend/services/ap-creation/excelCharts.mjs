import {createRequire} from 'node:module';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {renderXLSXV3} from './varianceIntelligence.mjs';

const require=createRequire(import.meta.url);
const {addChart,validate}=require('chartsheet');

const escaped=value=>String(value)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;')
  .replace(/'/g,'&apos;');

function cache(type,values){
  const content=values.map((value,i)=>
    `<c:pt idx="${i}"><c:v>${escaped(value)}</c:v></c:pt>`
  ).join('');

  const format=type==='num'
    ?'<c:formatCode>General</c:formatCode>'
    :'';

  return `<c:${type}Cache>${format}`+
    `<c:ptCount val="${values.length}"/>`+
    content+`</c:${type}Cache>`;
}

function inject(block,parent,ref,type,values){
  const expression=new RegExp(
    `(<c:${parent}><c:${ref}><c:f>[^<]*<\\/c:f>)`+
    `(<\\/c:${ref}><\\/c:${parent}>)`
  );

  if(!expression.test(block))
    throw new Error('UNEXPECTED_CHART_XML');

  return block.replace(
    expression,
    (_,start,end)=>start+cache(type,values)+end
  );
}

function cachedValue(cell){
  const value=cell.value;
  if(typeof value==='number'&&Number.isFinite(value))
    return value;

  if(value&&typeof value==='object' &&
     typeof value.result==='number' &&
     Number.isFinite(value.result))
    return value.result;

  return null;
}

// A standard 12-month budget does not contain an AP Variance worksheet.
// Embed a revenue/profit chart directly in that budget instead of skipping charts.
async function chartMonthlyBudget(original,book){
  const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let selected=null;

  for(const sheet of book.worksheets){
    const header=sheet.getRow(4);
    if(!months.every((m,i)=>
      String(header.getCell(i+2).value||'').toLowerCase().startsWith(m)))
      continue;

    const marker=(regex,start=5)=>{
      for(let row=start;row<=sheet.rowCount;row++)
        if(regex.test(String(sheet.getCell(`A${row}`).value||'').trim()))
          return row;
      return -1;
    };

    const income=marker(/^(income|revenue)$/i);
    const expenses=marker(/^expenses?$/i,income+1);
    const profit=marker(/^net\s+(profit|income)$/i,expenses+1);
    const expenseCategory=/^(payroll|salar(?:y|ies)|wages?|marketing|advertising|operating expenses?|rent|utilities|hosting|software|insurance|travel|taxes|cost of goods|costs?|expenses?|supplies|maintenance|subscriptions|professional fees)\b/i;
    const flat=income===5 && expenses===-1 && profit>=income+2 &&
      Array.from({length:profit-income-1},(_,i)=>
        String(sheet.getCell(`A${income+i+1}`).value||'').trim()
      ).every(label=>expenseCategory.test(label));
    if(!flat && (income<0||expenses<=income+1||profit<=expenses+1))continue;

    const revenueRow=flat?income:income+1;
    if(!flat && revenueRow>=expenses)continue;

    const actualRevenue=months.map((_,i)=>
      cachedValue(sheet.getRow(revenueRow).getCell(i+2))
    );
    const actualProfit=months.map((_,i)=>{
      const revenueValues=[];
      const expenseValues=[];
      for(let r=flat?income:income+1;r<(flat?income+1:expenses);r++)
        revenueValues.push(cachedValue(sheet.getRow(r).getCell(i+2)));
      for(let r=flat?income+1:expenses+1;r<profit;r++)
        expenseValues.push(cachedValue(sheet.getRow(r).getCell(i+2)));
      if([...revenueValues,...expenseValues].some(v=>v===null))return null;
      return revenueValues.reduce((sum,v)=>sum+v,0)-
        expenseValues.reduce((sum,v)=>sum+v,0);
    });

    selected={sheet,revenueRow,profit,actualRevenue,actualProfit};
    break;
  }

  if(!selected)return original;
  const {sheet,revenueRow,profit,actualRevenue,actualProfit}=selected;
  const q="'"+sheet.name.replace(/'/g,"''")+"'";

  const built=await addChart(original,{
    type:'column',
    title:'Monthly Revenue vs Net Profit',
    sheet:sheet.name,
    categories:`${q}!$B$4:$M$4`,
    series:[
      {nameRef:`${q}!$A$${revenueRow}`,
        ref:`${q}!$B$${revenueRow}:$M$${revenueRow}`,
        color:'#B39250'},
      {nameRef:`${q}!$A$${profit}`,
        ref:`${q}!$B$${profit}:$M$${profit}`,
        color:'#34383D'}
    ],
    anchor:{col:1,row:15},
    width:740,height:430,legend:'b',
    dataLabels:false,numberFormat:'#,##0'
  });

  const zip=await JSZip.loadAsync(built);
  const paths=Object.keys(zip.files).filter(name=>
    /^xl\/charts\/chart\d+\.xml$/.test(name));
  if(paths.length!==1)throw new Error('UNEXPECTED_BUDGET_CHART_COUNT');

  let xml=await zip.file(paths[0]).async('string');
  let index=0;
  xml=xml.replace(/<c:ser>[\s\S]*?<\/c:ser>/g,block=>{
    const i=index++;
    if(i>1)throw new Error('UNEXPECTED_BUDGET_SERIES');
    let next=inject(block,'tx','strRef','str',
      [i===0?'Revenue':'Net Profit']);
    next=inject(next,'cat','strRef','str',months.map((_,j)=>
      String(sheet.getRow(4).getCell(j+2).value)));
    const values=i===0?actualRevenue:actualProfit;
    // Cache only verifiably numeric inputs; formulas recalculate on load.
    return values.every(v=>v!==null)
      ?inject(next,'val','numRef','num',values):next;
  });
  if(index!==2)throw new Error('MISSING_BUDGET_CHART_SERIES');
  zip.file(paths[0],xml);
  const output=Buffer.from(await zip.generateAsync({
    type:'nodebuffer',compression:'DEFLATE'
  }));
  const report=await validate(output);
  if(report.valid!==true)throw new Error('BUDGET_CHART_INVALID');
  return output;
}

export async function renderXLSXWithChart(plan){
  const original=await renderXLSXV3(plan);

  const book=new ExcelJS.Workbook();
  await book.xlsx.load(original);

  const ws=book.getWorksheet('AP Variance')||
    book.getWorksheet('AP Variance Analysis');

  if(!ws)return chartMonthlyBudget(original,book);

  const labels=[];
  const planned=[];
  const actual=[];

  for(let row=8;row<=ws.rowCount&&labels.length<10;row++){
    const name=ws.getCell(`C${row}`).value;

    if(name==='TOTAL')break;
    if(typeof name!=='string'||!name.trim())break;

    const p=cachedValue(ws.getCell(`D${row}`));
    const a=cachedValue(ws.getCell(`E${row}`));

    // Do not chart incomplete financial records.
    if(p===null||a===null)return original;

    labels.push(name.slice(0,90));
    planned.push(p);
    actual.push(a);
  }

  if(labels.length<2)return original;

  const last=7+labels.length;
  const q="'"+ws.name.replace(/'/g,"''")+"'";

  const built=await addChart(original,{
    type:'column',
    title:'Planned vs Actual Expenses',
    sheet:ws.name,
    categories:`${q}!$C$8:$C$${last}`,
    series:[
      {
        nameRef:`${q}!$D$7`,
        ref:`${q}!$D$8:$D$${last}`,
        color:'#B39250'
      },
      {
        nameRef:`${q}!$E$7`,
        ref:`${q}!$E$8:$E$${last}`,
        color:'#34383D'
      }
    ],
    anchor:{col:9,row:7},
    width:740,
    height:430,
    legend:'b',
    dataLabels:true,
    numberFormat:'#,##0'
  });

  const zip=await JSZip.loadAsync(built);
  const chartPaths=Object.keys(zip.files).filter(
    name=>/^xl\/charts\/chart\d+\.xml$/.test(name)
  );

  if(chartPaths.length!==1)
    throw new Error('UNEXPECTED_CHART_COUNT');

  const path=chartPaths[0];
  const xml=await zip.file(path).async('string');

  let index=0;

  const corrected=xml.replace(
    /<c:ser>[\s\S]*?<\/c:ser>/g,
    block=>{
      const i=index++;
      if(i>1)throw new Error('UNEXPECTED_CHART_SERIES');

      let result=inject(block,'tx','strRef','str',
        [i===0?'Planned':'Actual']);

      result=inject(result,'cat','strRef','str',
        labels);

      return inject(result,'val','numRef','num',
        i===0?planned:actual);
    }
  );

  if(index!==2)throw new Error('MISSING_CHART_SERIES');

  zip.file(path,corrected);

  const output=Buffer.from(await zip.generateAsync({
    type:'nodebuffer',
    compression:'DEFLATE'
  }));

  const report=await validate(output);

  if(report.valid!==true)
    throw new Error('EXCEL_CHART_PACKAGE_INVALID');

  return output;
}
