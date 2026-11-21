import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {renderXLSXV2} from './spreadsheetIntelligence.mjs';

const DARK='FF202126';
const GOLD='FFB39250';
const WHITE='FFFFFFFF';
const PALE='FFF6F3EC';

function letter(index){
  let s='';
  for(let n=index;n>0;n=Math.floor((n-1)/26)){
    s=String.fromCharCode(65+(n-1)%26)+s;
  }
  return s;
}

function numeric(value){
  return typeof value==='number'&&Number.isFinite(value);
}

function columnIndex(columns,words){
  return columns.findIndex(c=>{
    const name=String(`${c.key||''} ${c.header||''}`)
      .toLowerCase();
    return words.some(w=>name.includes(w));
  });
}

function analyze(plan,workbook){
  return plan.sheets.flatMap((source,index)=>{
    const columns=source.columns;
    const planned=columnIndex(columns,
      ['planned','budget','forecast','target']);
    const actual=columnIndex(columns,
      ['actual','spent','realized']);

    if(planned<0||actual<0||planned===actual)return [];

    const label=Math.max(
      0,columns.findIndex(c=>c.type==='text')
    );

    const sheet=workbook.worksheets[index];
    if(!sheet)throw new Error('SOURCE_WORKSHEET_MISSING');

    return source.rows.map((record,i)=>({
      sheet,
      name:String(record[columns[label].key]??`Item ${i+1}`)
        .slice(0,100),
      row:i+5,
      planCol:letter(planned+1),
      actualCol:letter(actual+1),
      planned:record[columns[planned].key],
      actual:record[columns[actual].key]
    }));
  });
}

function putFormula(cell,formula,result){
  cell.value=result===undefined
    ?{formula}
    :{formula,result};
}

export async function renderXLSXV3(plan){
  const original=await renderXLSXV2(plan);

  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(original);

  const records=analyze(plan,workbook);

  // Ordinary workbooks remain backward-compatible.
  if(!records.length)return original;

  if(records.length>1000)
    throw new Error('TOO_MANY_ANALYTICS_ROWS');

  const name=workbook.getWorksheet('AP Variance')
    ?'AP Variance Analysis':'AP Variance';

  const ws=workbook.addWorksheet(name,{
    views:[{state:'frozen',ySplit:7}],
    properties:{tabColor:{argb:GOLD}}
  });

  ws.columns=[
    {width:3},
    {width:24},
    {width:32},
    {width:19},
    {width:19},
    {width:19},
    {width:18},
    {width:19}
  ];

  ws.mergeCells('B2:H3');

  const title=ws.getCell('B2');
  title.value='AP SYNAPSE  /  VARIANCE INTELLIGENCE';
  title.fill={
    type:'pattern',pattern:'solid',
    fgColor:{argb:DARK}
  };
  title.font={
    name:'Aptos Display',
    size:18,bold:true,color:{argb:WHITE}
  };
  title.alignment={
    horizontal:'center',vertical:'middle'
  };

  ws.getRow(2).height=30;
  ws.getRow(3).height=23;

  const labels={
    B5:'TOTAL BUDGET',
    D5:'TOTAL ACTUAL',
    F5:'NET VARIANCE'
  };

  for(const [address,value] of Object.entries(labels)){
    const cell=ws.getCell(address);
    cell.value=value;
    cell.font={
      name:'Aptos',bold:true,
      size:10,color:{argb:GOLD}
    };
  }

  const headers=[
    'Worksheet','Item','Planned','Actual',
    'Variance','Variance %','Status'
  ];

  headers.forEach((value,i)=>{
    const cell=ws.getCell(7,i+2);
    cell.value=value;
    cell.font={
      name:'Aptos',bold:true,
      color:{argb:WHITE},size:10
    };
    cell.fill={
      type:'pattern',pattern:'solid',
      fgColor:{argb:DARK}
    };
    cell.alignment={
      vertical:'middle',wrapText:true
    };
  });

  ws.getRow(7).height=31;

  const money=/^[₹$€£¥]$/.test(plan.currencySymbol||'')
    ?plan.currencySymbol:'';

  const format=money
    ?`"${money}"#,##0.00;[Red]("${money}"#,##0.00)`
    :'#,##0.00;[Red](#,##0.00)';

  // Negative variance represents savings, not an expense warning.
  const varianceNumFmt=money
    ? `"${money}"#,##0.00;("${money}"#,##0.00)`
    : '#,##0.00;(#,##0.00)';

  let totalPlanned=0;
  let totalActual=0;
  let allKnown=true;

  for(let i=0;i<records.length;i++){
    const item=records[i];
    const r=i+8;
    const row=ws.getRow(r);
    row.height=24;

    const quoted=item.sheet.name.replace(/'/g,"''");
    const plannedRef=`'${quoted}'!${item.planCol}${item.row}`;
    const actualRef=`'${quoted}'!${item.actualCol}${item.row}`;

    const known=numeric(item.planned)&&numeric(item.actual);

    if(known){
      totalPlanned+=item.planned;
      totalActual+=item.actual;
    }else{
      allKnown=false;
    }

    row.getCell(2).value=item.sheet.name;
    row.getCell(3).value=item.name;

    putFormula(
      row.getCell(4),
      `IF(ISNUMBER(${plannedRef}),${plannedRef},"")`,
      numeric(item.planned)?item.planned:undefined
    );

    putFormula(
      row.getCell(5),
      `IF(ISNUMBER(${actualRef}),${actualRef},"")`,
      numeric(item.actual)?item.actual:undefined
    );

    const delta=known?item.actual-item.planned:undefined;

    putFormula(
      row.getCell(6),
      `IF(AND(ISNUMBER(D${r}),ISNUMBER(E${r})),E${r}-D${r},"")`,
      delta
    );

    putFormula(
      row.getCell(7),
      `IFERROR(IF(D${r}=0,"",F${r}/D${r}),"")`,
      known
        ?item.planned===0?'':delta/item.planned
        :undefined
    );

    putFormula(
      row.getCell(8),
      `IF(F${r}="","Unknown",IF(F${r}>0,"Over budget",IF(F${r}<0,"Under budget","On target")))`,
      known
        ?delta>0?'Over budget':delta<0?'Under budget':'On target'
        :undefined
    );

    for(let col=2;col<=8;col++){
      const cell=row.getCell(col);
      cell.font={
        name:'Aptos',size:10,color:{argb:DARK}
      };
      cell.fill={
        type:'pattern',pattern:'solid',
        fgColor:{argb:i%2?PALE:WHITE}
      };
    }

    for(const col of [4,5,6]){
      row.getCell(col).numFmt=format;
    }

    row.getCell(7).numFmt='0.0%';

    // Positive spending variance means over budget.
    if(known){
      const color=delta>0?'FFB04747':
        delta<0?'FF277552':DARK;
      row.getCell(6).font={
        name:'Aptos',bold:true,
        color:{argb:color}
      };
    }
  }

  const last=records.length+7;
  const totalRow=last+1;

  ws.getCell(`C${totalRow}`).value='TOTAL';

  const totalFormula={
    D:`IF(COUNT(D8:D${last})=ROWS(D8:D${last}),SUM(D8:D${last}),"")`,
    E:`IF(COUNT(E8:E${last})=ROWS(E8:E${last}),SUM(E8:E${last}),"")`,
    F:`IF(AND(ISNUMBER(D${totalRow}),ISNUMBER(E${totalRow})),E${totalRow}-D${totalRow},"")`,
    G:`IFERROR(IF(AND(ISNUMBER(D${totalRow}),ISNUMBER(E${totalRow}),D${totalRow}<>0),F${totalRow}/D${totalRow},""),"")`
  };

  const results=allKnown?{
    D:totalPlanned,
    E:totalActual,
    F:totalActual-totalPlanned,
    G:totalPlanned
      ?(totalActual-totalPlanned)/totalPlanned
      :''
  }:{};

  for(const [col,formula] of Object.entries(totalFormula)){
    const cell=ws.getCell(`${col}${totalRow}`);
    putFormula(cell,formula,results[col]);
    cell.numFmt=col==='G'?'0.0%':col==='F'?varianceNumFmt:format;
  }

  for(let col=2;col<=8;col++){
    const cell=ws.getRow(totalRow).getCell(col);
    cell.fill={
      type:'pattern',pattern:'solid',
      fgColor:{argb:'FFE8D9B8'}
    };
    cell.font={
      name:'Aptos',bold:true,
      color:{argb:DARK}
    };
  }

  // Cached colors for viewers that do not apply conditional styles.
  if(allKnown){
    const varianceColor=totalActual<totalPlanned
      ?'FF277552'
      :totalActual>totalPlanned?'FFB04747':DARK;

    ws.getCell(`F${totalRow}`).font={
      name:'Aptos',bold:true,
      color:{argb:varianceColor}
    };
  }

  putFormula(ws.getCell('C5'),
    `D${totalRow}`,results.D);
  putFormula(ws.getCell('E5'),
    `E${totalRow}`,results.E);
  putFormula(ws.getCell('G5'),
    `F${totalRow}`,results.F);

  for(const address of ['C5','E5','G5']){
    const cell=ws.getCell(address);
    cell.numFmt=address==='G5'?varianceNumFmt:format;
    cell.font={
      name:'Aptos Display',size:15,
      bold:true,color:{argb:DARK}
    };
  }

  ws.autoFilter={
    from:{row:7,column:2},
    to:{row:last,column:8}
  };

  ws.addConditionalFormatting({
    ref:`F8:F${totalRow}`,
    rules:[
      {
        type:'cellIs',
        operator:'greaterThan',
        formulae:['0'],
        style:{
          font:{color:{argb:'FFB04747'}}
        }
      },
      {
        type:'cellIs',
        operator:'lessThan',
        formulae:['0'],
        style:{
          font:{color:{argb:'FF277552'}}
        }
      }
    ]
  });

  // Keep summary colors correct after spreadsheet input changes.
  ws.addConditionalFormatting({
    ref:'G5',
    rules:[
      {
        type:'cellIs',
        operator:'lessThan',
        formulae:['0'],
        style:{font:{color:{argb:'FF277552'}}}
      },
      {
        type:'cellIs',
        operator:'greaterThan',
        formulae:['0'],
        style:{font:{color:{argb:'FFB04747'}}}
      }
    ]
  });

  workbook.calcProperties.fullCalcOnLoad=true;
  workbook.calcProperties.forceFullCalc=true;

  const raw=await workbook.xlsx.writeBuffer();
  const zip=await JSZip.loadAsync(raw);

  // Preserve the verified V2.2 table compatibility fix.
  const tableFiles=Object.keys(zip.files).filter(name=>
    /^xl\/tables\/table\d+\.xml$/.test(name)
  );

  for(const path of tableFiles){
    const xml=await zip.file(path).async('string');
    zip.file(path,xml.replace(
      /totalsRowShown="1"/g,
      'totalsRowShown="0"'
    ));
  }

  return Buffer.from(await zip.generateAsync({
    type:'nodebuffer',
    compression:'DEFLATE'
  }));
}
