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

export async function renderXLSXWithChart(plan){
  const original=await renderXLSXV3(plan);

  const book=new ExcelJS.Workbook();
  await book.xlsx.load(original);

  const ws=book.getWorksheet('AP Variance')||
    book.getWorksheet('AP Variance Analysis');

  if(!ws)return original;

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
