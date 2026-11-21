import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderPDF,renderDOCX,renderSlides
} from '../premiumRenderers.mjs';

const plan={
  title:'AP Synapse Professional Report',
  subtitle:'Design and Rendering Validation',
  sections:[
    {
      heading:'Executive Summary',
      body:'A professional report containing meaningful content.',
      bullets:['Clear typography','Structured information']
    },
    {
      heading:'Performance',
      body:'Detailed analysis and recommendations.',
      bullets:['Reliable data','Editable documents']
    }
  ]
};

test('premium PDF generates valid bytes',async()=>{
  const buffer=await renderPDF(plan);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length>1000);
  assert.equal(buffer.subarray(0,4).toString(),'%PDF');
});

test('premium Word document generates DOCX',async()=>{
  const buffer=await renderDOCX(plan);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length>1000);
  assert.equal(buffer.subarray(0,2).toString(),'PK');
});

test('premium PowerPoint generates PPTX',async()=>{
  const buffer=await renderSlides(plan);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length>1000);
  assert.equal(buffer.subarray(0,2).toString(),'PK');
});
