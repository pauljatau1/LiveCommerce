// The check owns starting a planned show. Navigation follows success, never a
// refused start. The legacy navigate-first flow remains switchable in GoLive.
export async function startCheckedShow({id,api,remember}){
 const before=await api.liveConflict(id);
 if(before.liveShow)return {conflict:before.liveShow};
 const status=await api.hostStatus(id);
 if(status.ended)return {ended:true};
 if(!status.canHost){
  if(status.currentSessionId)return {hostElsewhere:true};
  const claim=await api.claimHost(id,null);
  if(claim.ended)return {ended:true};
  remember(id,claim.sessionId);
 }
 try{await api.startShow(id);return {started:true};}
 catch(error){
  if(error?.response?.status!==409 || error.response.data?.code!=='already_live')throw error;
  const show=error.response.data.liveShow || (await api.liveConflict(id)).liveShow;
  if(!show)throw error;
  return {conflict:show};
 }
}
