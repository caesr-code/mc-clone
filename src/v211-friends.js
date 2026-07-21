(function(){
'use strict';
const V=window.Voidlands;if(!V)return;V.VERSION='2.1.1';
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function safeName(value){return String(value||'Player').replace(/[<>]/g,'').trim().slice(0,18)||'Player'}
function rawCode(value){return String(value||'').toUpperCase().replace(/^VOIDLANDS-/,'').replace(/^VL-/,'').replace(/[^A-Z0-9]/g,'').slice(0,8)}
function formatCode(value){const c=rawCode(value);return c.length>4?'VL-'+c.slice(0,4)+'-'+c.slice(4):c?'VL-'+c:'VL-'}
function validCode(value){return rawCode(value).length===8}
function peerId(value){return 'voidlands-211-'+rawCode(value).toLowerCase()}
function randomCode(){let out='';const cryptoObj=window.crypto;for(let i=0;i<8;i++){let n;if(cryptoObj&&cryptoObj.getRandomValues){const a=new Uint32Array(1);cryptoObj.getRandomValues(a);n=a[0]}else n=Math.floor(Math.random()*0xffffffff);out+=CODE_CHARS[n%CODE_CHARS.length]}return formatCode(out)}
function loadJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v==null?fallback:v}catch(e){return fallback}}
function saveJSON(key,value){localStorage.setItem(key,JSON.stringify(value))}
function playerName(app){const input=document.querySelector('#mpPlayerName');const name=safeName(input&&input.value||localStorage.getItem('voidlands_player_name')||'Player');localStorage.setItem('voidlands_player_name',name);return name}
function normaliseFriend(friend){const code=formatCode(friend&&friend.code);if(!validCode(code))return null;return{name:safeName(friend&&friend.name||code),code}}

class FriendService{
  constructor(app){
    this.app=app;this.peer=null;this.peerPromise=null;this.online=false;this.hostingWorldId=null;this.code=localStorage.getItem('voidlands_friend_code')||randomCode();this.code=formatCode(this.code);localStorage.setItem('voidlands_friend_code',this.code);
    this.friends=(loadJSON('voidlands_friends_v1',[])||[]).map(normaliseFriend).filter(Boolean);this.lastError='';this.fromPause=false;
  }
  ui(){return this.app.ui}
  status(text,kind=''){const el=document.querySelector('#multiplayerStatus');if(el){el.textContent=text;el.dataset.kind=kind}}
  hostState(text,open=false){const el=document.querySelector('#mpHostState');if(el){el.textContent=text;el.classList.toggle('mp-host-open',!!open)}}
  render(){
    const name=localStorage.getItem('voidlands_player_name')||'Player';const nameEl=document.querySelector('#mpPlayerName');if(nameEl)nameEl.value=name;
    const codeEl=document.querySelector('#mpFriendCode');if(codeEl)codeEl.value=this.code;
    const worlds=this.app.storage.list(),options=worlds.map(w=>`<option value="${V.escapeHtml(w.id)}">${V.escapeHtml(w.name)} · ${V.escapeHtml(w.mode)}</option>`).join('')||'<option value="">Create a world in Singleplayer first</option>';
    for(const id of ['mpHostWorld','mpManualHostWorld']){const select=document.querySelector('#'+id);if(select)select.innerHTML=options}
    for(const id of ['mpHostName','mpJoinName']){const input=document.querySelector('#'+id);if(input)input.value=name}
    this.renderFriends();
    if(this.online)this.status(`Online as ${this.code}. Friends can connect while this tab remains open.`,'ok');else this.status('Connecting to the friend service…','busy');
    this.ensurePeer().catch(()=>{});
  }
  renderFriends(){const list=document.querySelector('#mpFriendsList');if(!list)return;if(!this.friends.length){list.innerHTML='<div class="mp-friends-empty">No saved friends yet. Add their Voidlands friend code above.</div>';return}list.innerHTML=this.friends.map((f,i)=>`<div class="mp-friend-row"><span><strong>${V.escapeHtml(f.name)}</strong><small>${V.escapeHtml(f.code)}</small></span><button class="primary" data-mp-join="${V.escapeHtml(f.code)}">Join</button><button data-mp-remove="${i}" aria-label="Remove ${V.escapeHtml(f.name)}">Remove</button></div>`).join('')}
  ensurePeer(){
    if(this.peer&&this.online)return Promise.resolve(this.peer);if(this.peerPromise)return this.peerPromise;
    this.peerPromise=new Promise((resolve,reject)=>{
      if(typeof window.Peer!=='function'){const e=new Error('The bundled friend-service library did not load. Use the advanced manual connection fallback.');this.status(e.message,'error');this.peerPromise=null;reject(e);return}
      const p=this.peer=new window.Peer(peerId(this.code),{debug:1});let settled=false;
      p.on('open',()=>{this.online=true;this.lastError='';settled=true;this.peerPromise=null;this.status(`Online as ${this.code}. Friends can connect while this tab remains open.`,'ok');p.on('connection',conn=>this.incoming(conn));resolve(p)});
      p.on('error',err=>{this.lastError=err&&err.type||String(err);const message=this.lastError==='unavailable-id'?'That friend code is already in use. Choose New Code.':`Friend service unavailable (${this.lastError}). The manual fallback still works.`;this.status(message,'error');if(!settled){settled=true;this.peerPromise=null;reject(err)}});
      p.on('disconnected',()=>{this.online=false;this.status('Friend service disconnected. Reconnecting…','busy');try{p.reconnect()}catch(e){}});
      p.on('close',()=>{this.online=false;this.peer=null;this.peerPromise=null});
    });return this.peerPromise;
  }
  bind(session,conn){
    session._friendCloud=true;session._peerConnection=conn;
    const adapter={get readyState(){return conn.open?'open':'connecting'},send(data){conn.send(data)},close(){try{conn.close()}catch(e){}}};session.channel=adapter;
    conn.on('data',data=>session.receive(typeof data==='string'?data:JSON.stringify(data)));
    conn.on('close',()=>{session.connected=false;session.status('Friend disconnected','error');if(session.remoteModel)session.remoteModel.visible=false});
    conn.on('error',err=>session.status(`P2P connection error${err&&err.type?' · '+err.type:''}`,'error'));
    if(conn.open)session.open();else conn.on('open',()=>session.open());
  }
  reject(conn,reason){const send=()=>{try{conn.send(JSON.stringify({type:'reject',reason}));setTimeout(()=>conn.close(),250)}catch(e){try{conn.close()}catch(_){}}};if(conn.open)send();else conn.on('open',send)}
  incoming(conn){
    if(!this.hostingWorldId){this.reject(conn,'This friend is online, but their world is not open to friends.');return}
    if(this.app.multiplayer&&this.app.multiplayer.connected){this.reject(conn,'This world already has a guest. Voidlands currently supports two-player co-op.');return}
    if(this.app.multiplayer&&!this.app.multiplayer.connected)this.app.multiplayer.close();
    const session=new V.MultiplayerSession(this.app,'host',playerName(this.app));session.hostWorldId=this.hostingWorldId;session._friendAttachExisting=true;session.remoteName=safeName(conn.metadata&&conn.metadata.name||'Friend');this.app.multiplayer=session;this.bind(session,conn);this.status(`${session.remoteName} is joining…`,'busy')
  }
  async host(worldId){
    const world=this.app.storage.get(worldId);if(!world)throw new Error('Choose or create a Singleplayer world first.');await this.ensurePeer();this.hostingWorldId=worldId;this.hostState(`Open to friends · ${this.code}`,true);this.status(`Opening ${world.name} to friends…`,'busy');
    if(!this.app.game||!this.app.game.data||this.app.game.data.id!==worldId)await this.app.startWorld(world);
    if(this.app.game){this.app.game.friendService=this;this.app.game.ui.chat(`World open to friends. Friend code: ${this.code}`);this.app.game.ui.toast('World open to friends')}
  }
  stopHosting(){this.hostingWorldId=null;this.hostState('World closed to new players.',false);this.status(`Online as ${this.code}, but not hosting a world.`,'ok')}
  async join(code){
    code=formatCode(code);if(!validCode(code))throw new Error('Enter a complete friend code such as VL-ABCD-EFGH.');if(code===this.code)throw new Error('You cannot join your own friend code.');const peer=await this.ensurePeer();if(this.app.multiplayer)this.app.multiplayer.close();
    const name=playerName(this.app),session=this.app.multiplayer=new V.MultiplayerSession(this.app,'guest',name);session.remoteName=code;this.status(`Connecting to ${code}…`,'busy');
    const conn=peer.connect(peerId(code),{reliable:true,metadata:{name,version:V.VERSION}});this.bind(session,conn);
    const timer=setTimeout(()=>{if(!session.connected){session.close();this.status('Could not join. The friend may be offline or their world may not be open.','error')}},12000);conn.on('open',()=>clearTimeout(timer));
  }
  addFriend(name,code){code=formatCode(code);if(!validCode(code))throw new Error('Friend codes contain eight letters or numbers.');if(code===this.code)throw new Error('That is your own friend code.');const friend={name:safeName(name||code),code},existing=this.friends.findIndex(f=>f.code===code);if(existing>=0)this.friends[existing]=friend;else this.friends.push(friend);saveJSON('voidlands_friends_v1',this.friends);this.renderFriends()}
  removeFriend(index){if(index<0||index>=this.friends.length)return;this.friends.splice(index,1);saveJSON('voidlands_friends_v1',this.friends);this.renderFriends()}
  newCode(){if(this.app.multiplayer&&this.app.multiplayer.connected)throw new Error('Disconnect from multiplayer before changing your friend code.');if(this.peer)try{this.peer.destroy()}catch(e){}this.peer=null;this.online=false;this.peerPromise=null;this.code=randomCode();localStorage.setItem('voidlands_friend_code',this.code);const el=document.querySelector('#mpFriendCode');if(el)el.value=this.code;this.status('Friend code changed. Reconnecting…','busy');this.ensurePeer().catch(()=>{})}
}
V.FriendService=FriendService;V.FriendCodes={format:formatCode,valid:validCode,peerId};
function service(app){return app.friendService||(app.friendService=new FriendService(app))}

// Friend-cloud connections reuse the existing deterministic world synchronisation.
const MP=V.MultiplayerSession&&V.MultiplayerSession.prototype;
if(MP){
  const oldOpen=MP.open;MP.open=async function(){if(!this._friendAttachExisting)return oldOpen.call(this);if(this.closed||this.connected)return;this.connected=true;this.status('Friend connected — synchronising world','ok');let game=this.app.game;if(!game){const world=this.app.storage.get(this.hostWorldId);if(!world){this.status('Hosted world no longer exists','error');return}await this.app.startWorld(world);game=this.app.game}this.attach(game);this.send({type:'hello',name:this.name,skin:this.app.settings.skinData||null,model:this.app.settings.skinModel||'classic'});await this.sendSnapshot()};
  const oldReceive=MP.receive;MP.receive=function(raw){let parsed;try{parsed=typeof raw==='string'?JSON.parse(raw):raw}catch(e){}if(parsed&&parsed.type==='reject'){this.status(parsed.reason||'The host declined the connection.','error');this.close();return}return oldReceive.call(this,typeof raw==='string'?raw:JSON.stringify(raw))};
}

const UIP=V.UI.prototype,oldAction=UIP.action;
UIP.action=function(action){const s=service(this.app);
  if(action==='multiplayer'){s.fromPause=false;s.render();this.show('multiplayerScreen');return}
  if(action==='pause-friends'){s.fromPause=true;s.render();const select=this.q('#mpHostWorld');if(select&&this.app.game&&this.app.game.data)select.value=this.app.game.data.id;this.show('multiplayerScreen');return}
  if(action==='multiplayer-back'){if(this.app.multiplayer&&!this.app.multiplayer.connected)this.app.multiplayer.close();this.show(s.fromPause&&this.app.game?'pauseScreen':'titleScreen');return}
  if(action==='mp-copy-friend-code'){const value=s.code;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(()=>this.toast('Friend code copied')).catch(()=>{});else{const input=this.q('#mpFriendCode');input&&input.select();try{document.execCommand('copy');this.toast('Friend code copied')}catch(e){}}return}
  if(action==='mp-new-friend-code'){try{s.newCode();this.toast('New friend code created')}catch(e){s.status(e.message,'error')}return}
  if(action==='mp-open-world'){(async()=>{try{await s.host(this.q('#mpHostWorld').value);if(s.fromPause&&this.app.game)this.show('pauseScreen')}catch(e){s.status(e.message||String(e),'error')}})();return}
  if(action==='mp-stop-hosting'){s.stopHosting();return}
  if(action==='mp-join-code'){s.join(this.q('#mpDirectCode').value).catch(e=>s.status(e.message||String(e),'error'));return}
  if(action==='mp-add-friend'){try{s.addFriend(this.q('#mpFriendName').value,this.q('#mpFriendAddCode').value);this.q('#mpFriendName').value='';this.q('#mpFriendAddCode').value='';this.toast('Friend saved')}catch(e){s.status(e.message,'error')}return}
  return oldAction.call(this,action)
};

document.addEventListener('click',event=>{const join=event.target.closest&&event.target.closest('[data-mp-join]');if(join){event.preventDefault();const app=window.voidlandsApp||window.app||null;const s=app?service(app):null;if(s)s.join(join.dataset.mpJoin).catch(e=>s.status(e.message||String(e),'error'));return}const remove=event.target.closest&&event.target.closest('[data-mp-remove]');if(remove){event.preventDefault();const app=window.voidlandsApp||window.app||null;const s=app?service(app):null;if(s)s.removeFriend(Number(remove.dataset.mpRemove))}});


// Closing the hosted world also closes it to new friends, matching the pause-menu state.
const oldFriendDestroy=V.Game.prototype.destroy;
V.Game.prototype.destroy=function(){if(this.friendService&&this.friendService.hostingWorldId===this.data.id)this.friendService.stopHosting();return oldFriendDestroy.call(this)};

})(window.Voidlands);
