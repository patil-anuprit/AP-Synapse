import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaIntent,composePrompt} from '../backend/services/ap-media/intent.mjs';
test('explicit image request becomes an image job',()=>assert.equal(mediaIntent('Generate a photorealistic image of a snow leopard')?.kind,'image'));
test('explicit video request becomes a video job',()=>assert.equal(mediaIntent('Create an 8 second cinematic video of a waterfall')?.kind,'video'));
test('animate previous image routes to video',()=>assert.equal(mediaIntent('Animate it with camera motion',{kind:'image'})?.kind,'video'));
test('3D request becomes model3d',()=>assert.equal(mediaIntent('Create a 3D model of a motorcycle')?.kind,'model3d'));
test('3D texture follow-up remains 3D',()=>assert.equal(mediaIntent('Texture it with brushed gold',{kind:'model3d'})?.kind,'model3d'));
test('implicit image edit retains image kind',()=>assert.equal(mediaIntent('Make it warmer and brighter',{kind:'image'})?.kind,'image'));
test('unrelated chat is not intercepted',()=>assert.equal(mediaIntent('How are you today?',{kind:'image'}),null));
test('question about creating images is not generation',()=>assert.equal(mediaIntent('How do I create an image?',{kind:'image'}),null));
test('documents remain in existing creation engine',()=>assert.equal(mediaIntent('Create a DOCX report about AI'),null));
test('chat context is preserved with latest user instructions last',()=>{
  const prompt=composePrompt({message:'Turn that into a realistic 3D helmet',kind:'model3d',history:[{role:'user',content:'A gold motorcycle helmet with a visor'}],previous:[{kind:'image',prompt:'helmet image'}]});
  assert.ok(prompt.includes('gold motorcycle helmet'));
  assert.ok(prompt.includes('LATEST USER REQUEST'));
  assert.ok(prompt.endsWith('Turn that into a realistic 3D helmet'));
});
