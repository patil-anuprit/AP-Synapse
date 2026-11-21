/*
 * AP Synapse completed assistant response memory.
 *
 * Never authenticates via session ID.
 * Does not modify response streams.
 * Caller supplies the existing verified identity function.
 */
export async function saveCompletedAssistantReply({
  req,
  text,
  enabled=false,
  verifiedOwner,
  record
}={}){
  if(!enabled){
    return {stored:false,reason:'disabled'};
  }

  if(typeof text!=='string'||!text.trim()){
    return {stored:false,reason:'empty'};
  }

  try{
    if(typeof verifiedOwner!=='function' ||
       typeof record!=='function'){
      return {stored:false,reason:'unavailable'};
    }

    const accountId=verifiedOwner(req);

    if(typeof accountId!=='string' ||
       !/^user:[A-Za-z0-9_.:-]{1,200}$/.test(accountId)){
      return {stored:false,reason:'unauthorized'};
    }

    const sessionId=String(
      req?.get?.('x-session-id')||''
    ).slice(0,150);

    await record({
      accountId,
      sessionId,
      role:'assistant',
      content:text.trim().slice(0,8000)
    });

    return {stored:true};
  }catch{
    // No token, message text, or private content in logs.
    return {stored:false,reason:'unavailable'};
  }
}
