import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

import {renderXLSX} from '../spreadsheets.mjs';
import {renderXLSXWithChart} from '../excelCharts.mjs';
import {renderXLSXV2} from '../spreadsheetIntelligence.mjs';
import {renderDOCX} from '../premiumRenderers.mjs';
import {renderSlidesV3} from '../presentationIntelligence.mjs';
import {
  requestedPresentationSlides,
  enforcePresentationSlideCount
} from '../engine.mjs';

function budgetPlan(){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const columns=[
    {key:'category',header:'Category',type:'text'},
    ...months.map((month,i)=>({key:`m${i}`,header:month,type:'currency'})),
    {key:'annual',header:'Annual Total',type:'currency'}
  ];
  const make=(name,value)=>({
    category:name,
    ...Object.fromEntries(months.map((_,i)=>[`m${i}`,value])),
    annual:{formula:'SUM(B3:M3)'} // deliberately incorrect model output
  });
  return {
    title:'Annual Business Budget',currencySymbol:'$',
    sheets:[{
      name:'Budget',columns,
      rows:[
        {category:'INCOME'},
        make('Sales Revenue',1000),
        {category:'EXPENSES'},
        make('Payroll',200),
        make('Marketing',100),
        make('Operations',50),
        {...make('NET PROFIT',0),m0:{formula:'B3-B5-B6-B7'}}
      ],
      totals:{label:'Grand Totals',formulas:{annual:'SUM(N3:N7)'}}
    }]
  };
}

test('monthly financial formulas reference actual rendered row numbers',async()=>{
  const output=await renderXLSX(budgetPlan());
  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(output);
  const sheet=workbook.getWorksheet('Budget');
  assert.equal(sheet.getCell('N6').formula,'SUM(B6:M6)');
  assert.equal(sheet.getCell('N8').formula,'SUM(B8:M8)');
  assert.equal(sheet.getCell('N9').formula,'SUM(B9:M9)');
  assert.equal(sheet.getCell('B11').formula,'SUM(B6:B6)-SUM(B8:B10)');
  assert.equal(sheet.getCell('N11').formula,'SUM(B11:M11)');
  assert.equal(sheet.getCell('N12').formula,'N11');
});

test('overview summarizes net profit rather than summing budget categories',async()=>{
  const output=await renderXLSXV2(budgetPlan());
  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(output);
  const overview=workbook.getWorksheet('AP Overview');
  assert.equal(overview.getCell('D8').value,'Annual Net Profit');
  assert.equal(overview.getCell('E8').formula,"'Budget'!N11");
});

test('normal monthly budget includes an embedded editable Excel chart',async()=>{
  const output=await renderXLSXWithChart(budgetPlan());
  const zip=await JSZip.loadAsync(output);
  assert.ok(Object.keys(zip.files).some(name=>
    /^xl\/charts\/chart\d+\.xml$/.test(name)
  ),'budget must include a native Excel chart');
});

test('Word control matrix bullets become a real editable table',async()=>{
  const output=await renderDOCX({
    title:'Cybersecurity Best Practices',
    sections:[{
      heading:'Security Control Matrix',
      body:'Recommended controls and their function.',
      bullets:[
        'Control: MFA | Function: Identity Verification',
        'Control: EDR | Function: Threat Monitoring',
        'Control: Encryption | Function: Data Protection'
      ]
    }]
  });
  const zip=await JSZip.loadAsync(output);
  const xml=await zip.file('word/document.xml').async('string');
  assert.match(xml,/<w:tbl>/);
  assert.match(xml,/Identity Verification/);
  assert.match(xml,/Threat Monitoring/);
});

test('five requested PowerPoint slides includes the cover, not six',async()=>{
  assert.equal(requestedPresentationSlides('Create a 5-slide PowerPoint'),5);
  assert.equal(requestedPresentationSlides('Make five slides'),5);
  const plan={title:'Artificial Intelligence',slides:[
    {type:'overview',title:'Agenda',items:['Benefits','Risks']},
    {type:'content',title:'Definition',body:'What AI means'},
    {type:'comparison',title:'Benefits and Challenges',left:{title:'Benefits',bullets:['Efficiency']},right:{title:'Challenges',bullets:['Privacy']}},
    {type:'content',title:'Applications',body:'Examples'},
    {type:'closing',title:'Conclusion',body:'Responsible innovation'}
  ]};
  const capped=enforcePresentationSlideCount(plan,5);
  assert.equal(capped.slides.length,4);
  assert.equal(capped.slides.at(-1).type,'closing');
  const output=await renderSlidesV3(capped);
  const zip=await JSZip.loadAsync(output);
  const slides=Object.keys(zip.files).filter(name=>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );
  assert.equal(slides.length,5);
});
