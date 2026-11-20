import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {renderXLSXV2} from '../spreadsheetIntelligence.mjs';

test('creates a dashboard linked to source data',async()=>{
  const buffer=await renderXLSXV2({
    title:'Example Operating Budget',
    currencySymbol:'₹',
    sheets:[{
      name:'Operating Budget',
      columns:[
        {key:'item',header:'Expense',type:'text'},
        {key:'cost',header:'Cost',type:'currency'}
      ],
      rows:[
        {item:'Hosting',cost:120},
        {item:'Storage',cost:180}
      ],
      totals:{
        label:'Total',
        formulas:{cost:'SUM(B5:B6)'}
      }
    }]
  });

  assert.equal(buffer.subarray(0,2).toString(),'PK');

  const book=new ExcelJS.Workbook();
  await book.xlsx.load(buffer);

  const data=book.getWorksheet('Operating Budget');
  const overview=book.getWorksheet('AP Overview');

  assert.ok(data);
  assert.ok(overview);

  assert.equal(data.getCell('B5').value,120);
  assert.equal(data.getCell('B6').value,180);

  assert.equal(
    overview.getCell('B8').value,'Operating Budget'
  );

  assert.equal(overview.getCell('C8').value,2);

  assert.equal(
    overview.getCell('E8').formula,
    "SUM('Operating Budget'!B5:B6)"
  );

  assert.equal(overview.getCell('E8').result,300);
});

test('does not fabricate totals from unknown values',async()=>{
  const buffer=await renderXLSXV2({
    title:'Unknown Costs',
    sheets:[{
      name:'Costs',
      columns:[
        {key:'name',header:'Name',type:'text'},
        {key:'cost',header:'Cost',type:'number'}
      ],
      rows:[
        {name:'Item A',cost:null},
        {name:'Item B',cost:{formula:'SUM(B5:B5)'}}
      ]
    }]
  });

  const book=new ExcelJS.Workbook();
  await book.xlsx.load(buffer);

  const cell=book.getWorksheet('AP Overview')
    .getCell('E8');

  assert.ok(cell.formula);
  assert.equal(cell.result,undefined);
});
