import assert from 'node:assert/strict';
import {renderPDF,renderDOCX,renderSlides} from '../renderers.mjs';
const plan={title:'AP Synapse Smoke Test',subtitle:'GitHub Action',sections:[{heading:'Overview',body:'Testing the installed creation engine.',bullets:['One','Two']} ]};
for(const [kind,make,signature] of [['pdf',renderPDF,'%PDF'],['docx',renderDOCX,'PK'],['pptx',renderSlides,'PK']]) {
  const b=await make(plan);
  assert.ok(Buffer.isBuffer(b)&&b.length>500,kind+' renderer returned no file');
  assert.equal(b.subarray(0,signature.length).toString(),signature,kind+' magic bytes wrong');
  console.log('PASS:',kind,b.length,'bytes');
}
