(function(){
'use strict';
const V=window.Voidlands;if(!V||!V.FriendService||!V.MultiplayerSession)return;V.VERSION='2.1.2';
const FP=V.FriendService.prototype;
const CLOUD_OPTIONS={
  host:'0.peerjs.com',port:443,path:'/',secure:true,key:'peerjs',debug:2,
  config:{iceServers:[
    {urls:'stun:stun.cloudflare.com:3478'},
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:stun1.l.google.com:19302'}
  ],sdpSemantics:'unified-plan'}
};
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function remove(emitter,event,fn){if(!emitter||!fn)return;if(typeof emitter.off==='function')emitter.off(event,fn);else if(typeof emitter.removeListener==='function')emitter.removeListener(event,fn)}
function cleanMessage(err){const type=err&&err.type||'';if(type==='peer-unavailable')return 'The host friend code is not online. On the host browser, pause the game, open Play With Friends, then press Play & Open to Friends.';if(type==='network'||type==='server-error'||type==='socket-error'||type==='socket-closed')return 'This browser could not reach the friend service. Check the internet connection or use Advanced manual connection.';if(type==='webrtc')return 'The browsers found each other, but WebRTC could not make a direct route. Try the Advanced manual connection or another network.';if(type==='browser-incompatible')return 'This browser does not support the WebRTC features needed for multiplayer.';return err&&err.message||String(err||'Unknown multiplayer error')}
function isPeerAlive(peer){return !!(peer&&!peer.destroyed)}
function peerOpen(peer){return !!(peer&&peer.open&&!peer.disconnected&&!peer.destroyed)}
function wire(service,peer){
  if(!peer||peer.__voidlands212Wired)return;peer.__voidlands212Wired=true;
  // Register this before the signalling socket opens so a very fast incoming
  // connection can never be missed.
  peer.on('connection',conn=>service.incoming(conn));
  peer.on('open',()=>{service.online=true;service.lastError='';service.status(service.hostingWorldId?`World open to friends · ${service.code}`:`Online as ${service.code}. Open a world before friends join.`,'ok')});
  peer.on('disconnected',()=>{service.online=false;service.status('Friend service disconnected. Reconnecting…','busy');clearTimeout(service._reconnectTimer);service._reconnectTimer=setTimeout(()=>{if(service.peer===peer&&!peer.destroyed){try{peer.reconnect()}catch(e){service.peer=null;service.ensurePeer().catch(()=>{})}}},900)});
  peer.on('close',()=>{if(service.peer===peer){service.online=false;service.peer=null;service.peerPromise=null}service.status('Friend service connection closed. Reconnecting…','busy');clearTimeout(service._reconnectTimer);service._reconnectTimer=setTimeout(()=>service.ensurePeer().catch(()=>{}),1200)});
  peer.on('error',err=>{
    const type=err&&err.type||String(err);service.lastError=type;
    if(type==='peer-unavailable'){if(service._pendingJoinError)service._pendingJoinError(err);return}
    if(type==='unavailable-id'){service.online=false;service.status('This friend code is already active in another tab or browser. Close the other copy or choose New Code.','error');return}
    if(type==='webrtc'){if(service._pendingJoinError)service._pendingJoinError(err);return}
    if(['network','server-error','socket-error','socket-closed','browser-incompatible','ssl-unavailable','invalid-key','invalid-id'].includes(type)){service.online=false;service.status(cleanMessage(err),'error')}
  });
}
function awaitOpen(service,peer,timeout=12000){
  if(peerOpen(peer)){service.online=true;return Promise.resolve(peer)}
  return new Promise((resolve,reject)=>{
    let done=false;const finish=(ok,value)=>{if(done)return;done=true;clearTimeout(timer);remove(peer,'open',onOpen);remove(peer,'error',onError);remove(peer,'close',onClose);service.peerPromise=null;ok?resolve(value):reject(value)};
    const onOpen=()=>{service.online=true;finish(true,peer)};
    const onError=err=>{const t=err&&err.type;if(t==='peer-unavailable'||t==='webrtc')return;finish(false,err)};
    const onClose=()=>finish(false,new Error('Friend service connection closed before it became ready.'));
    const timer=setTimeout(()=>finish(false,new Error('Timed out while connecting to the friend service.')),timeout);
    peer.on('open',onOpen);peer.on('error',onError);peer.on('close',onClose);
  })
}
FP.ensurePeer=function(){
  if(typeof window.Peer!=='function'){const e=new Error('The bundled friend-service library did not load. Use Advanced manual connection.');this.status(e.message,'error');return Promise.reject(e)}
  if(this.peerPromise)return this.peerPromise;
  if(isPeerAlive(this.peer)){
    wire(this,this.peer);
    if(peerOpen(this.peer)){this.online=true;return Promise.resolve(this.peer)}
    this.peerPromise=awaitOpen(this,this.peer,9000);
    if(this.peer.disconnected){try{this.peer.reconnect()}catch(e){try{this.peer.destroy()}catch(_){}this.peer=null;this.peerPromise=null;return this.ensurePeer()}}
    return this.peerPromise
  }
  const peer=this.peer=new window.Peer(V.FriendCodes.peerId(this.code),CLOUD_OPTIONS);wire(this,peer);this.peerPromise=awaitOpen(this,peer,12000);return this.peerPromise
};
const oldRender=FP.render;
FP.render=function(){const out=oldRender.call(this);if(this.hostingWorldId)this.hostState(`Open to friends · ${this.code}`,true);return out};
FP.host=async function(worldId){
  worldId=worldId||(this.app.game&&this.app.game.data&&this.app.game.data.id)||'';
  const world=this.app.storage.get(worldId);if(!world)throw new Error('Choose or create a Singleplayer world first.');if(world.hardcoreDead)throw new Error('That Hardcore world has ended and cannot be hosted.');
  this.status('Connecting to the friend service…','busy');await this.ensurePeer();this.hostingWorldId=worldId;
  this.hostState(`Open to friends · ${this.code}`,true);this.status(`Opening ${world.name} to friends…`,'busy');
  if(!this.app.game||!this.app.game.data||this.app.game.data.id!==worldId)await this.app.startWorld(world);
  if(this.app.game){this.app.game.friendService=this;const mode=String(world.mode||'survival').toLowerCase();this.app.game.ui.chat(`${mode==='hardcore'?'Hardcore w':'W'}orld open to friends. Friend code: ${this.code}`);this.app.game.ui.toast('World open to friends')}
  this.status(`World open to friends · ${this.code}. Keep this tab open.`,'ok');this.hostState(`${world.name} is open · ${this.code}`,true)
};
FP.incoming=function(conn){
  if(!this.hostingWorldId){this.reject(conn,'This friend is online, but their world is not open to friends. On the host, press Play & Open to Friends.');return}
  const hosted=this.app.storage.get(this.hostingWorldId);if(!hosted){this.hostingWorldId=null;this.reject(conn,'The hosted world could not be found.');return}
  if(this.app.multiplayer&&this.app.multiplayer.connected){this.reject(conn,'This world already has a guest. Voidlands currently supports two-player co-op.');return}
  if(this.app.multiplayer&&!this.app.multiplayer.connected)this.app.multiplayer.close();
  const session=new V.MultiplayerSession(this.app,'host',(document.querySelector('#mpPlayerName')||{}).value||localStorage.getItem('voidlands_player_name')||'Player');
  session.hostWorldId=this.hostingWorldId;session._friendAttachExisting=true;session.remoteName=String(conn.metadata&&conn.metadata.name||'Friend').replace(/[<>]/g,'').trim().slice(0,18)||'Friend';this.app.multiplayer=session;this.bind(session,conn);this.status(`${session.remoteName} found the world. Establishing P2P link…`,'busy')
};
FP.join=async function(code){
  code=V.FriendCodes.format(code);if(!V.FriendCodes.valid(code))throw new Error('Enter a complete friend code such as VL-ABCD-EFGH.');if(code===this.code)throw new Error('You cannot join your own friend code.');
  const peer=await this.ensurePeer();if(this.app.multiplayer)this.app.multiplayer.close();
  const name=String((document.querySelector('#mpPlayerName')||{}).value||localStorage.getItem('voidlands_player_name')||'Player').replace(/[<>]/g,'').trim().slice(0,18)||'Player';localStorage.setItem('voidlands_player_name',name);
  let lastError=null;
  for(let attempt=1;attempt<=3;attempt++){
    this.status(`Looking for ${code}… attempt ${attempt}/3`,'busy');
    const session=new V.MultiplayerSession(this.app,'guest',name);session.remoteName=code;this.app.multiplayer=session;
    let conn;
    try{
      conn=peer.connect(V.FriendCodes.peerId(code),{reliable:true,serialization:'json',metadata:{name,version:V.VERSION,protocol:2}});this.bind(session,conn);
      await new Promise((resolve,reject)=>{
        let done=false;const finish=(ok,value)=>{if(done)return;done=true;clearTimeout(timer);this._pendingJoinError=null;remove(conn,'open',onOpen);remove(conn,'error',onError);ok?resolve(value):reject(value)};
        const onOpen=()=>finish(true);const onError=err=>finish(false,err);this._pendingJoinError=err=>finish(false,err);
        const timer=setTimeout(()=>finish(false,{type:'webrtc',message:'The P2P connection timed out.'}),attempt===1?9000:7000);
        conn.on('open',onOpen);conn.on('error',onError)
      });
      this.status(`Connected to ${code}. Loading the host world…`,'ok');return
    }catch(err){lastError=err;this._pendingJoinError=null;try{conn&&conn.close()}catch(e){}if(this.app.multiplayer===session)session.close();if((err&&err.type)==='peer-unavailable'&&attempt<3){await wait(1400*attempt);continue}break}
  }
  const message=cleanMessage(lastError);this.status(message,'error');throw new Error(message)
};
// Recover cleanly after a laptop wakes, a tab is restored, or the network
// briefly drops. Do not create a second Peer with the same friend code.
function revive(){const app=window.voidlandsApp||window.app;if(app&&app.friendService)app.friendService.ensurePeer().catch(()=>{})}
window.addEventListener('online',revive);window.addEventListener('focus',revive);document.addEventListener('visibilitychange',()=>{if(!document.hidden)revive()});
// Make the host state unmistakable when opening the multiplayer screen from a
// paused world. Merely playing a world is not the same as opening it online.
const UIP=V.UI.prototype,oldAction=UIP.action;
UIP.action=function(action){if(action==='pause-friends'){const s=this.app.friendService||(this.app.friendService=new V.FriendService(this.app));s.fromPause=true;s.render();const current=this.app.game&&this.app.game.data&&this.app.game.data.id,select=this.q('#mpHostWorld');if(select&&current)select.value=current;s.hostState(s.hostingWorldId===current?`Current world is open · ${s.code}`:'Current world is local only — press Play & Open to Friends.',s.hostingWorldId===current);this.show('multiplayerScreen');return}return oldAction.call(this,action)};
})(window.Voidlands);
