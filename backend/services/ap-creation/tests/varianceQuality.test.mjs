import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {renderXLSXV3} from '../varianceIntelligence.mjs';

function input(actual=1200){
  return {
    title:'Financial Validation',
    currencySymbol:'₹',
    sheets:[{
      name:'Budget',
      columns:[
        {key:'item',header:'Item',type:'text'},
        {key:'planned',header:'Planned',type:'currency'},
        {key:'actual',header:'Actual',type:'currency'}
      ],
      rows:[
        {item:'Hosting',planned:1500,actual},
        {item:'Storage',planned:500,actual:400}
      ]
    }]
  };
}

async function load(plan){
  const buffer=await renderXLSXV3(plan);
  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook.getWorksheet('AP Variance');
}

test('savings totals have correct formulas and colors',async()=>{
  const ws=await load(input());

  assert.equal(ws.getCell('F10').result,-400);
  assert.equal(ws.getCell('G5').result,-400);

  assert.doesNotMatch(
    ws.getCell('F10').numFmt,
    /\[Red\]/i
  );

  assert.doesNotMatch(
    ws.getCell('G5').numFmt,
    /\[Red\]/i
  );

  assert.equal(
    ws.getCell('F10').font.color.argb,
    'FF277552'
  );

  assert.ok(
    ws.conditionalFormattings.some(x=>x.ref==='G5')
  );

  assert.ok(
    ws.conditionalFormattings.some(x=>x.ref==='F8:F10')
  );
});

test('missing actual expense cannot produce a partial grand total',async()=>{
  const ws=await load(input(null));

  assert.equal(ws.getCell('E10').result,undefined);
  assert.equal(ws.getCell('F10').result,undefined);
  assert.equal(ws.getCell('G5').result,undefined);

  assert.match(
    ws.getCell('E10').formula,
    /COUNT\(E8:E9\)=ROWS\(E8:E9\)/
  );

  assert.match(
    ws.getCell('F10').formula,
    /ISNUMBER/
  );
});
