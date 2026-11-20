import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {renderXLSXV3} from '../varianceIntelligence.mjs';

const plan={
  title:'Operating Budget',
  currencySymbol:'₹',
  sheets:[{
    name:'Budget',
    columns:[
      {key:'item',header:'Item',type:'text'},
      {key:'planned',header:'Planned',type:'currency'},
      {key:'actual',header:'Actual',type:'currency'}
    ],
    rows:[
      {item:'Hosting',planned:1500,actual:1200},
      {item:'Storage',planned:500,actual:400},
      {item:'Other',planned:300,actual:250}
    ]
  }]
};

test('V3 calculates editable financial variances',async()=>{
  const buffer=await renderXLSXV3(plan);
  const book=new ExcelJS.Workbook();
  await book.xlsx.load(buffer);

  const ws=book.getWorksheet('AP Variance');

  assert.ok(ws);
  assert.equal(ws.getCell('D8').result,1500);
  assert.equal(ws.getCell('E8').result,1200);
  assert.equal(ws.getCell('F8').result,-300);
  assert.equal(ws.getCell('G8').result,-0.2);
  assert.equal(ws.getCell('H8').result,'Under budget');

  assert.equal(ws.getCell('D11').result,2300);
  assert.equal(ws.getCell('E11').result,1850);
  assert.equal(ws.getCell('F11').result,-450);

  assert.equal(ws.getCell('G5').result,-450);
  assert.ok(ws.getCell('F8').formula);
});

test('V3 retains corrected structured tables',async()=>{
  const buffer=await renderXLSXV3(plan);
  const zip=await JSZip.loadAsync(buffer);

  const xml=await zip.file('xl/tables/table1.xml')
    .async('string');

  assert.match(xml,/totalsRowShown="0"/);
  assert.match(xml,/TableStyleLight1/);
});

test('V3 does not invent missing actual costs',async()=>{
  const partial=structuredClone(plan);
  partial.sheets[0].rows[0].actual=null;

  const buffer=await renderXLSXV3(partial);
  const book=new ExcelJS.Workbook();
  await book.xlsx.load(buffer);

  const ws=book.getWorksheet('AP Variance');

  assert.equal(ws.getCell('E8').result,undefined);
  assert.equal(ws.getCell('F8').result,undefined);
  assert.equal(ws.getCell('F11').result,undefined);
});

test('V3 preserves ordinary non-budget spreadsheets',async()=>{
  const buffer=await renderXLSXV3({
    title:'Inventory',
    sheets:[{
      name:'Products',
      columns:[
        {key:'name',header:'Name',type:'text'},
        {key:'stock',header:'Stock',type:'number'}
      ],
      rows:[{name:'Item A',stock:10}]
    }]
  });

  const book=new ExcelJS.Workbook();
  await book.xlsx.load(buffer);

  assert.ok(book.getWorksheet('Products'));
  assert.equal(book.getWorksheet('AP Variance'),undefined);
});
