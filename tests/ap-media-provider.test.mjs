import test from 'node:test';
import assert from 'node:assert/strict';
import {createImage,createVideo,startMeshy,startMeshyImage,startMeshyRetexture,pollMeshy,verifiedMeshyLink} from '../backend/services/ap-media/providers.mjs';
const prev=globalThis.fetch;
const oldGem=process.env.GEMINI_API_KEY,oldMesh=process.env.MESHY_API_KEY;
process.env.GEMINI_API_KEY='mock-do-not-use';process.env.MESHY_API_KEY='mock-do-not-use';
function mockJSON(obj){return new Response(JSON.stringify(obj),{status:200,headers:{'content-type':'application/json'}});}
test('image generation parses actual image bytes and sends current image model',async()=>{
  let sent,endpoint;
  globalThis.fetch=async(u,init)=>{endpoint=String(u);sent=JSON.parse(init.body);return mockJSON({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:Buffer.from('PNG').toString('base64')}}]}}]});};
  try{
    const r=await createImage({prompt:'A golden spaceship'});
    assert.match(endpoint,/gemini-nano-banana-2\.1/);
    assert.equal(r.buffer.toString(),'PNG');
    assert.match(sent.contents[0].parts[0].text,/golden spaceship/);
  }finally{globalThis.fetch=prev;}
});
test('video generation extracts mp4 and carries previous interaction for editing',async()=>{
  let sent;
  globalThis.fetch=async(_u,init)=>{sent=JSON.parse(init.body);return mockJSON({id:'interaction-1',status:'completed',steps:[{type:'model_output',content:[{type:'video',mime_type:'video/mp4',data:Buffer.from('MP4').toString('base64')}]}]});};
  try{
    const r=await createVideo({prompt:'Make the background golden',previousInteractionId:'interaction-0'});
    assert.equal(r.buffer.toString(),'MP4');
    assert.equal(sent.previous_interaction_id,'interaction-0');
    assert.equal(sent.model,'gemini-omni-1.1-flash');
  }finally{globalThis.fetch=prev;}
});
test('Meshy text and image-to-3D task APIs return provider ids',async()=>{
  const calls=[];
  globalThis.fetch=async(u,init)=>{calls.push({url:String(u),body:JSON.parse(init.body)});return mockJSON({result:'task-123'});};
  try{
    assert.equal(await startMeshy({prompt:'robot'}),'task-123');
    assert.equal(await startMeshyImage({image:{mimeType:'image/png',base64:Buffer.from('x').toString('base64')}}),'task-123');
    assert.match(calls[0].url,/v2\/text-to-3d/);
    assert.match(calls[1].url,/v1\/image-to-3d/);
    assert.equal(calls[1].body.should_texture,true);
  }finally{globalThis.fetch=prev;}
});
test('3D provider URLs are restricted to trusted HTTPS host',()=>{
  assert.equal(verifiedMeshyLink('http://assets.meshy.ai/t.glb'),null);
  assert.equal(verifiedMeshyLink('https://evil.invalid/t.glb'),null);
  assert.equal(verifiedMeshyLink('https://assets.meshy.ai/model.glb'),'https://assets.meshy.ai/model.glb');
});
test('Meshy poll uses image endpoint for image phase',async()=>{
  let url;
  globalThis.fetch=async u=>{url=String(u);return mockJSON({status:'SUCCEEDED'});};
  try{await pollMeshy('a-b-c-123456','image');assert.match(url,/v1\/image-to-3d/);}finally{globalThis.fetch=prev;}
});
process.on('exit',()=>{if(oldGem===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldGem;
  if(oldMesh===undefined)delete process.env.MESHY_API_KEY;else process.env.MESHY_API_KEY=oldMesh;});

test('Meshy retexture uses previous generated task without recreating mesh',async()=>{
  let sent,url;globalThis.fetch=async(u,i)=>{url=String(u);sent=JSON.parse(i.body);return mockJSON({result:'texture-task'});};
  try{assert.equal(await startMeshyRetexture({taskId:'old-model-12345',prompt:'Brushed gold with a black visor'}),'texture-task');
    assert.match(url,/v1\/retexture/);assert.equal(sent.input_task_id,'old-model-12345');}
  finally{globalThis.fetch=prev;}
});
