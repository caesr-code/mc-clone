(function(){
'use strict';
const V=window.Voidlands,B=V.B,CS=V.CHUNK_SIZE,H=V.WORLD_HEIGHT;
if(!V)return;
V.VERSION='2.2.0';

/* -------------------------------------------------------------------------
   Purpur blocks and an extended pixel atlas.
------------------------------------------------------------------------- */
B.PURPUR_PILLAR=B.PURPUR_PILLAR||60;
if(!V.Blocks[B.PURPUR_PILLAR]){
  const def={id:B.PURPUR_PILLAR,key:'purpur_pillar',name:'Purpur Pillar',solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:1.5,tool:'pickaxe',requiresTool:true,minTier:1,drop:'purpur_pillar',maxStack:64,sound:'stone',textures:['purpur_pillar','purpur_pillar','purpur_pillar_top','purpur_pillar_top','purpur_pillar','purpur_pillar'],placeable:true};
  V.Blocks[B.PURPUR_PILLAR]=def;V.BlockByKey.purpur_pillar=def;
  V.Items.purpur_pillar={key:'purpur_pillar',name:'Purpur Pillar',maxStack:64,category:'blocks',icon:'purpur_pillar',blockId:B.PURPUR_PILLAR};
}
if(V.Blocks[B.PURPUR])V.Blocks[B.PURPUR].textures=['purpur_block','purpur_block','purpur_block','purpur_block','purpur_block','purpur_block'];
if(V.Blocks[B.END_STONE_BRICKS])V.Blocks[B.END_STONE_BRICKS].textures=['end_stone_bricks_v2','end_stone_bricks_v2','end_stone_bricks_v2','end_stone_bricks_v2','end_stone_bricks_v2','end_stone_bricks_v2'];
const EXTRA_TILES=['purpur_block','purpur_pillar','purpur_pillar_top','end_stone_bricks_v2'];
const oldCreateAtlas=V.createTextureAtlas,oldGetUV=V.getUV,oldTileCanvas=V.createTileCanvas;
let extendedRows=0,extendedCols=8,extendedTile=16,baseTileCount=0;
function paintExtra(ctx,name,ox,oy,tile){
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(ox+x,oy+y,w,h)};
  if(name==='purpur_block'){
    r(0,0,tile,tile,'#a66ab0');
    for(let y=0;y<tile;y+=4){r(0,y,tile,1,'#77477f');r(0,y+1,tile,1,'#c58dcc')}
    for(let x=2;x<tile;x+=5){r(x,1,1,2,'#e0a7e4');r((x+2)%tile,6,2,1,'#6b3e73');r(x,11,1,3,'#8f5799')}
  }else if(name==='purpur_pillar'){
    r(0,0,tile,tile,'#9960a4');
    for(let x=0;x<tile;x+=4){r(x,0,1,tile,'#6d4177');r(x+1,0,2,tile,'#bd82c4');r(x+3,0,1,tile,'#87518f')}
    for(let y=3;y<tile;y+=6)r(0,y,tile,1,'#d29ad5');
  }else if(name==='purpur_pillar_top'){
    r(0,0,tile,tile,'#a86db1');r(1,1,tile-2,tile-2,'#7c4a84');r(3,3,tile-6,tile-6,'#bd82c4');r(5,5,tile-10,tile-10,'#6f4078');r(7,7,2,2,'#d9a4dd');
  }else{
    r(0,0,tile,tile,'#d6d39a');
    const stones=[[0,0,7,5],[8,0,8,4],[0,6,5,5],[6,5,10,6],[0,12,8,4],[9,12,7,4]];
    stones.forEach((s,i)=>{r(s[0],s[1],s[2],s[3],i%2?'#e4e0aa':'#c5c486');r(s[0],s[1],s[2],1,'#a9aa70');r(s[0],s[1],1,s[3],'#a9aa70')});
  }
}
V.createTextureAtlas=function(){
  const base=oldCreateAtlas.call(this);extendedCols=base.cols||8;extendedTile=base.tile||16;baseTileCount=Object.keys(V.TextureIndex).length;
  for(const name of EXTRA_TILES)if(V.TextureIndex[name]==null)V.TextureIndex[name]=baseTileCount++;
  extendedRows=Math.ceil(baseTileCount/extendedCols);
  const c=document.createElement('canvas');c.width=extendedCols*extendedTile;c.height=extendedRows*extendedTile;const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(base.canvas,0,0);
  for(const name of EXTRA_TILES){const i=V.TextureIndex[name],ox=(i%extendedCols)*extendedTile,oy=Math.floor(i/extendedCols)*extendedTile;paintExtra(ctx,name,ox,oy,extendedTile)}
  const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;if('encoding' in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;
  return{texture:tex,canvas:c,cols:extendedCols,rows:extendedRows,tile:extendedTile};
};
V.getUV=function(name){if(V.TextureIndex[name]==null||!extendedRows)return oldGetUV(name);const i=V.TextureIndex[name],x=i%extendedCols,y=Math.floor(i/extendedCols),pad=.0015;return{u0:x/extendedCols+pad,u1:(x+1)/extendedCols-pad,v0:1-(y+1)/extendedRows+pad,v1:1-y/extendedRows-pad}};
V.createTileCanvas=function(name,size=64){if(!EXTRA_TILES.includes(name))return oldTileCanvas.call(this,name,size);const c=document.createElement('canvas');c.width=c.height=size;const small=document.createElement('canvas');small.width=small.height=16;paintExtra(small.getContext('2d',{alpha:true}),name,0,0,16);const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,16,16,0,0,size,size);return c};
V.iconCache={};

/* -------------------------------------------------------------------------
   Proper multi-tower End Cities and a recognisable End Ship.
------------------------------------------------------------------------- */
const WP=V.World.prototype,oldStar=WP.generateStarChunk;
function li(x,y,z){return y*CS*CS+z*CS+x}
function setWorld(a,cx,cz,wx,y,wz,id){if(y<=0||y>=H)return;const lx=wx-cx*CS,lz=wz-cz*CS;if(lx>=0&&lx<CS&&lz>=0&&lz<CS)a[li(lx,y,lz)]=id}
function getWorld(a,cx,cz,wx,y,wz){const lx=wx-cx*CS,lz=wz-cz*CS;if(lx<0||lx>=CS||lz<0||lz>=CS||y<=0||y>=H)return B.AIR;return a[li(lx,y,lz)]}
function boxFill(a,cx,cz,x0,y0,z0,x1,y1,z1,id){for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)setWorld(a,cx,cz,x,y,z,id)}
function hollowTower(a,cx,cz,x0,z0,w,y0,y1){
  const x1=x0+w-1,z1=z0+w-1;
  for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
    const edge=x===x0||x===x1||z===z0||z===z1,corner=(x===x0||x===x1)&&(z===z0||z===z1);
    if(edge)setWorld(a,cx,cz,x,y,z,corner?B.PURPUR_PILLAR:B.PURPUR);else setWorld(a,cx,cz,x,y,z,B.AIR);
  }
  for(let y=y0;y<=y1;y+=5)boxFill(a,cx,cz,x0,y,z0,x1,y,z1,B.END_STONE_BRICKS);
  for(let y=y0+2;y<y1;y+=5){const mid=Math.floor(w/2);setWorld(a,cx,cz,x0,y,z0+mid,B.AIR);setWorld(a,cx,cz,x1,y,z0+mid,B.AIR);setWorld(a,cx,cz,x0+mid,y,z0,B.AIR);setWorld(a,cx,cz,x0+mid,y,z1,B.AIR)}
  boxFill(a,cx,cz,x0-1,y1+1,z0-1,x1+1,y1+1,z1+1,B.PURPUR);
  for(let x=x0;x<=x1;x++){setWorld(a,cx,cz,x,y1+2,z0,B.PURPUR_PILLAR);setWorld(a,cx,cz,x,y1+2,z1,B.PURPUR_PILLAR)}
  for(let z=z0;z<=z1;z++){setWorld(a,cx,cz,x0,y1+2,z,B.PURPUR_PILLAR);setWorld(a,cx,cz,x1,y1+2,z,B.PURPUR_PILLAR)}
}
function bridge(a,cx,cz,x0,z0,x1,z1,y){
  const dx=Math.sign(x1-x0),dz=Math.sign(z1-z0),steps=Math.max(Math.abs(x1-x0),Math.abs(z1-z0));
  for(let i=0;i<=steps;i++){const x=x0+dx*i,z=z0+dz*i;for(let s=-1;s<=1;s++){const wx=x+(dz?s:0),wz=z+(dx?s:0);setWorld(a,cx,cz,wx,y,wz,s===0?B.END_STONE_BRICKS:B.PURPUR)}setWorld(a,cx,cz,x+(dz?2:0),y+1,z+(dx?2:0),B.PURPUR_PILLAR);setWorld(a,cx,cz,x-(dz?2:0),y+1,z-(dx?2:0),B.PURPUR_PILLAR)}
}
function ship(a,cx,cz,sx,sy,sz){
  // Long keel and tapered hull along X.
  for(let dx=-12;dx<=12;dx++){
    const width=Math.max(1,Math.floor(4-Math.abs(dx)/4));
    for(let dz=-width;dz<=width;dz++){
      setWorld(a,cx,cz,sx+dx,sy,sz+dz,B.PURPUR);
      if(Math.abs(dz)===width)setWorld(a,cx,cz,sx+dx,sy+1,sz+dz,B.PURPUR_PILLAR);
      if(width>=2&&Math.abs(dz)<=width-1)setWorld(a,cx,cz,sx+dx,sy+1,sz+dz,B.END_STONE_BRICKS);
    }
    if(Math.abs(dx)<10)setWorld(a,cx,cz,sx+dx,sy-1,sz,B.PURPUR_PILLAR);
  }
  // Raised stern cabin.
  boxFill(a,cx,cz,sx+4,sy+2,sz-3,sx+10,sy+5,sz+3,B.PURPUR);
  boxFill(a,cx,cz,sx+5,sy+3,sz-2,sx+9,sy+4,sz+2,B.AIR);
  boxFill(a,cx,cz,sx+3,sy+6,sz-4,sx+11,sy+6,sz+4,B.PURPUR);
  // Mast and crow's nest.
  boxFill(a,cx,cz,sx,sy+2,sz,sx,sy+9,sz,B.PURPUR_PILLAR);
  boxFill(a,cx,cz,sx-2,sy+8,sz-2,sx+2,sy+8,sz+2,B.PURPUR);
  // Dragon-head prow silhouette.
  for(let i=0;i<5;i++)setWorld(a,cx,cz,sx-13-i,sy+2+Math.floor(i/2),sz,B.PURPUR_PILLAR);
  boxFill(a,cx,cz,sx-18,sy+4,sz-1,sx-16,sy+6,sz+1,B.PURPUR);
  setWorld(a,cx,cz,sx-18,sy+5,sz-2,B.PURPUR_PILLAR);setWorld(a,cx,cz,sx-18,sy+5,sz+2,B.PURPUR_PILLAR);
}
function cityForRegion(world,rx,rz){const pickX=2+Math.floor(V.Noise.hash3(rx,13,rz,world.seed+20111)*7),pickZ=2+Math.floor(V.Noise.hash3(rx,19,rz,world.seed+20117)*7);const ccx=rx*12+pickX,ccz=rz*12+pickZ;return{ccx,ccz,x:ccx*CS+8,z:ccz*CS+8}}
function chest(world,x,y,z,items,tag){const key=V.blockKey(x,y,z);if(!world.blockEntities[key]||world.blockEntities[key].endCityLegacy)world.blockEntities[key]={type:'chest',slots:Array.from({length:27},(_,i)=>items[i]?V.makeStack(items[i][0],items[i][1],items[i][2]):null),[tag]:true}}
function marker(world,x,y,z,id){const key=V.blockKey(x,y,z);if(!world.blockEntities[key])world.blockEntities[key]={type:'shulker_marker',spawned:false,x:x+.5,y,z:z+.5,markerId:id}}
function buildModernCity(world,a,cx,cz,c){
  const x=c.x,z=c.z,y=42;
  // Clear the old compact tower blocks in its original centre chunk.
  if(cx===c.ccx&&cz===c.ccz){for(let yy=42;yy<70;yy++)for(let lz=0;lz<CS;lz++)for(let lx=0;lx<CS;lx++){const id=a[li(lx,yy,lz)];if(id===B.PURPUR||id===B.END_STONE_BRICKS||id===B.CHEST)a[li(lx,yy,lz)]=B.AIR}for(const [k,e] of Object.entries(world.blockEntities))if(e&&(e.endCity||e.endShip||e.endCityLegacy||e.type==='shulker_marker')&&Math.floor((e.x||Number(k.split(',')[0]))/CS)===cx&&Math.floor((e.z||Number(k.split(',')[2]))/CS)===cz)delete world.blockEntities[k]}
  hollowTower(a,cx,cz,x-6,z-6,13,y,y+19);
  hollowTower(a,cx,cz,x+17,z-4,9,y+5,y+20);
  hollowTower(a,cx,cz,x-4,z+17,9,y+8,y+23);
  bridge(a,cx,cz,x+6,z,x+17,z,y+10);bridge(a,cx,cz,x,z+6,x,z+17,y+13);
  const shipX=x+34,shipZ=z-18,shipY=54;ship(a,cx,cz,shipX,shipY,shipZ);
  // Chests and Shulker positions only belong to the chunk that contains them.
  const chests=[
    [x,y+1,z,[['diamond',4],['ender_pearl',5],['gold_ingot',8]],'endCity'],
    [x+20,y+7,z,[['shulker_shell',2],['emerald',5],['diamond_helmet',1]],'endCity'],
    [shipX+7,shipY+3,shipZ,[['elytra',1],['firework_rocket',24],['diamond',4]],'endShip']
  ];
  for(const q of chests){if(V.floorDiv(q[0],CS)===cx&&V.floorDiv(q[2],CS)===cz){setWorld(a,cx,cz,q[0],q[1],q[2],B.CHEST);chest(world,q[0],q[1],q[2],q[3],q[4])}}
  const marks=[[x-5,y+5,z-5],[x+5,y+10,z+5],[x+20,y+10,z-3],[x,y+15,z+21],[shipX-4,shipY+2,shipZ+3],[shipX+8,shipY+4,shipZ-3]];
  marks.forEach((q,i)=>{const mx=q[0],my=q[1],mz=q[2];if(V.floorDiv(mx,CS)===cx&&V.floorDiv(mz,CS)===cz)marker(world,mx,my,mz,`${c.ccx},${c.ccz}:${i}`)});
}
WP.generateStarChunk=function(cx,cz){
  const a=oldStar.call(this,cx,cz);if(!a)return a;
  const baseRx=Math.floor(cx/12),baseRz=Math.floor(cz/12);
  for(let rz=baseRz-1;rz<=baseRz+1;rz++)for(let rx=baseRx-1;rx<=baseRx+1;rx++){const c=cityForRegion(this,rx,rz);if(Math.hypot(c.ccx,c.ccz)<8)continue;if(Math.abs(cx-c.ccx)<=4&&Math.abs(cz-c.ccz)<=4)buildModernCity(this,a,cx,cz,c)}
  a.__v220EndCity=true;return a;
};

/* -------------------------------------------------------------------------
   Visible Shulkers and visible homing bullets. Only bullet impact levitates.
------------------------------------------------------------------------- */
function dispose(root){if(!root)return;root.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)if(m&&m.dispose)m.dispose()}})}
function cube(parent,w,h,d,x,y,z,color,emissive=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color,emissive}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function makeShulkerModel(){const g=new THREE.Group();g.name='Shulker';const base=cube(g,.94,.42,.94,0,.22,0,0x6f427b),lid=cube(g,.98,.40,.98,0,.78,0,0xa76bb0),head=cube(g,.48,.48,.48,0,.56,0,0xd3a5d8);cube(g,.09,.10,.025,-.13,.60,-.255,0x15101a,0x3a163d);cube(g,.09,.10,.025,.13,.60,-.255,0x15101a,0x3a163d);cube(g,.18,.06,.025,0,.46,-.255,0x4d2a58);g.userData.parts={base,lid,head};g.visible=true;g.frustumCulled=false;return g}
function makeBulletMesh(){const root=new THREE.Group(),outer=new THREE.Mesh(new THREE.BoxGeometry(.34,.34,.34),new THREE.MeshBasicMaterial({color:0xe4b4ff,transparent:true,opacity:.78,toneMapped:false})),core=new THREE.Mesh(new THREE.BoxGeometry(.15,.15,.15),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));outer.rotation.set(.35,.45,.2);root.add(outer,core);root.frustumCulled=false;return root}
function spawnBullet(game,mob){
  game.shulkerBullets=game.shulkerBullets||[];const root=makeBulletMesh();root.position.copy(mob.position).add(new THREE.Vector3(0,.72,0));game.scene.add(root);const dir=game.player.eyePosition().sub(root.position).normalize(),velocity=dir.multiplyScalar(4.2);game.shulkerBullets.push({mesh:root,velocity,life:12,source:mob});if(game.audio)game.audio.play('hostile');if(game.multiplayer&&game.multiplayer.role==='host'&&game.multiplayer.send)game.multiplayer.send({type:'shulker-bullet',x:root.position.x,y:root.position.y,z:root.position.z,vx:velocity.x,vy:velocity.y,vz:velocity.z})
}
function spawnRemoteBullet(game,msg){game.shulkerBullets=game.shulkerBullets||[];const root=makeBulletMesh();root.position.set(Number(msg.x)||0,Number(msg.y)||0,Number(msg.z)||0);game.scene.add(root);game.shulkerBullets.push({mesh:root,velocity:new THREE.Vector3(Number(msg.vx)||0,Number(msg.vy)||0,Number(msg.vz)||0),life:12,visualOnly:true})}
function installShulker(mob){
  if(!mob||mob._v220Shulker)return mob;mob._v220Shulker=true;
  if(mob.mesh&&mob.mesh.parent)mob.mesh.parent.remove(mob.mesh);dispose(mob.mesh);mob.mesh=makeShulkerModel();mob.mesh.userData.entity=mob;mob.manager.group.add(mob.mesh);mob.mesh.position.copy(mob.position);mob.health=mob.maxHealth=30;mob.attackTime=.8;
  mob.update=function(dt){if(this.dead)return;this.age=(this.age||0)+dt;this.hurtTime=Math.max(0,(this.hurtTime||0)-dt);this.attackTime-=dt;const p=this.game.player,d=this.position.distanceTo(p.position),parts=this.mesh.userData.parts,open=d<18?Math.min(1,(18-d)/8):0;if(parts){parts.lid.position.y=.66+open*.34+Math.sin(this.age*2)*.025;parts.head.position.y=.50+open*.16}if(d<18&&this.attackTime<=0&&this.game.world.raycast){const origin=this.position.clone().add(new THREE.Vector3(0,.72,0)),dir=p.eyePosition().sub(origin).normalize(),block=this.game.world.raycast(origin,dir,d);if(!block||block.distance>d-.35){this.attackTime=3.2;spawnBullet(this.game,this)}}this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw||0;this.mesh.visible=true;this.mesh.traverse(o=>{if(o.material&&o.material.emissive)o.material.emissive.setHex(this.hurtTime>0?0x771b32:o.userData.eye?0x3a163d:0)})};
  return mob;
}
const oldSpawn=V.EntityManager.prototype.spawn;
V.EntityManager.prototype.spawn=function(type,x,y,z){const m=oldSpawn.call(this,type,x,y,z);if(m&&m.type==='shulker')installShulker(m);return m};
function removeBullet(game,b){if(b.mesh&&b.mesh.parent)b.mesh.parent.remove(b.mesh);dispose(b.mesh);const i=game.shulkerBullets.indexOf(b);if(i>=0)game.shulkerBullets.splice(i,1)}
function updateBullets(game,dt){if(!game.shulkerBullets||!game.shulkerBullets.length)return;for(const b of [...game.shulkerBullets]){b.life-=dt;if(b.life<=0){removeBullet(game,b);continue}if(b.visualOnly){b.mesh.position.addScaledVector(b.velocity,dt);b.mesh.rotation.x+=dt*4;b.mesh.rotation.y+=dt*5;continue}const target=game.player.eyePosition(),desired=target.clone().sub(b.mesh.position);if(desired.length()>0)desired.normalize();b.velocity.lerp(desired.multiplyScalar(5.6),Math.min(1,dt*2.7));b.mesh.position.addScaledVector(b.velocity,dt);b.mesh.rotation.x+=dt*4;b.mesh.rotation.y+=dt*5;const id=game.world.getBlock(Math.floor(b.mesh.position.x),Math.floor(b.mesh.position.y),Math.floor(b.mesh.position.z));if(id!==B.AIR&&V.Blocks[id]&&V.Blocks[id].solid){removeBullet(game,b);continue}if(b.mesh.position.distanceTo(target)<.62){game.player.damage(4,'was struck by a Shulker bullet');game.player.levitation=Math.max(game.player.levitation||0,8);game.ui.toast('Levitation');removeBullet(game,b)}}}

/* -------------------------------------------------------------------------
   Elytra rockets with lasting, decaying momentum and proper wing geometry.
------------------------------------------------------------------------- */
const GP=V.Game.prototype,oldUse=GP.useOrPlace;
function armourInteractTarget(game){const t=game.world.raycast(game.player.eyePosition(),game.player.viewDirection(),game.mode==='creative'?8:5.2);if(!t)return false;const d=V.Blocks[t.id];return !!(d&&d.interact)}
GP.equipHeldArmour=function(){const inv=this.inventory,stack=inv.selectedStack(),item=stack&&V.Items[stack.key],slot=item&&item.armourSlot;if(!slot)return false;const worn=inv.armor[slot]||null;inv.armor[slot]=stack;inv.slots[inv.selected]=worn;if(this.audio)this.audio.play('equip');if(this.visuals)this.visuals.refreshHeldItem(true);if(this.ui){this.ui.refreshHUD();if(this.state==='inventory')this.ui.renderInventory();this.ui.toast(worn?`${item.name} equipped · ${V.Items[worn.key]?.name||'old item'} moved to hand`:`${item.name} equipped`)}return true};
V.applyElytraRocket=function(game,stack){
  const chest=game.inventory.armor&&game.inventory.armor.chest,elytra=chest&&V.Items[chest.key]&&V.Items[chest.key].elytra;if(!elytra||game.player.grounded||game.player.inWater)return false;
  const direction=game.player.viewDirection().normalize(),p=game.player;p.gliding=true;p.rocketMomentum=Math.min(46,(p.rocketMomentum||0)+25);p.rocketMomentumTime=Math.max(p.rocketMomentumTime||0,4.8);p.velocity.addScaledVector(direction,10.5);p.velocity.y+=Math.max(1.7,direction.y*5.5);p.fallStart=null;
  if(game.visuals)game.visuals.swing('use');if(game.audio)game.audio.play('swing');if(game.mode!=='creative'&&stack){stack.count--;if(stack.count<=0)game.inventory.slots[game.inventory.selected]=null}if(game.ui)game.ui.refreshHUD();return true
};
GP.useOrPlace=function(){
  const stack=this.inventory.selectedStack(),item=stack&&V.Items[stack.key];
  if(item&&item.armourSlot&&!armourInteractTarget(this))return this.equipHeldArmour();
  if(item&&item.rocket&&V.applyElytraRocket(this,stack))return true;
  return oldUse.call(this);
};
V.updateElytraMomentum=function(player,dt){
  if(player.gliding&&player.rocketMomentumTime>0&&player.rocketMomentum>0){const dir=player.viewDirection().normalize(),target=dir.multiplyScalar(player.rocketMomentum);player.velocity.x=V.lerp(player.velocity.x,target.x,Math.min(1,dt*5));player.velocity.y=V.lerp(player.velocity.y,target.y,Math.min(1,dt*4));player.velocity.z=V.lerp(player.velocity.z,target.z,Math.min(1,dt*5));player.rocketMomentum*=Math.exp(-dt*.48);player.rocketMomentumTime=Math.max(0,player.rocketMomentumTime-dt);player.fallStart=null}else{player.rocketMomentum=Math.max(0,(player.rocketMomentum||0)*Math.exp(-dt*1.7));player.rocketMomentumTime=Math.max(0,(player.rocketMomentumTime||0)-dt)}
};
const PP=V.Player.prototype,oldPlayerUpdate=PP.update;
PP.update=function(dt){oldPlayerUpdate.call(this,dt);V.updateElytraMomentum(this,dt)};
function wingMaterial(color){return new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.98})}
function wingPlate(points,depth,color){
  const n=points.length,vertices=[];for(const z of [-depth/2,depth/2])for(const p of points)vertices.push(p[0],p[1],z);
  const indices=[];for(let i=1;i<n-1;i++){indices.push(0,i,i+1,n,n+i+1,n+i)}for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+j,i,n+j,n+i)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);if(g.computeVertexNormals)g.computeVertexNormals();const m=new THREE.Mesh(g,wingMaterial(color));m.castShadow=true;m.receiveShadow=true;return m
}
function createWings(){
  const root=new THREE.Group();root.name='ElytraWings';root.userData.wings=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*.22,1.43,.19);root.add(pivot);
    const upper=wingPlate([[0,0],[.26,-.04],[.48,-.38],[.42,-.78],[.14,-.66],[-.02,-.24]],.075,0x74719b);upper.scale.x=side;upper.position.z=.02;pivot.add(upper);
    const lowerPivot=new THREE.Group();lowerPivot.position.set(side*.15,-.60,.025);pivot.add(lowerPivot);
    const lower=wingPlate([[0,0],[.29,-.08],[.38,-.44],[.18,-.82],[-.02,-.54]],.065,0x4d4e70);lower.scale.x=side;lowerPivot.add(lower);
    const ribMat=new THREE.MeshLambertMaterial({color:0x303147});
    for(const [rx,ry,len,ang] of [[side*.12,-.20,.50,side*.34],[side*.22,-.42,.40,side*.22]]){const rib=new THREE.Mesh(new THREE.BoxGeometry(.035,len,.085),ribMat.clone());rib.position.set(rx,ry,-.03);rib.rotation.z=ang;pivot.add(rib)}
    pivot.userData={upper,lower,lowerPivot,side};root.userData.wings.push(pivot)
  }
  root.visible=false;return root
}
function ensureWings(model,inventory){
  if(!model||!model.userData)return null;let wings=model.userData.elytraWings;if(!wings){wings=createWings();model.add(wings);model.userData.elytraWings=wings}
  const chest=inventory&&inventory.armor&&inventory.armor.chest,isElytra=!!(chest&&V.Items[chest.key]&&V.Items[chest.key].elytra);wings.visible=isElytra;
  if(model.userData.armor&&model.userData.armor.chest)model.userData.armor.chest.visible=!!(chest&&!isElytra);return wings
}
function animateWings(model,inventory,player){
  const wings=ensureWings(model,inventory);if(!wings||!wings.visible)return;const glide=!!(player&&player.gliding),boost=!!(player&&player.rocketMomentumTime>0),flap=Math.sin(performance.now()*.006)*.035;
  for(const pivot of wings.userData.wings){const side=pivot.userData.side;pivot.rotation.x=glide?(boost?-.36:-.14):.18;pivot.rotation.y=side*(glide?(boost?1.22:.96):.30);pivot.rotation.z=side*(glide?(.08+flap):.50);pivot.userData.lowerPivot.rotation.x=glide?-.10:.18;pivot.userData.lowerPivot.rotation.z=side*(glide?.08:.20)}
}
const oldBuildPlayerModel=V.buildPlayerModel;V.buildPlayerModel=function(settings,inventory,view){const model=oldBuildPlayerModel(settings,inventory,view);ensureWings(model,inventory);return model};
const oldUpdateEquipment=V.updatePlayerEquipment;V.updatePlayerEquipment=function(model,inventory){oldUpdateEquipment(model,inventory);ensureWings(model,inventory)};
const PVP=V.PlayerVisuals.prototype,oldVisualRefresh=PVP.refreshHeldItem,oldVisualUpdate=PVP.update;
PVP.refreshHeldItem=function(force){const r=oldVisualRefresh.call(this,force);ensureWings(this.thirdPerson,this.game.inventory);return r};
PVP.update=function(dt){oldVisualUpdate.call(this,dt);if(this.fpArm)this.fpArm.visible=!this.mainKey;if(this.fpArmOuter)this.fpArmOuter.visible=!this.mainKey;if(this.fpOffArm)this.fpOffArm.visible=!this.offKey;if(this.fpOffArmOuter)this.fpOffArmOuter.visible=!this.offKey;animateWings(this.thirdPerson,this.game.inventory,this.game.player)};

/* -------------------------------------------------------------------------
   Pick Block, /kill selectors, HUD mode presentation and bullet ticking.
------------------------------------------------------------------------- */
function pickKeyForBlock(id,def){if(id===B.WATER)return'water_bucket';if(id===B.LAVA)return'lava_bucket';if(id===B.FIRE)return'flint_and_steel';if(id===B.END_CRYSTAL)return'end_crystal';return def&&def.key}
GP.pickBlock=function(){
  const hit=this.world.raycast(this.player.eyePosition(),this.player.viewDirection(),this.mode==='creative'?8:5.2)||this.target;if(!hit)return false;const def=V.Blocks[hit.id];if(!def)return false;let key=pickKeyForBlock(hit.id,def);
  if(this.mode==='creative'&&!V.Items[key]){V.Items[key]={key,name:def.name,maxStack:def.maxStack||64,category:'blocks',icon:def.textures&&def.textures[2]||def.key,blockId:def.id,creativeOnly:true};V.iconCache={}}
  if(!V.Items[key]){this.ui.toast('That block has no obtainable item.');return false}
  let slot=this.inventory.slots.findIndex((s,i)=>i<9&&s&&s.key===key);
  if(this.mode!=='creative'){
    if(slot<0){const found=this.inventory.slots.findIndex((s,i)=>i>=9&&s&&s.key===key);if(found>=0){slot=this.inventory.selected;const old=this.inventory.slots[slot];this.inventory.slots[slot]=this.inventory.slots[found];this.inventory.slots[found]=old}}
    if(slot<0){this.ui.toast(`${V.Items[key].name} is not in your inventory.`);return false}
  }else if(slot<0){slot=this.inventory.selected;this.inventory.slots[slot]=V.makeStack(key,V.Items[key].maxStack||64)}
  this.inventory.setSelected(slot);this.visuals.refreshHeldItem(true);this.ui.refreshHUD();this.ui.selectedName();return true;
};
function normaliseEntityType(type){return String(type||'').toLowerCase().replace(/^minecraft:/,'').replace(/-/g,'_')}
function parseSelector(text){const s=String(text||'@s').trim();if(s==='@s'||s==='@p')return{self:true};if(!s.startsWith('@e'))return{type:normaliseEntityType(s)};const out={all:true};const m=s.match(/^@e\[(.*)\]$/);if(m)for(const part of m[1].split(',')){const [k,v]=part.split('=').map(x=>x.trim());if(k==='type')out.type=normaliseEntityType(v);if(k==='distance')out.distance=v}return out}
function selectorDistanceOk(mob,game,rule){if(!rule)return true;const d=mob.position.distanceTo(game.player.position);if(rule.startsWith('..'))return d<=Number(rule.slice(2));if(rule.endsWith('..'))return d>=Number(rule.slice(0,-2));const [a,b]=rule.split('..').map(Number);if(Number.isFinite(a)&&Number.isFinite(b))return d>=a&&d<=b;return d===Number(rule)}
const oldChat=GP.handleChat;
GP.handleChat=function(text){
  if(text&&text[0]==='/'){const parts=text.slice(1).trim().split(/\s+/),cmd=(parts.shift()||'').toLowerCase();if(cmd==='kill'){
    const sel=parseSelector(parts[0]);if(sel.self){this.player.health=0;if(typeof this.player.die==='function')this.player.die('used /kill');else this.player.dead=true;return}
    let count=0;for(const mob of [...this.entities.mobs]){if(mob.dead)continue;if(sel.type&&sel.type!=='*'&&mob.type!==sel.type)continue;if(!selectorDistanceOk(mob,this,sel.distance))continue;count++;if(mob.die)mob.die();else mob.takeDamage((mob.maxHealth||100)+999,new THREE.Vector3())}
    if((!sel.type||sel.type==='shulker_bullet')&&this.shulkerBullets)for(const b of [...this.shulkerBullets]){removeBullet(this,b);count++}
    this.ui.chat(count?`Killed ${count} entit${count===1?'y':'ies'}.`:'No matching entities found.');return;
  }if(cmd==='help'){this.ui.chat('Commands include /kill @e[type=shulker], /tp, /home, /sethome and /gamerule.');return}}
  return oldChat.call(this,text);
};
const oldFixed=GP.fixedUpdate;GP.fixedUpdate=function(dt){const r=oldFixed.call(this,dt);updateBullets(this,dt);return r};
const UIP=V.UI.prototype,oldHUD=UIP.refreshHUD,oldInventoryRender=UIP.renderInventory,oldSkinPreview=UIP.renderSkinPreview;
UIP.refreshHUD=function(){oldHUD.call(this);const g=this.app.game;if(!g)return;const status=this.q('#statusBars'),health=this.q('#healthBar');if(status)status.classList.toggle('creative-hidden',g.mode==='creative');if(health)health.classList.toggle('hardcore',g.mode==='hardcore')};
UIP.renderInventory=function(){oldInventoryRender.call(this);if(this.inventoryAvatar&&this.inventoryAvatar.model)ensureWings(this.inventoryAvatar.model,this.app.game&&this.app.game.inventory,null)};
UIP.renderSkinPreview=function(){oldSkinPreview.call(this);if(this.skinAvatar&&this.skinAvatar.model)ensureWings(this.skinAvatar.model,this.app.game&&this.app.game.inventory,null)};

if(V.MultiplayerSession){const MP=V.MultiplayerSession.prototype,oldSend=MP.send,oldReceive=MP.receive,oldRemote=MP.updateRemote;MP.send=function(message){if(message&&message.type==='state'&&this.game){message.gliding=!!this.game.player.gliding;message.rocketBoost=!!(this.game.player.rocketMomentumTime>0)}return oldSend.call(this,message)};MP.receive=function(raw){let msg=null;try{msg=typeof raw==='string'?JSON.parse(raw):raw}catch(e){}if(msg&&msg.type==='shulker-bullet'&&this.role==='guest'&&this.game){spawnRemoteBullet(this.game,msg);return}return oldReceive.call(this,raw)};MP.updateRemote=function(dt){const r=oldRemote.call(this,dt);if(this.remoteModel&&this.remoteState)animateWings(this.remoteModel,this.remoteInventory,{gliding:!!this.remoteState.gliding,rocketMomentumTime:this.remoteState.rocketBoost?1:0});return r}}

V.spawnShulkerBullet=spawnBullet;V.updateShulkerBullets=updateBullets;V.ensureElytraWings=ensureWings;V.animateElytraWings=animateWings;

})();
