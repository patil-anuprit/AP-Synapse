import express from 'express';
import {verifiedCreationUser} from './authQuota.mjs';
import {
  listArtifacts,
  loadArtifact,
  deleteArtifact
} from './artifactVault.mjs';

function respond(res,error){
  const known=Number.isInteger(error?.status) &&
    error.status>=400 && error.status<500;

  const status=known?error.status:503;

  const code=known &&
    /^[A-Z0-9_]+$/.test(error.message||'')
    ?error.message
    :'ARTIFACT_VAULT_UNAVAILABLE';

  if(!res.headersSent)
    res.status(status).json({error:code});
}

function asyncRoute(handler){
  return (req,res)=>{
    Promise.resolve()
      .then(()=>handler(req,res))
      .catch(error=>respond(res,error));
  };
}

export function createArtifactVaultRouter({
  verify=verifiedCreationUser,
  store={listArtifacts,loadArtifact,deleteArtifact},
  enabled=()=>process.env.AP_CREATION_VAULT_ENABLED==='true'
}={}){
  const router=express.Router();

  router.use((req,res,next)=>{
    res.set('Cache-Control','private, no-store');
    res.set('X-Content-Type-Options','nosniff');

    if(!enabled())return res.sendStatus(404);

    try{
      // Production verifies a signed personalization identity.
      // Browser-supplied account IDs are never authoritative.
      req.apVaultAccount=verify(req);
      next();
    }catch(error){
      respond(res,error);
    }
  });

  router.get('/',asyncRoute(async(req,res)=>{
    const artifacts=await store.listArtifacts({
      accountId:req.apVaultAccount
    });
    res.json({artifacts});
  }));

  router.get('/:id',asyncRoute(async(req,res)=>{
    const artifact=await store.loadArtifact({
      accountId:req.apVaultAccount,
      id:req.params.id
    });

    if(!Buffer.isBuffer(artifact.buffer))
      throw new Error('ARTIFACT_BYTES_UNAVAILABLE');

    const filename=String(artifact.fileName||'artifact')
      .replace(/[\\/\r\n\x00-\x1f\x7f]/g,'_');

    res.set(
      'Content-Disposition',
      `attachment; filename="artifact"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.type(artifact.mimeType);
    res.set('Content-Length',String(artifact.buffer.length));
    res.send(artifact.buffer);
  }));

  router.delete('/:id',asyncRoute(async(req,res)=>{
    await store.deleteArtifact({
      accountId:req.apVaultAccount,
      id:req.params.id
    });
    res.status(204).end();
  }));

  return router;
}
