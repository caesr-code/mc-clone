(function(){
'use strict';
const V=window.Voidlands;
if(!V)return;
V.VERSION='2.1.0';

/* -------------------------------------------------------------------------
   Precise Enderman gaze: the crosshair must intersect the actual front face.
------------------------------------------------------------------------- */
function rayFaceDistance(origin,dir,mob){
  const yaw=Number(mob.yaw)||0;
  const front=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const center=new THREE.Vector3(mob.position.x,mob.position.y+2.64,mob.position.z).addScaledVector(front,.255);
  const toViewer=origin.clone().sub(center);
  if(toViewer.dot(front)>=0)return null; // Looking at the back of its head is safe.
  const denom=dir.dot(front);
  if(Math.abs(denom)<1e-7)return null;
  const t=center.clone().sub(origin).dot(front)/denom;
  if(t<=0||t>32)return null;
  const hit=origin.clone().addScaledVector(dir,t),offset=hit.sub(center);
  if(Math.abs(offset.dot(right))>.255||Math.abs(offset.y)>.19)return null;
  return t;
}
V.isEndermanFaceTargeted=function(player,mob,world){
  if(!player||!mob||mob.type!=='enderman'||!player.viewDirection||!player.eyePosition)return false;
  const origin=player.eyePosition(),dir=player.viewDirection().normalize(),t=rayFaceDistance(origin,dir,mob);
  if(t==null)return false;
  const obstruction=world&&world.raycast&&world.raycast(origin,dir,t+.03);
  return !obstruction||obstruction.distance>=t-.04;
};
const managerSpawn=V.EntityManager.prototype.spawn;
V.EntityManager.prototype.spawn=function(type,x,y,z){
  const mob=managerSpawn.call(this,type,x,y,z);
  if(mob&&mob.type==='enderman')mob.lookedAt=function(player){return V.isEndermanFaceTargeted(player,this,this.world)};
  if(mob&&mob.type==='ender_dragon')V.installDragonPerching(mob);
  return mob;
};

/* -------------------------------------------------------------------------
   Dragon phases. The dragon keeps its requested 1,080 HP, but attacks less
   often and lands at the centre island regularly for a clear melee opening.
------------------------------------------------------------------------- */
function difficultyDamage(game){
  const d=game&&game.difficulty;
  return d==='peaceful'?0:d==='easy'?3:d==='hard'?8:5;
}
function setPhase(mob,phase,time){
  mob._dragonPhase=phase;mob._dragonPhaseTime=time;mob._dragonPhaseAge=0;
  if(phase==='perched'&&mob.game&&mob.game.ui){mob.game.ui.toast('The Ender Dragon has perched!');mob.game.ui.chat('The dragon is perched at the centre island. Strike now!')}
}
function moveToward(mob,target,speed,dt){
  const delta=target.clone().sub(mob.position),distance=delta.distanceTo(new THREE.Vector3());
  if(distance<1e-5)return{distance:0,dir:new THREE.Vector3(0,0,-1)};
  const dir=delta.multiplyScalar(1/distance),step=Math.min(distance,speed*dt);mob.position.addScaledVector(dir,step);return{distance,dir};
}
function tintHurt(mob){
  if(!mob.mesh||!mob.mesh.traverse)return;
  mob.mesh.traverse(o=>{if(o.material&&o.material.color){if(!o.userData.baseColor)o.userData.baseColor=o.material.color.clone?o.material.color.clone():new THREE.Color(o.material.color);if(mob.hurtTime>0)o.material.color.set(0xff3939);else if(o.userData.baseColor)o.material.color.copy(o.userData.baseColor)}});
}
function animateDragon(mob,dt,dir,turn){
  const parts=mob.mesh&&mob.mesh.userData&&mob.mesh.userData.parts;if(!parts)return;
  const perched=mob._dragonPhase==='perched',landing=mob._dragonPhase==='landing',flap=perched?-.45:Math.sin(mob.age*(landing?2.4:4.1));
  if(parts.wingParts)parts.wingParts.forEach((w,i)=>{const side=i===0?-1:1;w.rotation.z=side*(perched?.78:.18+flap*.34);w.rotation.x=perched?.22:.08+Math.cos(mob.age*2.1)*.06});
  if(parts.neckParts)parts.neckParts.forEach((n,i)=>{n.rotation.y=Math.sin(mob.age*1.35-i*.48)*(perched?.055:.12);n.rotation.x=Math.sin(mob.age*.95-i*.33)*(perched?.025:.045)});
  if(parts.tailParts)parts.tailParts.forEach((t,i)=>{t.rotation.y=Math.sin(mob.age*1.55-i*.46)*(.09+i*.016);t.rotation.x=Math.cos(mob.age*1.05-i*.31)*.03});
  if(parts.jaw)parts.jaw.rotation.x=.1+(perched?Math.max(0,Math.sin(mob.age*1.6))*.12:Math.max(0,Math.sin(mob.age*.9))*.22);
  mob.mesh.rotation.z=perched?0:-turn*.3;mob.mesh.rotation.x=perched?0:-dir.y*.18;
}
V.installDragonPerching=function(mob){
  if(!mob||mob._perchInstalled)return mob;mob._perchInstalled=true;
  mob.health=Math.min(Number(mob.health)||1080,1080);mob.maxHealth=1080;mob.attackDamage=difficultyDamage(mob.game);
  setPhase(mob,'circling',9+Math.random()*5);mob._perchDamage=0;
  const originalTake=mob.takeDamage&&mob.takeDamage.bind(mob);
  if(originalTake)mob.takeDamage=function(n,knock){const before=this.health,result=originalTake(n,knock);if(this._dragonPhase==='perched')this._perchDamage+=Math.max(0,before-this.health);return result};
  mob.update=function(dt){
    if(this.dead)return;this.age=(this.age||0)+dt;this.hurtTime=Math.max(0,(this.hurtTime||0)-dt);this.attackTime=(this.attackTime||0)-dt;this._dragonPhaseTime-=dt;this._dragonPhaseAge+=dt;
    const player=this.game.player,centre=new THREE.Vector3(8,40.7,8),phase=this._dragonPhase;let target,speed=4.6;
    if(phase==='circling'){
      const orbit=this.age*.135;target=new THREE.Vector3(8+Math.cos(orbit)*25,51+Math.sin(orbit*.71)*6,8+Math.sin(orbit)*25);speed=4.7;
      if(this._dragonPhaseTime<=0)setPhase(this,'landing',12);
    }else if(phase==='landing'){
      target=centre.clone();speed=4.1;
      if(this.position.distanceTo(centre)<1.15||this._dragonPhaseTime<=0){this.position.copy(centre);this._perchDamage=0;setPhase(this,'perched',18)}
    }else if(phase==='perched'){
      target=centre.clone();this.position.x=V.lerp(this.position.x,centre.x,Math.min(1,dt*4));this.position.y=V.lerp(this.position.y,centre.y,Math.min(1,dt*4));this.position.z=V.lerp(this.position.z,centre.z,Math.min(1,dt*4));
      const face=player.position.clone().sub(this.position),wanted=Math.atan2(-face.x,-face.z),turn=Math.atan2(Math.sin(wanted-this.yaw),Math.cos(wanted-this.yaw));this.yaw+=turn*Math.min(1,dt*3);
      const pd=this.position.distanceTo(player.position),damage=difficultyDamage(this.game);if(damage&&pd<5.4&&this.attackTime<=0){this.attackTime=3.8;player.damage(damage,'was struck by the perched Ender Dragon');player.velocity.addScaledVector(player.position.clone().sub(this.position).normalize(),6)}
      if(this._dragonPhaseTime<=0||this._perchDamage>=260)setPhase(this,'taking_off',3.5);
    }else{
      target=new THREE.Vector3(8,54,8);speed=5.2;if(this._dragonPhaseTime<=0||this.position.y>52.5)setPhase(this,'circling',18+Math.random()*7);
    }
    let move={dir:new THREE.Vector3(0,0,-1),distance:0};if(this._dragonPhase!=='perched')move=moveToward(this,target,speed,dt);
    const wanted=Math.atan2(-move.dir.x,-move.dir.z),turn=Math.atan2(Math.sin(wanted-this.yaw),Math.cos(wanted-this.yaw));if(this._dragonPhase!=='perched')this.yaw+=turn*Math.min(1,dt*2.5);
    const playerDist=this.position.distanceTo(player.position),damage=difficultyDamage(this.game);if(this._dragonPhase==='circling'&&damage&&playerDist<4.5&&this.attackTime<=0){this.attackTime=3.3;player.damage(damage,'was struck by the Ender Dragon');player.velocity.addScaledVector(player.position.clone().sub(this.position).normalize(),7)}
    if(this.mesh){this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw;animateDragon(this,dt,move.dir,turn);tintHurt(this)}
  };
  return mob;
};
// Decorate dragons that were restored before this patch loaded.
const oldFixed=V.Game.prototype.fixedUpdate;
V.Game.prototype.fixedUpdate=function(dt){oldFixed.call(this,dt);if(this.entities)for(const m of this.entities.mobs)if(m.type==='ender_dragon'&&!m._perchInstalled)V.installDragonPerching(m);if(this.multiplayer)this.multiplayer.tick(dt)};

/* -------------------------------------------------------------------------
   Two-player peer-to-peer multiplayer. Manual offer/answer codes remove the
   need for an account or a dedicated server. Shared systems: players, chat,
   block edits, dimensions, world time/weather and host-authoritative mobs.
------------------------------------------------------------------------- */
function encodeDescription(desc){const s=JSON.stringify({type:desc.type,sdp:desc.sdp});return btoa(unescape(encodeURIComponent(s))).replace(/=+$/,'')}
function decodeDescription(code){let s=String(code||'').trim().replace(/\s+/g,'');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}
V.MultiplayerCodec={encode:encodeDescription,decode:decodeDescription};
function waitForIce(pc){return new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();let done=false;const finish=()=>{if(done)return;done=true;pc.removeEventListener&&pc.removeEventListener('icegatheringstatechange',change);resolve()};const change=()=>{if(pc.iceGatheringState==='complete')finish()};pc.addEventListener('icegatheringstatechange',change);setTimeout(finish,6500)})}
function safeName(v){return String(v||'Player').replace(/[<>]/g,'').trim().slice(0,18)||'Player'}
function createEmptyRemoteInventory(){return{armor:{head:null,chest:null,legs:null,feet:null},offhand:null,held:null,selectedStack(){return this.held}}}
class MultiplayerSession{
  constructor(app,role,name){this.app=app;this.role=role;this.name=safeName(name);this.pc=null;this.channel=null;this.game=null;this.remoteModel=null;this.remoteState=null;this.remoteName='Player';this.remoteSkin=null;this.connected=false;this.closed=false;this.sendTimer=0;this.hostSyncTimer=0;this.applyingRemote=false;this.chunks={};this.mobMap=new Map();this.hostWorldId=null;this.remoteInventory=createEmptyRemoteInventory();this.remoteEquipmentSig=''}
  status(text,kind=''){const e=document.querySelector('#multiplayerStatus');if(e){e.textContent=text;e.dataset.kind=kind}const h=document.querySelector('#multiplayerHud');if(h&&this.connected)h.textContent=`P2P · ${this.remoteName} · ${text}`}
  makePeer(){if(typeof RTCPeerConnection==='undefined')throw new Error('This browser does not support WebRTC multiplayer.');const pc=this.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:stun.l.google.com:19302'}]});pc.onconnectionstatechange=()=>{const s=pc.connectionState;if(s==='failed'||s==='disconnected'||s==='closed'){this.status('Peer disconnected','error');if(this.remoteModel)this.remoteModel.visible=false}};return pc}
  async createHostOffer(worldId){this.hostWorldId=worldId;const pc=this.makePeer(),channel=pc.createDataChannel('voidlands',{ordered:true});this.bindChannel(channel);await pc.setLocalDescription(await pc.createOffer());await waitForIce(pc);return encodeDescription(pc.localDescription)}
  async createGuestAnswer(offer){const pc=this.makePeer();pc.ondatachannel=e=>this.bindChannel(e.channel);await pc.setRemoteDescription(decodeDescription(offer));await pc.setLocalDescription(await pc.createAnswer());await waitForIce(pc);return encodeDescription(pc.localDescription)}
  async acceptAnswer(answer){if(!this.pc)throw new Error('Create a host invitation first.');await this.pc.setRemoteDescription(decodeDescription(answer));this.status('Connecting to guest…')}
  bindChannel(channel){this.channel=channel;channel.onmessage=e=>this.receive(e.data);channel.onclose=()=>{this.connected=false;this.status('Connection closed','error')};channel.onerror=()=>this.status('Connection error','error');channel.onopen=()=>this.open()}
  async open(){if(this.closed||this.connected)return;this.connected=true;this.status('Connected — loading shared world','ok');if(this.role==='host'){
      const world=this.app.storage.get(this.hostWorldId);if(!world){this.status('Selected world no longer exists','error');return}
      await this.app.startWorld(world);this.attach(this.app.game);this.send({type:'hello',name:this.name,skin:this.app.settings.skinData||null,model:this.app.settings.skinModel||'classic'});this.sendSnapshot();
    }else this.send({type:'hello',name:this.name,skin:this.app.settings.skinData||null,model:this.app.settings.skinModel||'classic'});
  }
  async sendSnapshot(){const g=this.game;if(!g)return;g.world.serialize();g.data.player=g.player.serialize();g.data.inventory=g.inventory.serialize();g.data.weather=g.weather;g.data.weatherTime=g.weatherTime;const snapshot=V.deepClone(g.data);snapshot.entities=[];const text=JSON.stringify(snapshot),id='snapshot_'+Date.now(),size=12000,total=Math.ceil(text.length/size);this.send({type:'large-start',id,kind:'snapshot',total});for(let i=0;i<total;i++){this.send({type:'large-part',id,index:i,data:text.slice(i*size,(i+1)*size)});await new Promise(r=>setTimeout(r,3))}this.send({type:'large-end',id})}
  send(message){if(!this.channel||this.channel.readyState!=='open')return false;try{this.channel.send(JSON.stringify(message));return true}catch(e){this.status('Network send failed','error');return false}}
  receive(raw){let msg;try{msg=JSON.parse(raw)}catch(e){return}if(msg.type==='large-start'){this.chunks[msg.id]={kind:msg.kind,total:msg.total,parts:[]};return}if(msg.type==='large-part'){const c=this.chunks[msg.id];if(c)c.parts[msg.index]=msg.data;return}if(msg.type==='large-end'){const c=this.chunks[msg.id];if(!c)return;delete this.chunks[msg.id];if(c.parts.filter(Boolean).length!==c.total){this.status('World transfer was incomplete','error');return}if(c.kind==='snapshot')this.startGuest(JSON.parse(c.parts.join('')));return}
    if(msg.type==='hello'){this.remoteName=safeName(msg.name);this.remoteSkin={skinData:msg.skin||null,skinModel:msg.model||'classic'};if(this.game)this.buildRemoteModel();this.status('Connected','ok');return}
    if(msg.type==='state'){this.remoteState=msg;this.remoteName=safeName(msg.name||this.remoteName);const ri=this.remoteInventory;ri.held=msg.held?V.makeStack(msg.held,1):null;ri.offhand=msg.offhand?V.makeStack(msg.offhand,1):null;for(const slot of ['head','chest','legs','feet'])ri.armor[slot]=msg.armor&&msg.armor[slot]?V.makeStack(msg.armor[slot],1):null;const sig=[msg.held,msg.offhand,...Object.values(msg.armor||{})].join('|');if(sig!==this.remoteEquipmentSig){this.remoteEquipmentSig=sig;if(this.remoteModel&&V.updatePlayerEquipment)V.updatePlayerEquipment(this.remoteModel,ri)}return}
    if(msg.type==='chat'){if(this.game)this.game.ui.chat(`<${V.escapeHtml(safeName(msg.name))}> ${V.escapeHtml(msg.text)}`);return}
    if(msg.type==='world'){if(this.game&&this.role==='guest'){this.game.data.time=msg.time;this.game.weather=msg.weather;this.game.weatherTime=msg.weatherTime}return}
    if(msg.type==='block'){if(this.game){this.applyingRemote=true;this.game.world.setBlock(msg.x,msg.y,msg.z,msg.id,false);this.applyingRemote=false}return}
    if(msg.type==='mobs'&&this.role==='guest'){this.syncMobs(msg.list||[]);return}
    if(msg.type==='mob-hit'&&this.role==='host'&&this.game){const mob=this.game.entities.mobs.find(m=>m._netId===msg.id&&!m.dead);if(mob)mob.takeDamage(Math.max(0,Math.min(96,Number(msg.damage)||1)),new THREE.Vector3(msg.dx||0,msg.dy||0,msg.dz||0));return}
  }
  async startGuest(snapshot){if(this.game||this.closed)return;snapshot.id='multiplayer_guest_'+Date.now();snapshot.name=`${snapshot.name||'World'} — P2P Guest`;snapshot.multiplayerGuest=true;snapshot.hardcoreDead=false;snapshot.inventory=null;snapshot.entities=[];if(snapshot.player&&snapshot.player.position)snapshot.player.position.x+=1.4;await this.app.startWorld(snapshot);this.attach(this.app.game);this.game.ui.chat(`Connected to ${this.remoteName}'s world.`)}
  attach(game){this.game=game;game.multiplayer=this;const set=game.world.setBlock.bind(game.world);game.world.setBlock=(x,y,z,id,playerChange=true)=>{const ok=set(x,y,z,id,playerChange);if(ok&&playerChange&&!this.applyingRemote)this.send({type:'block',x:Math.floor(x),y:Math.floor(y),z:Math.floor(z),id});return ok};if(this.role==='guest'){game.save=()=>{};game.entities.spawnTimer=999999;const oldAttack=game.entities.attackRay.bind(game.entities);game.entities.attackRay=(o,d,r,damage)=>{const hit=oldAttack(o,d,r,damage);if(hit&&hit.mob&&hit.mob._netId)this.send({type:'mob-hit',id:hit.mob._netId,damage:V.computeSafeMeleeDamage?V.computeSafeMeleeDamage(game,damage):damage,dx:d.x,dy:d.y,dz:d.z});return hit}}
    this.ensureHud();this.buildRemoteModel();this.status('Connected','ok')}
  ensureHud(){let e=document.querySelector('#multiplayerHud');if(!e){e=document.createElement('div');e.id='multiplayerHud';document.querySelector('#hud').appendChild(e)}e.textContent=`P2P · ${this.remoteName} · Connected`}
  buildRemoteModel(){if(!this.game||!V.buildPlayerModel)return;if(this.remoteModel){this.game.scene.remove(this.remoteModel);this.remoteModel=null}const settings=Object.assign({},this.app.settings,this.remoteSkin||{});this.remoteModel=V.buildPlayerModel(settings,this.remoteInventory,false);this.remoteModel.visible=false;this.game.scene.add(this.remoteModel)}
  updateRemote(dt){const s=this.remoteState,m=this.remoteModel;if(!s||!m||!this.game)return;m.visible=s.dimension===this.game.world.dimension;if(!m.visible)return;const target=new THREE.Vector3(s.x,s.y,s.z),old=m.position.clone();m.position.x=V.lerp(m.position.x,target.x,Math.min(1,dt*12));m.position.y=V.lerp(m.position.y,target.y,Math.min(1,dt*12));m.position.z=V.lerp(m.position.z,target.z,Math.min(1,dt*12));m.rotation.y=s.yaw||0;const u=m.userData||{},speed=old.distanceTo(m.position)/Math.max(dt,.001),stride=Math.sin((performance.now()*.008))*Math.min(.8,speed*.18);if(u.head){u.head.rotation.x=-(s.pitch||0);if(u.head2)u.head2.rotation.x=-(s.pitch||0)}if(u.leftLeg)u.leftLeg.rotation.x=stride;if(u.rightLeg)u.rightLeg.rotation.x=-stride;if(u.leftArm){u.leftArm.rotation.x=s.blocking?-1.08:-stride*.7;u.leftArm.rotation.z=s.blocking?-.28:0}if(u.rightArm)u.rightArm.rotation.x=stride*.7;if(u.body){u.body.rotation.x=s.sneaking?.22:0;if(u.body2)u.body2.rotation.x=u.body.rotation.x}if(u.head){u.head.position.y=s.sneaking?1.58:1.66;if(u.head2)u.head2.position.y=u.head.position.y}}
  hostMobState(){if(!this.game)return[];let next=1;for(const m of this.game.entities.mobs)if(!m._netId)m._netId=`m${Date.now().toString(36)}_${next++}_${Math.random().toString(36).slice(2,6)}`;return this.game.entities.mobs.filter(m=>!m.dead).slice(0,48).map(m=>({id:m._netId,type:m.type,x:m.position.x,y:m.position.y,z:m.position.z,yaw:m.yaw||0,health:m.health,maxHealth:m.maxHealth,dimension:this.game.world.dimension}))}
  freezeMob(m){if(m._networkGhost)return;m._networkGhost=true;m.update=function(dt){this.hurtTime=Math.max(0,(this.hurtTime||0)-dt);if(this.mesh){this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw||0;tintHurt(this)}}}
  syncMobs(list){if(!this.game)return;const seen=new Set();for(const state of list){if(state.dimension!==this.game.world.dimension)continue;seen.add(state.id);let m=this.mobMap.get(state.id);if(!m||m.dead){m=this.game.entities.spawn(state.type,state.x,state.y,state.z);m._netId=state.id;this.freezeMob(m);this.mobMap.set(state.id,m)}m.position.set(state.x,state.y,state.z);m.yaw=state.yaw;m.health=state.health;m.maxHealth=state.maxHealth;if(m.mesh){m.mesh.position.copy(m.position);m.mesh.rotation.y=m.yaw}}
    for(const [id,m] of [...this.mobMap])if(!seen.has(id)){if(m&&!m.dead)m.remove();this.mobMap.delete(id)}}
  tick(dt){if(!this.connected||!this.game)return;this.sendTimer-=dt;this.hostSyncTimer-=dt;if(this.sendTimer<=0){this.sendTimer=.08;const p=this.game.player;{const inv=this.game.inventory,armor={};for(const slot of ['head','chest','legs','feet'])armor[slot]=inv.armor&&inv.armor[slot]?inv.armor[slot].key:null;this.send({type:'state',name:this.name,x:p.position.x,y:p.position.y,z:p.position.z,yaw:p.yaw,pitch:p.pitch,dimension:this.game.world.dimension,sneaking:!!p.sneaking,blocking:!!p.blocking,held:inv.selectedStack()&&inv.selectedStack().key||null,offhand:inv.offhand&&inv.offhand.key||null,armor})}}if(this.role==='host'&&this.hostSyncTimer<=0){this.hostSyncTimer=.35;this.send({type:'world',time:this.game.data.time,weather:this.game.weather,weatherTime:this.game.weatherTime});this.send({type:'mobs',list:this.hostMobState()})}this.updateRemote(dt)}
  chat(text){return this.send({type:'chat',name:this.name,text:String(text).slice(0,180)})}
  close(){if(this.closed)return;this.closed=true;this.connected=false;if(this.channel)try{this.channel.close()}catch(e){}if(this.pc)try{this.pc.close()}catch(e){}if(this.remoteModel&&this.game)this.game.scene.remove(this.remoteModel);const h=document.querySelector('#multiplayerHud');if(h)h.remove();if(this.app.multiplayer===this)this.app.multiplayer=null}
}
V.MultiplayerSession=MultiplayerSession;

/* Menu integration. */
const UIP=V.UI.prototype,oldAction=UIP.action;
UIP.renderMultiplayerWorlds=function(){const select=this.q('#mpManualHostWorld'),worlds=this.app.storage.list();if(select)select.innerHTML=worlds.map(w=>`<option value="${V.escapeHtml(w.id)}">${V.escapeHtml(w.name)} · ${V.escapeHtml(w.mode)}</option>`).join('')||'<option value="">Create a world in Singleplayer first</option>';const saved=localStorage.getItem('voidlands_player_name')||'Player';for(const id of ['mpHostName','mpJoinName']){const e=this.q('#'+id);if(e)e.value=saved}this.multiplayerStatus('Choose Host or Join. Connection codes can be long; that is normal.')};
UIP.multiplayerStatus=function(text,kind=''){const e=this.q('#multiplayerStatus');if(e){e.textContent=text;e.dataset.kind=kind}};
UIP.copyMultiplayer=function(id){const e=this.q('#'+id);if(!e)return;e.focus();e.select();if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(e.value).then(()=>this.toast('Connection code copied')).catch(()=>{});else{try{document.execCommand('copy');this.toast('Connection code copied')}catch(err){this.toast('Select and copy the code manually')}}};
UIP.action=function(action){
  const app=this.app;
  if(action==='multiplayer'){this.renderMultiplayerWorlds();this.show('multiplayerScreen');return}
  if(action==='multiplayer-back'){if(app.multiplayer&&!app.multiplayer.connected)app.multiplayer.close();this.show('titleScreen');return}
  if(action==='mp-copy-offer'){this.copyMultiplayer('mpHostOffer');return}
  if(action==='mp-copy-answer'){this.copyMultiplayer('mpJoinAnswer');return}
  if(action==='mp-host-offer'){(async()=>{try{if(app.multiplayer)app.multiplayer.close();const name=safeName(this.q('#mpHostName').value),world=this.q('#mpManualHostWorld').value;if(!world)throw new Error('Create a world in Singleplayer first.');localStorage.setItem('voidlands_player_name',name);const s=app.multiplayer=new MultiplayerSession(app,'host',name);this.multiplayerStatus('Gathering connection information…');this.q('#mpHostOffer').value=await s.createHostOffer(world);this.multiplayerStatus('Send the invitation code to the other player, then paste their answer below.','ok')}catch(e){this.multiplayerStatus(e.message||String(e),'error')}})();return}
  if(action==='mp-host-connect'){(async()=>{try{if(!app.multiplayer||app.multiplayer.role!=='host')throw new Error('Create a host invitation first.');await app.multiplayer.acceptAnswer(this.q('#mpHostAnswer').value)}catch(e){this.multiplayerStatus(e.message||String(e),'error')}})();return}
  if(action==='mp-join-answer'){(async()=>{try{if(app.multiplayer)app.multiplayer.close();const name=safeName(this.q('#mpJoinName').value),offer=this.q('#mpJoinOffer').value;if(!offer.trim())throw new Error('Paste the host invitation code first.');localStorage.setItem('voidlands_player_name',name);const s=app.multiplayer=new MultiplayerSession(app,'guest',name);this.multiplayerStatus('Creating answer code…');this.q('#mpJoinAnswer').value=await s.createGuestAnswer(offer);this.multiplayerStatus('Send this answer to the host. This screen will load the world when they connect.','ok')}catch(e){this.multiplayerStatus(e.message||String(e),'error')}})();return}
  return oldAction.call(this,action);
};
const oldChat=V.Game.prototype.handleChat;
V.Game.prototype.handleChat=function(text){if(text&&text[0]!=='/'&&this.multiplayer){this.ui.chat(`<${V.escapeHtml(this.multiplayer.name)}> ${V.escapeHtml(text)}`);this.multiplayer.chat(text);return}return oldChat.call(this,text)};
const oldDestroy=V.Game.prototype.destroy;
V.Game.prototype.destroy=function(){const session=this.multiplayer;const result=oldDestroy.call(this);if(session)session.close();return result};

})(window.Voidlands);
