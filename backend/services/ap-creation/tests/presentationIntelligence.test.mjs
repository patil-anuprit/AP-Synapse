import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSlidesV3} from '../presentationIntelligence.mjs';

test('V3 renders editable presentation structure',async()=>{
  const buffer=await renderSlidesV3({
    title:'AP Synapse Intelligence',
    subtitle:'Professional Presentation',
    slides:[
      {
        type:'overview',
        title:'Capabilities',
        items:['Documents','Spreadsheets','Presentations','Research']
      },
      {
        type:'comparison',
        title:'Solutions',
        left:{title:'Current',bullets:['Manual work','Separate tools']},
        right:{title:'Future',bullets:['Unified workspace','Structured output']}
      },
      {
        type:'timeline',
        title:'Development',
        steps:[
          {title:'Plan',detail:'Define requirements'},
          {title:'Build',detail:'Implement'},
          {title:'Verify',detail:'Test outputs'}
        ]
      },
      {
        type:'chart',
        title:'Illustrative Data',
        chart:{
          kind:'bar',
          name:'Example',
          labels:['A','B','C'],
          values:[12,24,36]
        }
      },
      {
        type:'closing',
        title:'Next Steps',
        body:'Build, test and improve'
      }
    ]
  });

  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length>10000);
  assert.equal(buffer.subarray(0,2).toString(),'PK');
});

test('V3 retains compatibility with prior section plans',async()=>{
  const buffer=await renderSlidesV3({
    title:'Legacy Compatibility',
    sections:[{
      heading:'Summary',
      body:'Important report content.',
      bullets:['First point','Second point']
    }]
  });

  assert.equal(buffer.subarray(0,2).toString(),'PK');
});

test('V3 rejects invalid chart data',async()=>{
  await assert.rejects(
    renderSlidesV3({
      title:'Invalid',
      slides:[{
        type:'chart',
        title:'Bad Data',
        chart:{
          kind:'bar',
          labels:['A','B'],
          values:[10,Infinity]
        }
      }]
    }),
    /INVALID_CHART_DATA/
  );
});
