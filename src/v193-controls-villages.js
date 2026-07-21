(function(){
'use strict';
const V=window.Voidlands,B=V.B,GP=V.Game.prototype;
V.VERSION='1.9.4';

/* -------------------------------------------------------------------------
   Reliable item use: throwable main-hand and offhand items take priority.
   This avoids later block-interaction wrappers swallowing Ender Pearls and
   Wind Charges before the projectile code is reached.
------------------------------------------------------------------------- */
const previousUseOrPlace=GP.useOrPlace;
GP.useSelectedThrowable=function(){
  const stack=this.inventory&&this.inventory.selectedStack&&this.inventory.selectedStack();
  const item=stack&&V.Items[stack.key];
  if(!stack||!item||!['pearl','wind'].includes(item.projectile))return false;
  if((this.projectileCooldown||0)>0)return true;
  if(!this.entities||typeof this.entities.throwProjectile!=='function'){
    this.ui&&this.ui.toast&&this.ui.toast('Projectile system is not ready.');
    return true;
  }
  const direction=this.player.viewDirection(),position=this.player.eyePosition().addScaledVector(direction,.68);
  this.entities.throwProjectile(item.projectile,position,direction);
  this.projectileCooldown=item.projectile==='pearl'?.34:.22;
  if(this.visuals)this.visuals.swing('use');
  if(this.audio)this.audio.play(item.projectile==='wind'?'splash':'swing');
  if(this.mode!=='creative'){
    stack.count--;
    if(stack.count<=0)this.inventory.slots[this.inventory.selected]=null;
  }
  if(this.ui)this.ui.refreshHUD();
  return true;
};
GP.useOrPlace=function(){
  if(this.useSelectedThrowable())return true;
  return previousUseOrPlace.call(this);
};

/* -------------------------------------------------------------------------
   Hold-to-mine and hold-to-attack. Once one block finishes, the held mouse
   button immediately starts the next targeted block instead of stopping.
------------------------------------------------------------------------- */
const previousRenderUpdate=GP.renderUpdate;
GP.renderUpdate=function(dt){
  const result=previousRenderUpdate.call(this,dt);
  this.continuousBreakDelay=Math.max(0,(this.continuousBreakDelay||0)-dt);
  if(this.state==='playing'&&!this.paused&&this.mouse&&this.mouse.left&&!this.breaking&&this.continuousBreakDelay<=0){
    this.continuousBreakDelay=.085;
    this.beginBreak();
  }
  return result;
};
const previousFinishBreak=GP.finishBreak;
GP.finishBreak=function(target){
  const result=previousFinishBreak.call(this,target);
  this.continuousBreakDelay=.055;
  return result;
};
const previousMouseUp=GP.mouseUp;
GP.mouseUp=function(event){
  const result=previousMouseUp.call(this,event);
  if(event&&event.button===0)this.continuousBreakDelay=0;
  return result;
};

/* -------------------------------------------------------------------------
   Wind Burst III should feel like a real launch enchantment. The earlier
   impulse was only a boosted jump; this gives level III a dramatic ascent.
------------------------------------------------------------------------- */
const previousBeginBreak=GP.beginBreak;
GP.beginBreak=function(){
  const stack=this.inventory&&this.inventory.selectedStack&&this.inventory.selectedStack();
  const item=stack&&V.Items[stack.key],isMace=item&&item.tool==='mace';
  const fall=isMace&&this.player&&this.player.fallStart!=null?Math.max(0,this.player.fallStart-this.player.position.y):0;
  const beforeCooldown=this.attackCooldown||0;
  const result=previousBeginBreak.call(this);
  if(isMace&&fall>1.5&&this.player&&(this.attackCooldown||0)>beforeCooldown&&this.player.velocity.y>0){
    const level=Math.max(3,V.enchantLevel?V.enchantLevel(stack,'wind_burst'):3);
    this.player.velocity.y=Math.max(this.player.velocity.y,14+level*3);
    this.player.windBurstGrace=Math.max(this.player.windBurstGrace||0,2.1+level*.35);
    this.player.grounded=false;this.player.fallStart=null;
    if(this.ui)this.ui.toast(`Wind Burst ${level===3?'III':level} — powerful launch!`);
  }
  return result;
};

/* -------------------------------------------------------------------------
   Expanded village professions and trade pools.
------------------------------------------------------------------------- */
const PROFESSIONS={
  farmer:{name:'Farmer',colour:0x6f873f,trades:[
    {give:['sun_berry',12],get:['emerald',1]},
    {give:['emerald',1],get:['bread',4]},
    {give:['emerald',3],get:['cooked_meat',5]}
  ]},
  blacksmith:{name:'Blacksmith',colour:0x4b4b4b,trades:[
    {give:['coal',12],get:['emerald',1]},
    {give:['emerald',4],get:['iron_pickaxe',1]},
    {give:['emerald',7],get:['iron_sword',1]},
    {give:['emerald',10],extra:['diamond',2],get:['diamond_sword',1]}
  ]},
  librarian:{name:'Librarian',colour:0xb8a56f,trades:[
    {give:['paper',18],get:['emerald',1]},
    {give:['emerald',2],get:['book',3]},
    {give:['emerald',8],extra:['lapis_lazuli',4],get:['enchanting_table',1]}
  ]},
  cleric:{name:'Cleric',colour:0x8d58a7,trades:[
    {give:['rotten_flesh',18],get:['emerald',1]},
    {give:['emerald',5],get:['ender_pearl',1]},
    {give:['emerald',6],extra:['blaze_powder',1],get:['eye_of_ender',1]}
  ]},
  butcher:{name:'Butcher',colour:0xb78066,trades:[
    {give:['raw_meat',10],get:['emerald',1]},
    {give:['emerald',2],get:['cooked_meat',6]},
    {give:['emerald',3],get:['hide',5]}
  ]},
  cartographer:{name:'Cartographer',colour:0xd0b678,trades:[
    {give:['glass',10],get:['emerald',1]},
    {give:['emerald',1],get:['paper',8]},
    {give:['emerald',7],get:['eye_of_ender',1]}
  ]}
};
V.VillagerProfessions=PROFESSIONS;
function label(pair){const item=V.Items[pair[0]];return `${pair[1]} × ${item?item.name:pair[0]}`}
function professionFor(mob){return PROFESSIONS[mob&&mob.profession]||PROFESSIONS.farmer}
function tintVillager(mob){
  const p=professionFor(mob),parts=mob&&mob.parts;
  if(!parts)return;
  const tint=mesh=>{if(mesh&&mesh.material&&mesh.material.color)mesh.material.color.setHex(p.colour)};
  tint(parts.body);for(const leg of parts.legs||[])tint(leg);
  if(mob.mesh)mob.mesh.userData.profession=mob.profession;
}
GP.renderVillagerTrade=function(){
  const mob=this.activeVillager;if(!mob)return;
  const profession=professionFor(mob),trades=profession.trades;
  const title=document.querySelector('#villagerTradeTitle'),professionLabel=document.querySelector('#villagerProfession'),list=document.querySelector('#villagerTradeList'),summary=document.querySelector('#villagerTradeInventory');
  if(title)title.textContent=`${profession.name} Trading`;
  if(professionLabel)professionLabel.textContent=profession.name.toUpperCase();
  if(list){
    list.className='villager-trade-list';
    list.innerHTML=trades.map((trade,index)=>{
      const requirements=[trade.give].concat(trade.extra?[trade.extra]:[]),ready=requirements.every(pair=>this.inventory.count(pair[0])>=pair[1]);
      const give=requirements.map(pair=>`<span class="trade-item"><i class="trade-icon" style="background-image:${V.itemIcon(pair[0])}"></i>${V.escapeHtml(label(pair))}</span>`).join('<b> + </b>');
      return `<button class="villager-trade" data-villager-trade="${index}" ${ready?'':'disabled'}><span>${give}</span><span class="trade-arrow">➜</span><span class="trade-item"><i class="trade-icon" style="background-image:${V.itemIcon(trade.get[0])}"></i>${V.escapeHtml(label(trade.get))}</span></button>`;
    }).join('');
  }
  if(summary)summary.textContent=`Emeralds: ${this.inventory.count('emerald')} · Profession: ${profession.name} · Trade offers: ${trades.length}`;
};
GP.performVillagerTrade=function(index){
  const mob=this.activeVillager;if(!mob)return;
  const trade=professionFor(mob).trades[index];if(!trade)return;
  const requirements=[trade.give].concat(trade.extra?[trade.extra]:[]);
  if(!requirements.every(pair=>this.inventory.count(pair[0])>=pair[1])){this.ui.toast('You do not have the required items.');this.renderVillagerTrade();return}
  requirements.forEach(pair=>this.inventory.remove(pair[0],pair[1]));
  const result=this.inventory.insert(V.makeStack(trade.get[0],trade.get[1]));
  if(result.remaining){
    const inserted=trade.get[1]-result.remaining.count;if(inserted>0)this.inventory.remove(trade.get[0],inserted);
    requirements.forEach(pair=>this.inventory.insert(V.makeStack(pair[0],pair[1])));
    this.ui.toast('Make room in your inventory first.');
  }else{
    this.audio.play('level');this.ui.toast(`Traded for ${label(trade.get)}`);
  }
  this.ui.refreshHUD();this.renderVillagerTrade();
};

/* -------------------------------------------------------------------------
   Iron golems: one persistent defender per loaded village.
------------------------------------------------------------------------- */
function golemMaterial(colour){return new THREE.MeshLambertMaterial({color:colour})}
function golemBox(parent,w,h,d,x,y,z,colour){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),golemMaterial(colour));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function ironGolemMesh(){
  const root=new THREE.Group();root.name='IronGolem';
  const body=golemBox(root,1.15,1.25,.58,0,1.45,0,0xd5d1bf);
  golemBox(root,.82,.72,.72,0,2.38,-.02,0xe4dfca);
  golemBox(root,.28,.20,.16,0,2.28,-.43,0xbcae8e);
  const leftArm=golemBox(root,.34,1.55,.38,-.78,1.40,0,0xc9c5b5),rightArm=golemBox(root,.34,1.55,.38,.78,1.40,0,0xc9c5b5);
  const leftLeg=golemBox(root,.42,1.05,.46,-.28,.52,0,0xb5b3a7),rightLeg=golemBox(root,.42,1.05,.46,.28,.52,0,0xb5b3a7);
  golemBox(root,.12,.08,.04,-.18,2.48,-.39,0xb32626);golemBox(root,.12,.08,.04,.18,2.48,-.39,0xb32626);
  golemBox(root,.13,.58,.04,-.35,1.48,-.31,0x5c8545);golemBox(root,.10,.42,.04,.31,1.20,-.31,0x6f964f);
  root.userData.parts={body,leftArm,rightArm,leftLeg,rightLeg};root.userData.entity=null;return root;
}
const HOSTILE_TYPES=new Set(['gloam','zombie','skeleton','spider','enderman','wither_skeleton','blaze','blazer','ghast','wither','ender_dragon']);
function convertToGolem(manager,m,villageId){
  if(m.mesh&&m.mesh.parent)m.mesh.parent.remove(m.mesh);
  m.type='iron_golem';m.villageId=villageId||null;m.villageGolem=true;m.width=1.35;m.height=2.85;m.health=m.maxHealth=100;m.speed=1.1;m.attackDamage=15;m.aggro=false;m.attackTime=0;m.targetTime=0;m.age=0;
  m.mesh=ironGolemMesh();m.mesh.userData.entity=m;m.parts=m.mesh.userData.parts;m.mesh.position.copy(m.position);manager.group.add(m.mesh);
  m.update=function(dt){
    if(this.dead)return;this.age+=dt;this.hurtTime=Math.max(0,(this.hurtTime||0)-dt);this.attackTime=Math.max(0,(this.attackTime||0)-dt);
    const candidates=this.manager.mobs.filter(other=>other!==this&&!other.dead&&HOSTILE_TYPES.has(other.type));
    let target=null,best=22;for(const other of candidates){const distance=this.position.distanceTo(other.position);if(distance<best){best=distance;target=other}}
    if(target){
      const dx=target.position.x-this.position.x,dz=target.position.z-this.position.z;this.yaw=Math.atan2(-dx,-dz);
      const speed=best>2.15?this.speed:0;this.velocity.x=V.lerp(this.velocity.x,-Math.sin(this.yaw)*speed,Math.min(1,dt*5));this.velocity.z=V.lerp(this.velocity.z,-Math.cos(this.yaw)*speed,Math.min(1,dt*5));
      if(best<2.35&&this.attackTime<=0){this.attackTime=1.05;const push=target.position.clone().sub(this.position);push.y=.35;push.normalize();target.takeDamage(this.attackDamage,push.multiplyScalar(1.6));this.game.audio.play('hostile')}
    }else{
      this.targetTime-=dt;if(this.targetTime<=0){this.targetTime=2+Math.random()*4;this.yaw+=(-1+Math.random()*2)*1.4}
      this.velocity.x=V.lerp(this.velocity.x,-Math.sin(this.yaw)*this.speed*.35,Math.min(1,dt*3));this.velocity.z=V.lerp(this.velocity.z,-Math.cos(this.yaw)*this.speed*.35,Math.min(1,dt*3));
    }
    this.velocity.y-=18*dt;const wasGrounded=this.grounded;this.grounded=false;const bx=this.moveAxis('x',this.velocity.x*dt),bz=this.moveAxis('z',this.velocity.z*dt);if((bx||bz)&&wasGrounded)this.velocity.y=5.2;this.moveAxis('y',this.velocity.y*dt);
    this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw;
    const swing=this.attackTime>.72?Math.sin((1.05-this.attackTime)*9)*1.35:Math.sin(this.age*4)*.08;if(this.parts){this.parts.leftArm.rotation.x=-swing;this.parts.rightArm.rotation.x=-swing;this.parts.leftLeg.rotation.x=Math.sin(this.age*3.2)*.16;this.parts.rightLeg.rotation.x=-this.parts.leftLeg.rotation.x}
    this.mesh.traverse(object=>{if(object.material&&object.material.emissive)object.material.emissive.setHex(this.hurtTime>0?0x661111:0)});
    if(this.position.y<-8)this.remove();
  };
  m.die=function(){if(this.dead)return;this.dead=true;this.game.world.data.stats.mobsDefeated++;this.manager.drop(V.makeStack('iron_ingot',3+Math.floor(Math.random()*3)),this.position.x,this.position.y+.8,this.position.z);if(Math.random()<.35)this.manager.drop(V.makeStack('red_flower',1),this.position.x,this.position.y+.8,this.position.z);this.game.player.xp+=8;this.remove()};
  return m;
}
const CurrentEntityManager=V.EntityManager;
class VillageDefenderEntityManager extends CurrentEntityManager{
  spawn(type,x,y,z){
    if(type==='iron_golem')return convertToGolem(this,super.spawn('grazer',x,y,z),null);
    const mob=super.spawn(type,x,y,z);if(mob&&['villager','blacksmith_villager'].includes(mob.type))tintVillager(mob);return mob;
  }
  spawnVillageResident(marker,resident,index){
    const mob=super.spawnVillageResident(marker,resident,index);mob.profession=resident.profession||'farmer';tintVillager(mob);return mob;
  }
  ensureVillageResidents(){
    if(this.game.world.dimension==='overworld')for(const marker of Object.values(this.game.world.blockEntities))if(marker&&marker.type==='village_marker'){
      const desired=[
        {dx:-7,dz:-6,profession:'farmer'},{dx:7,dz:7,profession:'librarian'},{dx:-10,dz:8,profession:'cleric'},
        {dx:13,dz:-8,profession:'blacksmith'},{dx:4,dz:13,profession:'butcher'},{dx:-14,dz:-2,profession:'cartographer'}
      ];
      marker.residents=desired;marker.golem=marker.golem||{dx:2,dz:-4};
    }
    super.ensureVillageResidents();
    if(this.game.world.dimension!=='overworld')return;
    const player=this.game.player.position;
    for(const marker of Object.values(this.game.world.blockEntities)){
      if(!marker||marker.type!=='village_marker'||Math.hypot(marker.x-player.x,marker.z-player.z)>72)continue;
      if(!this.mobs.some(m=>!m.dead&&m.type==='iron_golem'&&m.villageId===marker.id)){
        const offset=marker.golem||{dx:2,dz:-4},x=marker.x+offset.dx+.5,z=marker.z+offset.dz+.5,y=this.game.world.getSurfaceY(x,z),golem=this.spawn('iron_golem',x,y,z);golem.villageId=marker.id;
      }
    }
  }
  load(list){
    super.load(list);for(const mob of this.mobs){if(mob.profession)tintVillager(mob)}
  }
}
V.EntityManager=VillageDefenderEntityManager;

})();
