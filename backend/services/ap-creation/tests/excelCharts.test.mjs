import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import {renderXLSXWithChart} from '../excelCharts.mjs';

const budget={
  title:'Example Budget',
  currencySymbol:'₹',
  sheets:[{
    name:'Budget',
    columns:[
      {key:'item',header:'Item',type:'text'},
      {key:'planned',header:'Planned',type:'currency'},
      {key:'actual',header:'Actual',type:'currency'}
    ],
    rows:[
      {item:'Hosting',planned:1800,actual:1200},
      {item:'Storage',planned:500,actual:400},
      {item:'Other',planned:300,actual:250}
    ]
  }]
};

test('creates native chart with correct caches',async()=>{
  const result=await renderXLSXWithChart(budget);
  const zip=await JSZip.loadAsync(result);

  const chart=await zip.file('xl/charts/chart1.xml')
    .async('string');

  assert.match(chart,/Planned/);
  assert.match(chart,/Actual/);
  assert.match(chart,/Hosting/);
  assert.match(chart,/Storage/);
  assert.match(chart,/Other/);
  assert.match(chart,/<c:v>1800<\/c:v>/);

  const book=new ExcelJS.Workbook();
  await book.xlsx.load(result);

  const ws=book.getWorksheet('AP Variance');

  assert.equal(ws.getCell('D11').result,2600);
  assert.equal(ws.getCell('E11').result,1850);
  assert.equal(ws.getCell('F11').result,-750);
});

test('ordinary spreadsheets stay unchanged',async()=>{
  const result=await renderXLSXWithChart({
    title:'Inventory',
    sheets:[{
      name:'Products',
      columns:[
        {key:'item',header:'Item',type:'text'},
        {key:'stock',header:'Stock',type:'number'}
      ],
      rows:[
        {item:'Product A',stock:10}
      ]
    }]
  });

  const zip=await JSZip.loadAsync(result);

  assert.equal(
    zip.file('xl/charts/chart1.xml'),
    null
  );
});

test('missing financial values do not create misleading charts',async()=>{
  const incomplete=structuredClone(budget);
  incomplete.sheets[0].rows[0].actual=null;

  const result=await renderXLSXWithChart(incomplete);
  const zip=await JSZip.loadAsync(result);

  assert.equal(
    zip.file('xl/charts/chart1.xml'),
    null
  );
});
