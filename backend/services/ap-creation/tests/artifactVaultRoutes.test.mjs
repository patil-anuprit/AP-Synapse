import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createServer} from 'node:http';
import {createArtifactVaultRouter} from '../artifactVaultRoutes.mjs';

const id='123e4567-e89b-42d3-a456-426614174000';

test('vault routes enforce identity and ownership',async t=>{
  const app=express();
  const sample=Buffer.from('%PDF-1.4 test');

  const notFound=()=>Object.assign(
    new Error('ARTIFACT_NOT_FOUND'),{status:404}
  );

  const store={
    async listArtifacts({accountId}){
      return accountId==='user:A'
        ?[{id,file_name:'private.pdf'}]
        :[];
    },
    async loadArtifact({accountId}){
      if(accountId!=='user:A')throw notFound();
      return {
        fileName:'private.pdf',
        mimeType:'application/pdf',
        buffer:sample
      };
    },
    async deleteArtifact({accountId}){
      if(accountId!=='user:A')throw notFound();
      return {deleted:true};
    }
  };

  app.use('/ap/artifacts',createArtifactVaultRouter({
    enabled:()=>true,
    store,
    verify(req){
      const token=req.get('authorization');

      if(token==='Bearer test-A')return 'user:A';
      if(token==='Bearer test-B')return 'user:B';

      throw Object.assign(
        new Error('CREATION_LOGIN_REQUIRED'),
        {status:401}
      );
    }
  }));

  const server=createServer(app);
  await new Promise(resolve=>
    server.listen(0,'127.0.0.1',resolve)
  );

  t.after(()=>new Promise(resolve=>server.close(resolve)));

  const base=`http://127.0.0.1:${server.address().port}/ap/artifacts`;

  const request=(path,token,options={})=>fetch(
    base+path,{
      ...options,
      headers:token?{authorization:`Bearer ${token}`}:{}
    }
  );

  const guest=await request('/');
  assert.equal(guest.status,401);

  const listing=await request('/','test-A');
  assert.equal(listing.status,200);
  assert.equal((await listing.json()).artifacts.length,1);

  const otherListing=await request('/','test-B');
  assert.deepEqual(
    (await otherListing.json()).artifacts,[]
  );

  const downloaded=await request('/'+id,'test-A');
  assert.equal(downloaded.status,200);
  assert.equal(
    downloaded.headers.get('cache-control'),
    'private, no-store'
  );
  assert.deepEqual(
    Buffer.from(await downloaded.arrayBuffer()),sample
  );

  const denied=await request('/'+id,'test-B');
  assert.equal(denied.status,404);

  const deniedDelete=await request('/'+id,'test-B',{
    method:'DELETE'
  });
  assert.equal(deniedDelete.status,404);

  const allowedDelete=await request('/'+id,'test-A',{
    method:'DELETE'
  });
  assert.equal(allowedDelete.status,204);
});

test('vault endpoints remain disabled by default',async t=>{
  const app=express();

  app.use('/ap/artifacts',createArtifactVaultRouter({
    enabled:()=>false
  }));

  const server=createServer(app);
  await new Promise(resolve=>
    server.listen(0,'127.0.0.1',resolve)
  );
  t.after(()=>new Promise(resolve=>server.close(resolve)));

  const result=await fetch(
    `http://127.0.0.1:${server.address().port}/ap/artifacts`,
    {headers:{authorization:'Bearer test'}}
  );

  assert.equal(result.status,404);
});
