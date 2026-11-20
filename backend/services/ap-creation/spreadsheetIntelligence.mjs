import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {renderXLSX} from './spreadsheets.mjs';

const DARK='FF202126';
const GOLD='FFB39250';
const WHITE='FFFFFFFF';
const LIGHT='FFF6F3EC';

function columnLetter(n){
  let result='';
  while(n>0){
    n--;
    result=String.fromCharCode(65+n%26)+result;
    n=Math.floor(n/26);
  }
  return result;
}

function uniqueName(workbook){
  const existing=new Set(
    workbook.worksheets.map(s=>s.name.toLowerCase())
  );
  let index=1;
  while(index<100){
    const name=index===1
      ? 'AP Overview'
      : `AP Overview ${index}`;
    if(!existing.has(name.toLowerCase()))return name;
    index++;
  }
  throw new Error('DASHBOARD_NAME_UNAVAILABLE');
}

export async function renderXLSXV2(plan){
  // Reuse and preserve the already tested V1 renderer.
  const original=await renderXLSX(plan);
  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(original);

  const dataSheets=[...workbook.worksheets];
  const overview=workbook.addWorksheet(uniqueName(workbook),{
    views:[{state:'frozen',ySplit:7}],
    properties:{tabColor:{argb:GOLD}}
  });

  overview.columns=[
    {width:3},
    {width:29},
    {width:13},
    {width:27},
    {width:22},
    {width:17}
  ];

  overview.mergeCells('B2:F3');

  const title=overview.getCell('B2');
  title.value='AP SYNAPSE  /  WORKBOOK OVERVIEW';
  title.font={
    name:'Aptos Display',
    size:17,
    bold:true,
    color:{argb:WHITE}
  };
  title.fill={
    type:'pattern',
    pattern:'solid',
    fgColor:{argb:DARK}
  };
  title.alignment={
    vertical:'middle',
    horizontal:'center'
  };

  overview.getRow(2).height=30;
  overview.getRow(3).height=24;

  const sheets=plan.sheets;
  const dataRowCount=sheets.reduce(
    (total,s)=>total+s.rows.length,0
  );

  overview.getCell('B5').value='WORKSHEETS';
  overview.getCell('C5').value=sheets.length;
  overview.getCell('D5').value='SOURCE ROWS';
  overview.getCell('E5').value=dataRowCount;

  for(const address of ['B5','D5']){
    const cell=overview.getCell(address);
    cell.font={
      name:'Aptos',
      bold:true,
      color:{argb:GOLD}
    };
  }

  for(const address of ['C5','E5']){
    const cell=overview.getCell(address);
    cell.font={
      name:'Aptos Display',
      size:16,
      bold:true,
      color:{argb:DARK}
    };
  }

  const summaries=sheets.map((source,index)=>{
    const numericIndex=source.columns.findIndex(c=>
      c.type==='number'||c.type==='currency'
    );

    const metric=numericIndex>=0
      ? source.columns[numericIndex]
      : null;

    return {
      source,
      worksheet:dataSheets[index],
      count:source.rows.length,
      numericIndex,
      metric
    };
  });

  overview.addTable({
    name:'APArtifactOverview',
    ref:'B7',
    headerRow:true,
    totalsRow:false,
    style:{
      theme:'TableStyleLight1',
      showRowStripes:false
    },
    columns:[
      {name:'Worksheet'},
      {name:'Rows'},
      {name:'Metric'},
      {name:'Total'},
      {name:'Type'}
    ],
    rows:summaries.map(item=>[
      item.worksheet.name,
      item.count,
      item.metric?.header||'No numeric metric',
      null,
      item.metric?.type||'text'
    ])
  });

  const header=overview.getRow(7);
  header.height=30;

  for(let col=2;col<=6;col++){
    const cell=header.getCell(col);
    cell.font={
      name:'Aptos',
      bold:true,
      size:11,
      color:{argb:WHITE}
    };
    cell.fill={
      type:'pattern',
      pattern:'solid',
      fgColor:{argb:GOLD}
    };
  }

  const symbol=/^[₹$€£¥]$/.test(
    plan.currencySymbol||''
  )?plan.currencySymbol:'';

  for(let i=0;i<summaries.length;i++){
    const item=summaries[i];
    const rowNumber=i+8;
    const row=overview.getRow(rowNumber);
    row.height=26;

    for(let col=2;col<=6;col++){
      const cell=row.getCell(col);
      cell.fill={
        type:'pattern',
        pattern:'solid',
        fgColor:{argb:i%2===0?WHITE:LIGHT}
      };
      cell.font={
        name:'Aptos',
        size:10,
        color:{argb:DARK},
        bold:col===2
      };
      cell.alignment={
        vertical:'middle',
        horizontal:col===3||col===5?'right':'left',
        indent:col===4||col===6?1:0
      };
    }

    if(item.numericIndex<0){
      row.getCell(5).value='—';
      continue;
    }

    if(item.count===0){
      row.getCell(5).value=0;
      continue;
    }

    const column=columnLetter(item.numericIndex+1);
    const sheetName=item.worksheet.name.replace(/'/g,"''");

    const formula=`SUM('${sheetName}'!${column}5:${column}${item.count+4})`;

    const values=item.source.rows.map(record=>
      record[item.metric.key]
    );

    const known=values.every(value=>
      value==null||value===''||
      (typeof value==='number'&&Number.isFinite(value))
    );

    const result=known?values.reduce(
      (sum,value)=>sum+(typeof value==='number'?value:0),0
    ):undefined;

    row.getCell(5).value=known
      ? {formula,result}
      : {formula};

    row.getCell(5).numFmt=
      item.metric.type==='currency'
        ? `"${symbol}"#,##0.00;[Red](#,##0.00)`
        : '#,##0.00';
  }

  workbook.calcProperties.fullCalcOnLoad=true;

  const overviewIndex=workbook.worksheets.length-1;
  workbook.views=[{
    x:0,y:0,width:10000,height:20000,
    firstSheet:overviewIndex,
    activeTab:overviewIndex,
    visibility:'visible'
  }];

  // AP_OVERVIEW_XML_TOTAL_FIX_V1
  // ExcelJS serialization can incorrectly mark this table
  // as having a totals row, even when totalsRow is false.
  const raw=await workbook.xlsx.writeBuffer();
  const zip=await JSZip.loadAsync(raw);

  const tablePath='xl/tables/table1.xml';
  const part=zip.file(tablePath);

  if(!part)throw new Error('OVERVIEW_TABLE_MISSING');

  const xml=await part.async('string');

  const markers=xml.match(/totalsRowShown="[01]"/g)||[];

  if(markers.length!==1)
    throw new Error('UNEXPECTED_TABLE_XML');

  const fixed=xml.replace(
    /totalsRowShown="[01]"/,
    'totalsRowShown="0"'
  );

  zip.file(tablePath,fixed);

  return Buffer.from(await zip.generateAsync({
    type:'nodebuffer',
    compression:'DEFLATE'
  }));
}
