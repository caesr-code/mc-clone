(function(){
'use strict';
const V=window.Voidlands,B=V.B,CS=V.CHUNK_SIZE,H=V.WORLD_HEIGHT;
V.VERSION='2.0.1';

/* -------------------------------------------------------------------------
   Blocks, items, recipes and Creative inventory additions.
------------------------------------------------------------------------- */
function addBlock(id,key,name,opts={}){
  const d=Object.assign({id,key,name,solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:1,tool:'any',requiresTool:false,minTier:0,drop:key,maxStack:64,sound:'stone',textures:[key,key,key,key,key,key],placeable:true},opts);
  V.Blocks[id]=d;V.BlockByKey[key]=d;
  if(d.placeable)V.Items[key]=Object.assign({key,name,maxStack:d.maxStack,category:'blocks',icon:d.textures[2]||key,blockId:id},V.Items[key]||{});
  return d;
}
function addItem(key,name,opts={}){V.Items[key]=Object.assign({key,name,maxStack:64,category:'materials',icon:key},V.Items[key]||{},opts);return V.Items[key]}
function addRecipe(recipe){if(!V.Recipes.some(r=>r.out&&r.out[0]===recipe.out[0]&&JSON.stringify(r.shape||r.in)===JSON.stringify(recipe.shape||recipe.in)))V.Recipes.push(recipe)}

B.SHULKER_BOX=57;B.PURPUR=58;B.END_STONE_BRICKS=59;
addBlock(B.SHULKER_BOX,'shulker_box','Shulker Box',{hardness:2,tool:'pickaxe',requiresTool:true,minTier:1,interact:'chest',textures:['wool','wool','wool','wool','wool','wool'],maxStack:1});
addBlock(B.PURPUR,'purpur_block','Purpur Block',{hardness:1.5,tool:'pickaxe',requiresTool:true,minTier:1,textures:['bricks','bricks','bricks','bricks','bricks','bricks']});
addBlock(B.END_STONE_BRICKS,'end_stone_bricks','End Stone Bricks',{hardness:1.8,tool:'pickaxe',requiresTool:true,minTier:1,textures:['sand','sand','sand','sand','sand','sand']});

addItem('gunpowder','Gunpowder');
addItem('firework_rocket','Firework Rocket',{category:'utility',maxStack:64,rocket:true});
addItem('elytra','Elytra',{category:'combat',armourSlot:'chest',maxStack:1,durability:432,elytra:true});
addItem('shulker_shell','Shulker Shell');
addItem('shulker_box','Shulker Box',{category:'blocks',blockId:B.SHULKER_BOX,maxStack:1,icon:'wool'});
addRecipe({type:'shapeless',in:{paper:1,gunpowder:1},out:['firework_rocket',3]});
addRecipe({type:'shaped',shape:['S','C','S'],map:{S:'shulker_shell',C:'chest'},out:['shulker_box',1]});

// End Portal Frames are intentionally Creative-only but fully placeable there.
V.Blocks[B.END_PORTAL_FRAME].placeable=true;
addItem('end_portal_frame','End Portal Frame',{category:'blocks',blockId:B.END_PORTAL_FRAME,maxStack:64,icon:'rift_frame',creativeOnly:true});

const EGG_TYPES={
  cow:'Cow',sheep:'Sheep',pig:'Pig',zombie:'Zombie',skeleton:'Skeleton',spider:'Spider',enderman:'Enderman',creeper:'Creeper',
  blaze:'Blaze',wither_skeleton:'Wither Skeleton',ghast:'Ghast',shulker:'Shulker',villager:'Villager',iron_golem:'Iron Golem'
};
if(!V.ITEM_CATEGORIES.includes('spawn eggs'))V.ITEM_CATEGORIES.push('spawn eggs');
for(const [type,name] of Object.entries(EGG_TYPES))addItem(type+'_spawn_egg',name+' Spawn Egg',{category:'spawn eggs',maxStack:64,spawnMob:type,icon:type+'_spawn_egg',creativeOnly:true});

/* Pixel-art icons and a proper pale, pitted End Stone texture. */
const oldCanvas=V.createItemCanvas;
V.createItemCanvas=function(key,size=32){
  if(!String(key).endsWith('_spawn_egg')&&!['firework_rocket','elytra','gunpowder','shulker_shell','shulker_box','end_portal_frame'].includes(key))return oldCanvas.call(this,key,size);
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{alpha:true});x.imageSmoothingEnabled=false;
  const r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
  if(String(key).endsWith('_spawn_egg')){
    const type=key.slice(0,-10),palette={cow:['#6d432e','#e9d2b7'],sheep:['#e8e7df','#8c8075'],pig:['#e5909b','#6d3f49'],zombie:['#5d8b56','#263b64'],skeleton:['#d9d5bd','#56534b'],spider:['#30242b','#a72737'],enderman:['#17111f','#be55ff'],creeper:['#55a83f','#173d1d'],blaze:['#e47c27','#ffdf63'],wither_skeleton:['#2a2c30','#74787e'],ghast:['#ecece5','#713d42'],shulker:['#9a5e9f','#432c55'],villager:['#a76f50','#6f4c35'],iron_golem:['#d7d2bd','#9e382f']}[type]||['#6f8f57','#d9e8a9'];
    r(4,2,8,12,palette[0]);r(3,5,10,7,palette[0]);r(5,3,3,3,palette[1]);r(9,8,3,3,palette[1]);r(5,11,2,2,palette[1]);r(10,4,2,2,palette[1]);
  }else if(key==='firework_rocket'){r(7,2,3,9,'#e9e5d7');r(6,1,5,3,'#d84343');r(7,11,3,3,'#8d5b34');r(5,13,2,2,'#ffb52e');r(10,13,2,2,'#ff6e2c')}
  else if(key==='elytra'){r(2,3,5,10,'#4d4a68');r(9,3,5,10,'#4d4a68');r(3,4,3,8,'#7b759d');r(10,4,3,8,'#7b759d');r(7,4,2,8,'#26283a');r(1,10,3,4,'#302e48');r(12,10,3,4,'#302e48')}
  else if(key==='gunpowder'){for(const p of [[4,4],[8,3],[11,6],[6,8],[9,11],[4,12]])r(p[0],p[1],3,3,p[0]%2?'#4e5552':'#272c2b')}
  else if(key==='shulker_shell'||key==='shulker_box'){r(3,3,10,10,'#7d4f88');r(4,4,8,8,'#aa72b2');r(4,7,8,2,'#4f3458');r(6,5,4,2,'#d5a1dc')}
  else if(key==='end_portal_frame'){r(2,4,12,9,'#3f5f52');r(3,3,10,8,'#6a8b73');r(5,5,6,4,'#10171a');r(7,5,2,4,'#8ce9b1')}
  const out=document.createElement('canvas');out.width=out.height=size;const o=out.getContext('2d',{alpha:true});o.imageSmoothingEnabled=false;o.drawImage(c,0,0,16,16,0,0,size,size);return out;
};
V.iconCache={};

const oldAtlas=V.createTextureAtlas;
V.createTextureAtlas=function(){
  const atlas=oldAtlas.call(this),name=V.Blocks[B.END_STONE].textures[0],index=V.TextureIndex[name];
  if(index!=null){const tile=atlas.tile||16,cols=atlas.cols||8,ctx=atlas.canvas.getContext('2d'),ox=(index%cols)*tile,oy=Math.floor(index/cols)*tile;ctx.fillStyle='#d8d69a';ctx.fillRect(ox,oy,tile,tile);for(let i=0;i<34;i++){const h=V.Noise.hash3(i,17,29,9127),x=ox+Math.floor(h*913)%tile,y=oy+Math.floor(h*619)%tile;ctx.fillStyle=i%3===0?'#b7b978':i%3===1?'#ebe7ad':'#c9c985';ctx.fillRect(x,y,h>.82?2:1,1)}ctx.fillStyle='#aeb06f';ctx.fillRect(ox+3,oy+4,3,2);ctx.fillRect(ox+10,oy+10,3,2);atlas.texture.needsUpdate=true}
  return atlas;
};

/* -------------------------------------------------------------------------
   Commands: /home, /sethome, relative /tp and mob griefing control.
------------------------------------------------------------------------- */
const GP=V.Game.prototype,oldChat=GP.handleChat;
GP.handleChat=function(text){
  if(!text||text[0]!=='/')return oldChat.call(this,text);
  const args=text.slice(1).trim().split(/\s+/),cmd=(args.shift()||'').toLowerCase();
  if(cmd==='help'){this.ui.chat('Commands: /seed /time /weather /gamemode /tp /home /sethome /give /dimension /gamerule /kill');return}
  if(cmd==='sethome'){
    this.data.home={dimension:this.world.dimension,x:this.player.position.x,y:this.player.position.y,z:this.player.position.z,yaw:this.player.yaw,pitch:this.player.pitch};this.save();this.ui.chat('Home set.');return;
  }
  if(cmd==='home'){
    const h=this.data.home||{dimension:this.data.respawnDimension||'overworld',x:this.player.spawn.x,y:this.player.spawn.y,z:this.player.spawn.z};
    if(h.dimension&&h.dimension!==this.world.dimension)this.switchDimension(h.dimension,true);
    this.player.position.set(h.x,h.y,h.z);this.player.velocity.set(0,0,0);this.player.yaw=h.yaw||0;this.player.pitch=h.pitch||0;this.player.ensureSafePosition();this.ui.chat('Teleported home.');return;
  }
  if(cmd==='tp'&&args.length>=3){
    const base=this.player.position,parse=(v,b)=>String(v).startsWith('~')?b+(Number(String(v).slice(1))||0):Number(v);
    const x=parse(args[0],base.x),y=parse(args[1],base.y),z=parse(args[2],base.z);if([x,y,z].some(n=>!Number.isFinite(n))){this.ui.chat('Usage: /tp <x> <y> <z>');return}this.player.position.set(x,y,z);this.player.velocity.set(0,0,0);this.player.ensureSafePosition();this.ui.chat(`Teleported to ${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}.`);return;
  }
  if(cmd==='gamerule'&&String(args[0]).toLowerCase()==='mobgriefing'){
    if(args[1]!=null)this.data.mobGriefing=!/^(false|0|off)$/i.test(args[1]);
    if(this.data.mobGriefing==null)this.data.mobGriefing=true;this.ui.chat(`mobGriefing = ${this.data.mobGriefing}`);this.save();return;
  }
  return oldChat.call(this,text);
};

/* -------------------------------------------------------------------------
   Explosions, End Crystals and Creative Bedrock breaking.
------------------------------------------------------------------------- */
GP.explode=function(position,power=4,source='generic'){
  const center=position.clone?position.clone():new THREE.Vector3(position.x,position.y,position.z),mobExplosion=source==='creeper'||source==='ghast';
  const playerDistance=this.player.position.clone().add(new THREE.Vector3(0,.9,0)).distanceTo(center);
  if(playerDistance<power*2){const strength=Math.max(0,1-playerDistance/(power*2));this.player.damage(4+strength*12,`was caught in a ${source} explosion`);const push=this.player.position.clone().sub(center);if(push.length()<.1)push.set(0,1,0);this.player.velocity.addScaledVector(push.normalize(),5+strength*9)}
  for(const mob of [...this.entities.mobs]){if(mob.dead)continue;const d=mob.position.distanceTo(center);if(d<power*2){const k=mob.position.clone().sub(center);if(k.length()<.1)k.set(0,1,0);mob.takeDamage(Math.max(1,(power*2-d)*3),k.normalize())}}
  const grief=this.data.mobGriefing!==false||!mobExplosion;
  if(grief){const r=Math.ceil(power);for(let y=Math.floor(center.y-r);y<=Math.ceil(center.y+r);y++)for(let z=Math.floor(center.z-r);z<=Math.ceil(center.z+r);z++)for(let x=Math.floor(center.x-r);x<=Math.ceil(center.x+r);x++){const d=Math.hypot(x+.5-center.x,y+.5-center.y,z+.5-center.z);if(d>power*(.7+Math.random()*.4))continue;const id=this.world.getBlock(x,y,z);if(id===B.AIR||id===B.BEDROCK||id===B.END_PORTAL_FRAME||id===B.END_GATEWAY||id===B.END_PORTAL)continue;this.world.setBlock(x,y,z,B.AIR,false)}}
  for(let i=0;i<38;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:i%3?0xf0b05a:0x5a4a42,toneMapped:false}));mesh.position.copy(center);this.scene.add(mesh);this.particles.push({mesh,v:new THREE.Vector3((Math.random()-.5)*14,Math.random()*12-2,(Math.random()-.5)*14),life:.55+Math.random()*.6})}
  this.audio.play('break');
};
GP.explodeEndCrystal=function(x,y,z){
  if(this.world.getBlock(x,y,z)!==B.END_CRYSTAL)return false;this.world.setBlock(x,y,z,B.AIR,false);delete this.world.blockEntities[V.blockKey(x,y,z)];this.explode(new THREE.Vector3(x+.5,y+.8,z+.5),6,'end crystal');return true;
};

const oldBeginBreak=GP.beginBreak;
GP.beginBreak=function(){
  const origin=this.player.eyePosition(),dir=this.player.viewDirection(),target=this.world.raycast(origin,dir,this.mode==='creative'?8:5.2);
  if(target&&target.id===B.END_CRYSTAL){this.visuals.swing('attack');this.explodeEndCrystal(target.x,target.y,target.z);return}
  if(this.mode==='creative'&&target&&target.id===B.BEDROCK){this.visuals.swing('attack');this.world.setBlock(target.x,target.y,target.z,B.AIR,false);this.audio.play('break');this.spawnParticles(target.x+.5,target.y+.5,target.z+.5,target.id);this.cancelBreak();return}
  const crit=!this.player.grounded&&!this.player.inWater&&this.player.velocity.y<-.05;
  if(!crit)return oldBeginBreak.call(this);
  const original=this.entities.attackRay;this.entities.attackRay=(o,d,r,damage)=>original.call(this.entities,o,d,r,damage*1.5);
  try{return oldBeginBreak.call(this)}finally{this.entities.attackRay=original}
};

/* -------------------------------------------------------------------------
   Spawn eggs, rockets, Shulker Boxes and portal frame placement.
------------------------------------------------------------------------- */
const oldUse=GP.useOrPlace;
GP.useOrPlace=function(){
  const stack=this.inventory.selectedStack(),item=stack&&V.Items[stack.key];
  if(item&&item.spawnMob){
    const hit=this.target||this.world.raycast(this.player.eyePosition(),this.player.viewDirection(),8);if(!hit)return;
    const p=hit.place,y=this.world.getBlock(p.x,p.y,p.z)===B.AIR?p.y:this.world.getSurfaceY(p.x,p.z);
    this.entities.spawn(item.spawnMob,p.x+.5,y,p.z+.5);if(this.mode!=='creative'){stack.count--;if(stack.count<=0)this.inventory.slots[this.inventory.selected]=null}this.visuals.swing('use');this.ui.toast(`${EGG_TYPES[item.spawnMob]||item.spawnMob} spawned`);this.ui.refreshHUD();return;
  }
  if(item&&item.rocket){
    const chest=this.inventory.armor&&this.inventory.armor.chest,elytra=chest&&V.Items[chest.key]&&V.Items[chest.key].elytra;
    if(elytra&&!this.player.grounded){const d=this.player.viewDirection();this.player.velocity.addScaledVector(d,14);this.player.velocity.y=Math.max(this.player.velocity.y,3+d.y*8);this.player.elytraBoost=1.1;this.audio.play('swing');if(this.mode!=='creative'){stack.count--;if(stack.count<=0)this.inventory.slots[this.inventory.selected]=null}this.ui.refreshHUD();return}
  }
  return oldUse.call(this);
};

const WP=V.World.prototype,oldEnsure=WP.ensureBlockEntity,oldAddBox=WP.addBox,oldBuild=WP.buildChunk;
WP.ensureBlockEntity=function(x,y,z,type){if(this.getBlock(x,y,z)===B.SHULKER_BOX){const k=V.blockKey(x,y,z);return this.blockEntities[k]||(this.blockEntities[k]={type:'chest',slots:Array.from({length:27},()=>null),shulkerBox:true})}return oldEnsure.call(this,x,y,z,type)};

/* -------------------------------------------------------------------------
   End Crystal models that live in chunk groups instead of cube geometry.
------------------------------------------------------------------------- */
WP.addBox=function(g,x,y,z,id,min,max,category){if(id===B.END_CRYSTAL)return;return oldAddBox.call(this,g,x,y,z,id,min,max,category)};
function crystalModel(x,y,z){
  const root=new THREE.Group();root.name='EndCrystalModel';root.position.set(x+.5,y,z+.5);
  const glass=new THREE.MeshBasicMaterial({color:0xe8faff,transparent:true,opacity:.42,wireframe:true,toneMapped:false});
  const cage=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.8),glass);cage.position.y=.95;cage.rotation.y=Math.PI/4;cage.rotation.z=Math.PI/4;root.add(cage);
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.25,0),new THREE.MeshBasicMaterial({color:0xf06dff,toneMapped:false}));core.position.y=.95;root.add(core);
  const base=new THREE.Mesh(new THREE.BoxGeometry(.8,.22,.8),new THREE.MeshLambertMaterial({color:0x2a252f}));base.position.y=.11;root.add(base);
  root.userData.crystal={x,y,z};return root;
}
WP.buildChunk=function(cx,cz){oldBuild.call(this,cx,cz);const group=this.chunkMeshes.get(V.chunkKey(cx,cz));if(!group)return;for(let z=0;z<CS;z++)for(let y=0;y<H;y++)for(let x=0;x<CS;x++){const wx=cx*CS+x,wz=cz*CS+z;if(this.getBlock(wx,y,wz)===B.END_CRYSTAL)group.add(crystalModel(wx,y,wz))}};

/* -------------------------------------------------------------------------
   Natural Overworld lava, including deterministic retro-generation in old
   explored chunks, and End Cities/ships with Shulker markers.
------------------------------------------------------------------------- */
const oldOverworld=WP.generateChunkData,oldEnd=WP.generateStarChunk;
function localIndex(x,y,z){return y*CS*CS+z*CS+x}
function unmodified(world,wx,y,wz){return world.modified[V.blockKey(wx,y,wz)]==null}
WP.generateChunkData=function(cx,cz){
  const a=oldOverworld.call(this,cx,cz);if(this.dimension!=='overworld'||!a||a.__v200Lava)return a;a.__v200Lava=true;
  for(let z=1;z<CS-1;z++)for(let x=1;x<CS-1;x++)for(let y=5;y<=17;y++){const wx=cx*CS+x,wz=cz*CS+z,i=localIndex(x,y,z),id=a[i],n=V.Noise.hash3(wx,y,wz,this.seed+20001);if((id===B.STONE||id===B.DEEPSLATE)&&n>.9992&&unmodified(this,wx,y,wz)){a[i]=B.LAVA;this.blockEntities[V.blockKey(wx,y,wz)]={type:'fluid',fluid:'lava',source:true,level:0,natural:true}}}
  const pool=V.Noise.hash3(cx,200,cz,this.seed+20003);if(pool>.9985){const lx=7,lz=7,wx=cx*CS+lx,wz=cz*CS+lz,top=this.terrainInfo(wx,wz).height;if(top>V.SEA_LEVEL+2&&top<H-3){for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const px=lx+dx,pz=lz+dz;if(px<1||px>14||pz<1||pz>14)continue;const xx=cx*CS+px,zz=cz*CS+pz;if(unmodified(this,xx,top,zz)){a[localIndex(px,top,pz)]=B.LAVA;this.blockEntities[V.blockKey(xx,top,zz)]={type:'fluid',fluid:'lava',source:true,level:0,natural:true}}}}}
  return a;
};
function setEnd(a,x,y,z,id){if(x>=0&&x<CS&&z>=0&&z<CS&&y>0&&y<H)a[localIndex(x,y,z)]=id}
function buildEndCity(world,a,cx,cz){
  const regionX=Math.floor(cx/12),regionZ=Math.floor(cz/12),rx=V.mod(cx,12),rz=V.mod(cz,12),pickX=2+Math.floor(V.Noise.hash3(regionX,13,regionZ,world.seed+20111)*7),pickZ=2+Math.floor(V.Noise.hash3(regionX,19,regionZ,world.seed+20117)*7);
  if(rx!==pickX||rz!==pickZ||Math.hypot(cx,cz)<8)return;
  const y=43;for(let z=3;z<=12;z++)for(let x=3;x<=12;x++)setEnd(a,x,y-1,z,B.END_STONE_BRICKS);
  for(let yy=y;yy<=y+16;yy++)for(let z=5;z<=10;z++)for(let x=5;x<=10;x++){const wall=x===5||x===10||z===5||z===10;setEnd(a,x,yy,z,wall?B.PURPUR:B.AIR)}
  for(let yy=y+3;yy<=y+15;yy+=4)for(let z=4;z<=11;z++)for(let x=4;x<=11;x++)if(x===4||x===11||z===4||z===11)setEnd(a,x,yy,z,B.PURPUR);
  setEnd(a,7,y+1,7,B.CHEST);world.blockEntities[V.blockKey(cx*CS+7,y+1,cz*CS+7)]={type:'chest',slots:Array.from({length:27},(_,i)=>i===0?V.makeStack('diamond',3):i===1?V.makeStack('ender_pearl',4):i===2?V.makeStack('shulker_shell',1):null),endCity:true};
  for(const [x1,z1,yy] of [[5,5,y+4],[10,10,y+8],[5,10,y+12]])world.blockEntities[V.blockKey(cx*CS+x1,yy,cz*CS+z1)]={type:'shulker_marker',spawned:false,x:cx*CS+x1+.5,y:yy,z:cz*CS+z1+.5};
  // Compact End Ship suspended beside the tower, with guaranteed Elytra.
  for(let z=1;z<=4;z++)for(let x=1;x<=13;x++){if(Math.abs(x-7)+Math.abs(z-3)<8)setEnd(a,x,y+19,z,B.PURPUR)}
  for(let x=4;x<=10;x++)setEnd(a,x,y+20,3,B.END_STONE_BRICKS);setEnd(a,7,y+21,3,B.CHEST);world.blockEntities[V.blockKey(cx*CS+7,y+21,cz*CS+3)]={type:'chest',slots:Array.from({length:27},(_,i)=>i===0?V.makeStack('elytra',1):i===1?V.makeStack('firework_rocket',12):i===2?V.makeStack('diamond',2):null),endShip:true};
}
WP.generateStarChunk=function(cx,cz){const a=oldEnd.call(this,cx,cz);if(!a.__v200EndCity){buildEndCity(this,a,cx,cz);a.__v200EndCity=true}return a};

/* -------------------------------------------------------------------------
   Creepers, Shulkers and a rebuilt, correctly durable Wither.
------------------------------------------------------------------------- */
function mat(color,emissive=0){return new THREE.MeshLambertMaterial({color,emissive})}
function box(parent,w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function dispose(root){if(!root)return;root.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();if(o.material&&o.material.dispose)o.material.dispose()})}
function creeperMesh(){const g=new THREE.Group();box(g,.5,.9,.34,0,1.02,0,0x4f9d42);box(g,.58,.58,.58,0,1.72,-.03,0x60af4b);for(const [x,z] of [[-.18,-.12],[.18,-.12],[-.18,.18],[.18,.18]])box(g,.22,.55,.22,x,.28,z,0x3d8136);box(g,.12,.15,.025,-.13,1.78,-.325,0x172019);box(g,.12,.15,.025,.13,1.78,-.325,0x172019);box(g,.16,.22,.025,0,1.56,-.325,0x172019);return g}
function shulkerMesh(){const g=new THREE.Group();const base=box(g,.9,.45,.9,0,.23,0,0x765181),lid=box(g,.92,.42,.92,0,.72,0,0xa16cad),head=box(g,.48,.48,.48,0,.55,0,0xd2a2d6);box(g,.09,.08,.02,-.13,.59,-.255,0x141018);box(g,.09,.08,.02,.13,.59,-.255,0x141018);g.userData.parts={lid,head,base};return g}
function witherMesh(){const g=new THREE.Group();const spine=box(g,1.15,.55,.55,0,2.25,0,0x25272d);for(let i=0;i<4;i++)box(g,.18,.18,1.45,(i-1.5)*.28,1.62-(i%2)*.22,0,0x3d4047);for(const s of [-1,0,1]){const neck=box(g,.25,.25,.48,s*.92,2.28,0,0x34373d);const head=box(g,.78,.72,.72,s*.92,2.58,-.12,s===0?0x17191d:0x30343a);box(g,.13,.09,.025,s*.92-.18,2.66,-.492,0xd9e7ef);box(g,.13,.09,.025,s*.92+.18,2.66,-.492,0xd9e7ef);box(g,.24,.11,.025,s*.92,2.43,-.492,0x08090b)}box(g,.3,.72,.3,0,1.08,0,0x2d3036);g.userData.parts={spine};return g}
function morphCreeper(manager,m){manager.group.remove(m.mesh);dispose(m.mesh);m.type='creeper';m.width=.62;m.height=2;m.health=m.maxHealth=20;m.speed=2;m.attackDamage=0;m.fuse=0;m.exploded=false;m.mesh=creeperMesh();m.mesh.userData.entity=m;m.mesh.position.copy(m.position);manager.group.add(m.mesh);m.update=function(dt){if(this.dead)return;this.age+=dt;this.hurtTime=Math.max(0,this.hurtTime-dt);const p=this.game.player,d=this.position.distanceTo(p.position),dx=p.position.x-this.position.x,dz=p.position.z-this.position.z;this.yaw=Math.atan2(-dx,-dz);const close=d<3.2;if(close)this.fuse+=dt;else this.fuse=Math.max(0,this.fuse-dt*1.8);const speed=close?0:this.speed;this.velocity.x=V.lerp(this.velocity.x,-Math.sin(this.yaw)*speed,Math.min(1,dt*4));this.velocity.z=V.lerp(this.velocity.z,-Math.cos(this.yaw)*speed,Math.min(1,dt*4));this.velocity.y-=18*dt;this.grounded=false;this.moveAxis('x',this.velocity.x*dt);this.moveAxis('z',this.velocity.z*dt);this.moveAxis('y',this.velocity.y*dt);const flash=this.fuse>0&&Math.floor(this.fuse*8)%2===0;this.mesh.traverse(o=>{if(o.material&&o.material.emissive)o.material.emissive.setHex(flash?0x99ff99:this.hurtTime>0?0x661111:0)});this.mesh.scale.setScalar(1+Math.max(0,this.fuse-1)*.08);this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw;if(this.fuse>=1.6){this.exploded=true;this.dead=true;this.game.explode(this.position.clone().add(new THREE.Vector3(0,1,0)),4,'creeper');this.remove()}};
  m.die=function(){if(this.dead)return;this.dead=true;if(!this.exploded)this.manager.drop(V.makeStack('gunpowder',1+Math.floor(Math.random()*2)),this.position.x,this.position.y+.5,this.position.z);this.game.world.data.stats.mobsDefeated++;this.remove()};return m}
function morphShulker(manager,m){manager.group.remove(m.mesh);dispose(m.mesh);m.type='shulker';m.width=.9;m.height=1.15;m.health=m.maxHealth=30;m.speed=0;m.attackDamage=4;m.attackTime=1.5;m.mesh=shulkerMesh();m.mesh.userData.entity=m;m.mesh.position.copy(m.position);manager.group.add(m.mesh);m.update=function(dt){if(this.dead)return;this.age+=dt;this.hurtTime=Math.max(0,this.hurtTime-dt);this.attackTime-=dt;const p=this.game.player,d=this.position.distanceTo(p.position),parts=this.mesh.userData.parts;if(parts&&parts.lid)parts.lid.position.y=.72+Math.sin(this.age*2)*.08;if(d<18&&this.attackTime<=0){this.attackTime=2.5;p.damage(4,'was struck by a Shulker bullet');p.levitation=Math.max(p.levitation||0,3);this.game.ui.toast('Levitation');this.game.audio.play('hostile')}this.mesh.position.copy(this.position);this.mesh.traverse(o=>{if(o.material&&o.material.emissive)o.material.emissive.setHex(this.hurtTime>0?0x661111:0)})};m.die=function(){if(this.dead)return;this.dead=true;this.manager.drop(V.makeStack('shulker_shell',1),this.position.x,this.position.y+.5,this.position.z);this.game.world.data.stats.mobsDefeated++;this.remove()};return m}

function dragonMesh(){
  const g=new THREE.Group(),body=new THREE.Group(),neck=new THREE.Group(),tail=new THREE.Group(),wings=new THREE.Group();
  g.add(body,neck,tail,wings);
  box(body,2.45,1.45,4.6,0,2.05,0,0x24132f);
  box(body,1.75,1.1,2.1,0,2.15,-2.95,0x321943);
  const jaw=box(body,1.45,.42,1.5,0,1.76,-3.48,0x1b0d25);
  for(const sx of [-1,1]){
    box(body,.22,.18,.08,sx*.43,2.38,-4.03,0xd85cff);
    const horn=box(body,.18,.65,.18,sx*.48,2.92,-3.25,0xb8a0c7);horn.rotation.x=-.48;
    const leg=box(body,.38,1.25,.42,sx*.82,1.04,.75,0x21112b);leg.rotation.x=.18;
    const claw=box(body,.46,.18,.66,sx*.82,.38,.48,0x15101b);claw.rotation.x=-.12;
  }
  const neckParts=[];for(let i=0;i<5;i++){const n=box(neck,1.15-i*.1,.95-i*.07,1.05,0,2.08+Math.sin(i*.55)*.12,-1.85+i*.62,0x2b1738);neckParts.push(n)}
  const tailParts=[];for(let i=0;i<8;i++){const t=box(tail,1.05-i*.085,.78-i*.055,1.35,0,1.9-i*.035,2.65+i*1.03,0x271431);tailParts.push(t)}
  const wingParts=[];for(const side of [-1,1]){const root=new THREE.Group();root.position.set(side*1.05,2.48,.15);wings.add(root);const bone=box(root,4.6,.22,.3,side*2.15,0,0,0x39204a);bone.rotation.z=side*.08;const membrane=box(root,4.35,.08,3.1,side*2.05,-.18,.8,0x5a2d70);membrane.rotation.z=side*.08;membrane.rotation.y=side*.16;const tip=box(root,2.8,.16,.24,side*5.35,-.15,.9,0x382047);tip.rotation.z=side*.28;wingParts.push(root)}
  g.userData.parts={body,neck,tail,wings,neckParts,tailParts,wingParts,jaw};return g;
}
function upgradeDragon(manager,m){
  manager.group.remove(m.mesh);dispose(m.mesh);m.mesh=dragonMesh();m.mesh.userData.entity=m;m.mesh.position.copy(m.position);manager.group.add(m.mesh);
  m.health=m.maxHealth=1080;m.width=6.4;m.height=4.4;m.attackDamage=16;m._dragonDeathTime=0;
  const originalDie=m.die.bind(m);
  m.update=function(dt){
    if(this.dead)return;this.age+=dt;this.hurtTime=Math.max(0,this.hurtTime-dt);this.attackTime-=dt;
    const p=this.game.player,center=new THREE.Vector3(8,49,8),orbit=this.age*.16;
    const target=center.clone().add(new THREE.Vector3(Math.cos(orbit)*23,5+Math.sin(orbit*.73)*7,Math.sin(orbit)*23));
    const playerDist=this.position.distanceTo(p.position);if(playerDist<17&&Math.sin(this.age*.31)>.72)target.copy(p.eyePosition());
    const desired=target.sub(this.position).normalize(),speed=5.8;this.position.addScaledVector(desired,dt*speed);
    const targetYaw=Math.atan2(-desired.x,-desired.z),delta=Math.atan2(Math.sin(targetYaw-this.yaw),Math.cos(targetYaw-this.yaw));this.yaw+=delta*Math.min(1,dt*2.7);
    if(playerDist<4.8&&this.attackTime<=0){this.attackTime=1.25;p.damage(16,'was slain by the Ender Dragon');p.velocity.addScaledVector(p.position.clone().sub(this.position).normalize(),12)}
    const parts=this.mesh.userData.parts,flap=Math.sin(this.age*4.2);
    if(parts){parts.wingParts.forEach((w,i)=>{const side=i===0?-1:1;w.rotation.z=side*(.18+flap*.34);w.rotation.x=.08+Math.cos(this.age*2.1)*.06});parts.neckParts.forEach((n,i)=>{n.rotation.y=Math.sin(this.age*1.6-i*.48)*.12;n.rotation.x=Math.sin(this.age*1.1-i*.33)*.045});parts.tailParts.forEach((t,i)=>{t.rotation.y=Math.sin(this.age*1.8-i*.46)*(.12+i*.018);t.rotation.x=Math.cos(this.age*1.25-i*.31)*.035});parts.jaw.rotation.x=.12+Math.max(0,Math.sin(this.age*.9))*.22}
    this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw;this.mesh.rotation.z=-delta*.38;this.mesh.rotation.x=-desired.y*.22;
    this.mesh.traverse(o=>{if(o.material&&o.material.color){if(!o.userData.baseColor)o.userData.baseColor=o.material.color.clone?o.material.color.clone():new THREE.Color(o.material.color);if(this.hurtTime>0)o.material.color.set(0xff3939);else o.material.color.copy(o.userData.baseColor)}})
  };
  m.die=function(){if(this.dead)return;originalDie()};return m;
}
function upgradeWither(manager,m){manager.group.remove(m.mesh);dispose(m.mesh);m.mesh=witherMesh();m.mesh.userData.entity=m;m.mesh.position.copy(m.position);manager.group.add(m.mesh);m.health=m.maxHealth=540;m.width=2.6;m.height=3.1;m.attackDamage=10;return m}

const BaseManager=V.EntityManager;
class EndgameEntityManager extends BaseManager{
  constructor(game){super(game);this.markerTimer=.25}
  spawn(type,x,y,z){let m;if(type==='creeper'){m=super.spawn('zombie',x,y,z);return morphCreeper(this,m)}if(type==='shulker'){m=super.spawn('pig',x,y,z);return morphShulker(this,m)}m=super.spawn(type,x,y,z);if(type==='wither')upgradeWither(this,m);if(type==='ender_dragon')upgradeDragon(this,m);if(type==='iron_golem'){m.health=m.maxHealth=270;m.attackDamage=Math.max(m.attackDamage||0,15)}return m}
  trySpawn(){if(this.game.world.dimension==='overworld'&&this.game.isNight()&&this.game.difficulty!=='peaceful'&&Math.random()<.28){const p=this.game.player,a=Math.random()*Math.PI*2,d=14+Math.random()*18,x=Math.floor(p.position.x+Math.cos(a)*d),z=Math.floor(p.position.z+Math.sin(a)*d),y=this.game.world.getSurfaceY(x,z);if(this.game.world.getBlock(x,y,z)===B.AIR&&this.game.world.getBlock(x,y+1,z)===B.AIR){this.spawn('creeper',x+.5,y,z+.5);return}}return super.trySpawn()}
  ensureShulkers(){if(this.game.world.dimension!=='starreach')return;const p=this.game.player.position;for(const e of Object.values(this.game.world.blockEntities)){if(!e||e.type!=='shulker_marker'||e.spawned||Math.hypot(e.x-p.x,e.z-p.z)>64)continue;e.spawned=true;this.spawn('shulker',e.x,e.y,e.z)}}
  update(dt){super.update(dt);this.markerTimer-=dt;if(this.markerTimer<=0){this.markerTimer=1;this.ensureShulkers()}}
}
V.EntityManager=EndgameEntityManager;

/* Player levitation and Elytra glide. */
const PP=V.Player.prototype,oldPlayerUpdate=PP.update;
PP.update=function(dt){oldPlayerUpdate.call(this,dt);if(this.levitation>0){this.levitation=Math.max(0,this.levitation-dt);this.velocity.y=Math.max(this.velocity.y,3.2)}const chest=this.game.inventory.armor&&this.game.inventory.armor.chest,it=chest&&V.Items[chest.key],gliding=!!(it&&it.elytra&&!this.grounded&&!this.inWater&&this.velocity.y<1&&this.game.mode!=='creative');this.gliding=gliding;if(gliding){const dir=this.viewDirection(),speed=Math.max(6,Math.hypot(this.velocity.x,this.velocity.z));this.velocity.y=Math.max(this.velocity.y,-1.25+dir.y*2.2);this.velocity.x=V.lerp(this.velocity.x,dir.x*(speed+.05),Math.min(1,dt*2.2));this.velocity.z=V.lerp(this.velocity.z,dir.z*(speed+.05),Math.min(1,dt*2.2));this.fallStart=null}if(this.elytraBoost>0)this.elytraBoost=Math.max(0,this.elytraBoost-dt)};

/* Elytra wings on the third-person model. */
const PVP=V.PlayerVisuals.prototype,oldCreateThird=PVP.createThirdPerson,oldVisualUpdate=PVP.update;
PVP.createThirdPerson=function(){oldCreateThird.call(this);this.elytraGroup=new THREE.Group();const matWing=new THREE.MeshLambertMaterial({color:0x554f70,side:THREE.DoubleSide});for(const s of [-1,1]){const wing=new THREE.Mesh(new THREE.BoxGeometry(.08,.88,.68),matWing.clone());wing.position.set(s*.38,1.18,.28);wing.rotation.z=s*.48;wing.rotation.x=.15;wing.castShadow=true;this.elytraGroup.add(wing)}this.thirdPerson.add(this.elytraGroup)};
PVP.update=function(dt){oldVisualUpdate.call(this,dt);if(this.elytraGroup){const chest=this.game.inventory.armor&&this.game.inventory.armor.chest,show=!!(chest&&V.Items[chest.key]&&V.Items[chest.key].elytra);this.elytraGroup.visible=show;if(show){this.elytraGroup.rotation.x=this.game.player.gliding?-.8:0;this.elytraGroup.rotation.z=Math.sin(performance.now()*.002)*.04}}};

/* Crystal contact detonation, shulker marker scans and save defaults. */
const oldFixed=GP.fixedUpdate;
GP.fixedUpdate=function(dt){const result=oldFixed.call(this,dt);if(this.data.mobGriefing==null)this.data.mobGriefing=true;const p=this.player.position,x=Math.floor(p.x),y=Math.floor(p.y),z=Math.floor(p.z);for(let yy=y-1;yy<=y+2;yy++)for(let zz=z-1;zz<=z+1;zz++)for(let xx=x-1;xx<=x+1;xx++)if(this.world.getBlock(xx,yy,zz)===B.END_CRYSTAL&&Math.hypot(p.x-(xx+.5),p.y+.9-(yy+.8),p.z-(zz+.5))<1.25)this.explodeEndCrystal(xx,yy,zz);return result};

})();
