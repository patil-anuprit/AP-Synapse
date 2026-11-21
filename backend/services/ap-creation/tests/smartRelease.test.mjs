
import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {inferNaturalCreation} from '../intent.mjs';
import {renderXLSXV2} from '../spreadsheetIntelligence.mjs';

test('natural prompts route correctly',()=>{
  assert.equal(inferNaturalCreation('Make a business budget'),'xlsx');
  assert.equal(inferNaturalCreation('I need a pitch deck'),'slides');
  assert.equal(inferNaturalCreation('Draft a proposal'),'docx');
  assert.equal(inferNaturalCreation('What is a budget?'),null);
});

test('dashboard formulas use actual financial rows',async()=>{
  const m=['Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'];

  const columns=[
    {key:'item',header:'Category',type:'text'},
    ...m.map((x,i)=>({
      key:'m'+i,header:x,type:'currency'
    })),
    {key:'annual',header:'Annual Total',type:'currency'}
  ];

  const row=(item,x)=>({
    item,
    ...Object.fromEntries(m.map((_,i)=>['m'+i,x])),
    annual:{formula:'SUM(B2:M2)'}
  });

  const plan={
    title:'Budget',
    sheets:[
      {
        name:'Budget',
        columns,
        rows:[
          row('Revenue',1000),
          row('Payroll',200),
          row('Marketing',100),
          row('Operating Expenses',50),
          row('Monthly Profit',0)
        ]
      },
      {
        name:'AP Overview Dashboard',
        columns:[
          {key:'metric',header:'Metric',type:'text'},
          {key:'value',header:'Value',type:'currency'}
        ],
        rows:[
          {metric:'Total Annual Revenue',value:{formula:'Budget!N2'}},
          {metric:'Total Annual Expenses',value:{formula:'Budget!N3'}},
          {metric:'Net Annual Profit',value:{formula:'Budget!N6'}}
        ]
      }
    ]
  };

  const wb=new ExcelJS.Workbook();
  await wb.xlsx.load(await renderXLSXV2(plan));

  const d=wb.getWorksheet('AP Overview Dashboard');

  assert.equal(d.getCell('B5').formula,"'Budget'!N5");
  assert.equal(d.getCell('B6').formula,"SUM('Budget'!N6:N8)");
  assert.equal(d.getCell('B7').formula,"'Budget'!N9");

  assert.equal(
    wb.getWorksheet('AP Overview').getCell('E9').formula,
    "'AP Overview Dashboard'!B7"
  );
});
