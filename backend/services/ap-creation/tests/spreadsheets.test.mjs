import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {renderXLSX} from '../spreadsheets.mjs';
import {routeIntent} from '../intent.mjs';

test('recognizes spreadsheet creation', () => {
  assert.equal(routeIntent('Create an Excel budget'), 'xlsx');
  assert.equal(routeIntent('Generate an XLSX file'), 'xlsx');
  assert.equal(routeIntent('Explain what Excel is'), null);
});

test('creates a readable styled workbook with formulas', async () => {
  const buffer = await renderXLSX({
    title: 'AP Synapse Budget',
    currencySymbol: '₹',
    sheets: [{
      name: 'Budget',
      columns: [
        {key:'item', header:'Item', type:'text'},
        {key:'amount', header:'Amount', type:'currency'}
      ],
      rows: [{item:'Hosting',amount:120}],
      totals: {label:'Total',formulas:{amount:'SUM(B5:B5)'}}
    }]
  });

  assert.ok(buffer.length > 1000);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet('Budget');

  assert.equal(sheet.getCell('A5').value, 'Hosting');
  assert.equal(sheet.getCell('B5').value, 120);
  assert.equal(sheet.getCell('B6').formula, 'SUM(B5:B5)');
});

test('rejects unsupported external-style formulas', async () => {
  await assert.rejects(() => renderXLSX({
    title:'Unsafe',
    sheets:[{
      name:'Sheet 1',
      columns:[{key:'value',header:'Value'}],
      rows:[{value:{formula:'WEBSERVICE("https://example.com")'}}]
    }]
  }));
});
