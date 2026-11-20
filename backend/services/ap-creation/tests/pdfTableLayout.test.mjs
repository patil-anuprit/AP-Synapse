import test from 'node:test';
import assert from 'node:assert/strict';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {renderPDF} from '../premiumRenderers.mjs';

test('section following PDF table is left aligned',async()=>{
  const buffer=await renderPDF({
    title:'AP Synapse PDF Layout Validation',
    subtitle:'Table and Section Alignment',
    sections:[
      {
        heading:'Platform Capabilities',
        body:'Supported outputs are shown below.',
        table:{
          headers:['Capability','Format','Editable'],
          rows:[
            ['Reports','PDF','No'],
            ['Documents','DOCX','Yes'],
            ['Spreadsheets','XLSX','Yes']
          ]
        }
      },
      {
        heading:'Implementation Priorities',
        body:'This paragraph must start at the left margin.',
        bullets:[
          'Consistent formatting',
          'Reliable pagination'
        ]
      }
    ]
  });

  const task=getDocument({
    data:new Uint8Array(buffer),
    useSystemFonts:true
  });

  try{
    const document=await task.promise;

    assert.equal(document.numPages,1);

    const page=await document.getPage(1);
    const content=await page.getTextContent();

    const heading=content.items.find(
      item=>String(item.str||'')
        .includes('Implementation')
    );

    assert.ok(heading,'Missing section heading');

    const x=heading.transform[4];

    assert.ok(
      x>=55 && x<=100,
      `Heading is incorrectly positioned at x=${x}`
    );

    console.log(
      `PASS: Heading starts at x=${x.toFixed(1)} pt`
    );
  }finally{
    await task.destroy();
  }
});
