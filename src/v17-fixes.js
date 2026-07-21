(function(){
'use strict';
const V=window.Voidlands,B=V.B,CS=V.CHUNK_SIZE,H=V.WORLD_HEIGHT;
V.VERSION='1.7.0';
V.DEFAULT_SETTINGS.keybinds.offhand=V.DEFAULT_SETTINGS.keybinds.offhand||'KeyF';
V.KEY_NAMES.KeyF='F';

/* -------------------------------------------------------------------------
   Netherite progression
------------------------------------------------------------------------- */
function addItem(key,name,opts={}){V.Items[key]=Object.assign({key,name,maxStack:64,category:'materials',icon:key},opts);return V.Items[key]}
function addRecipe(recipe){if(!V.Recipes.some(r=>r.out[0]===recipe.out[0]&&JSON.stringify(r.shape||r.in)===JSON.stringify(recipe.shape||recipe.in)))V.Recipes.push(recipe)}
B.ANCIENT_DEBRIS=55;
V.Blocks[B.ANCIENT_DEBRIS]={id:B.ANCIENT_DEBRIS,key:'ancient_debris',name:'Ancient Debris',solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:8,tool:'pickaxe',requiresTool:true,minTier:4,drop:'ancient_debris',maxStack:64,sound:'stone',textures:['bedrock','bedrock','bedrock','bedrock','bedrock','bedrock'],placeable:true};
V.BlockByKey.ancient_debris=V.Blocks[B.ANCIENT_DEBRIS];
addItem('ancient_debris','Ancient Debris',{category:'blocks',blockId:B.ANCIENT_DEBRIS,icon:'bedrock'});
addItem('netherite_scrap','Netherite Scrap');
addItem('netherite_ingot','Netherite Ingot');
const gear={
 netherite_pickaxe:{name:'Netherite Pickaxe',category:'tools',tool:'pickaxe',tier:5,speed:10,durability:2031,maxStack:1,damage:6},
 netherite_axe:{name:'Netherite Axe',category:'tools',tool:'axe',tier:5,speed:10,durability:2031,maxStack:1,damage:10},
 netherite_shovel:{name:'Netherite Shovel',category:'tools',tool:'shovel',tier:5,speed:10,durability:2031,maxStack:1,damage:6},
 netherite_sword:{name:'Netherite Sword',category:'combat',tool:'sword',tier:5,speed:1,durability:2031,maxStack:1,damage:12},
 netherite_helmet:{name:'Netherite Helmet',category:'combat',armourSlot:'head',armour:3,durability:407,maxStack:1},
 netherite_chestplate:{name:'Netherite Chestplate',category:'combat',armourSlot:'chest',armour:8,durability:592,maxStack:1},
 netherite_leggings:{name:'Netherite Leggings',category:'combat',armourSlot:'legs',armour:6,durability:555,maxStack:1},
 netherite_boots:{name:'Netherite Boots',category:'combat',armourSlot:'feet',armour:3,durability:481,maxStack:1}
};
for(const [key,def] of Object.entries(gear))addItem(key,def.name,def);
V.Smelts.ancient_debris=['netherite_scrap',1];
addRecipe({type:'shapeless',in:{netherite_scrap:4,gold_ingot:4},out:['netherite_ingot',1]});
for(const suffix of ['pickaxe','axe','shovel','sword','helmet','chestplate','leggings','boots'])addRecipe({type:'shapeless',in:{['diamond_'+suffix]:1,netherite_ingot:1},out:['netherite_'+suffix,1]});
// Keep the shield recipe identical to the familiar six-plank and one-iron layout.
V.Recipes.splice(0,V.Recipes.length,...V.Recipes.filter(r=>r.out[0]!=='shield'));
addRecipe({type:'shaped',shape:['PIP','PPP',' P '],map:{P:'planks',I:'iron_ingot'},out:['shield',1]});

const oldItemCanvas=V.createItemCanvas;
V.createItemCanvas=function(key,size=64){
  if(!String(key).startsWith('netherite_')&&key!=='netherite_scrap'&&key!=='netherite_ingot'&&key!=='ancient_debris')return oldItemCanvas.call(this,key,size);
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{alpha:true}),r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)},line=(x0,y0,x1,y1,col,w=1)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(x0+.5,y0+.5);x.lineTo(x1+.5,y1+.5);x.stroke()};
  const dark='#17191d',mid='#303239',light='#56515c',purple='#73556f',shine='#8b748c',wood='#714b2c';
  if(key==='ancient_debris'){r(1,1,14,14,'#3a2925');for(const p of [[2,2],[9,1],[5,6],[11,8],[2,11],[8,13]]){r(p[0],p[1],4,2,'#6b4336');r(p[0]+1,p[1],2,1,'#a16b4c')}}
  else if(key==='netherite_scrap'){r(3,5,10,7,dark);r(4,4,8,7,mid);r(5,5,6,3,purple);r(6,5,3,1,shine)}
  else if(key==='netherite_ingot'){r(2,5,12,7,dark);r(3,4,10,7,mid);r(4,5,8,3,light);r(5,5,4,1,shine);r(10,8,2,2,purple)}
  else if(/_(helmet|chestplate|leggings|boots)$/.test(key)){const type=key.split('_').pop();if(type==='helmet'){r(3,3,10,8,dark);r(4,2,8,7,mid);r(5,3,6,3,light);r(4,9,3,3,purple);r(9,9,3,3,purple)}if(type==='chestplate'){r(2,3,4,4,mid);r(10,3,4,4,mid);r(4,4,8,10,dark);r(5,4,6,8,mid);r(6,5,4,2,light)}if(type==='leggings'){r(4,2,8,6,mid);r(4,7,4,7,dark);r(8,7,4,7,dark);r(5,3,6,2,light)}if(type==='boots'){r(3,5,4,8,mid);r(9,5,4,8,mid);r(2,11,6,3,dark);r(8,11,6,3,dark)}}
  else{line(4,14,11,6,wood,3);line(5,13,12,5,'#a87945',1);if(key.endsWith('pickaxe')){line(3,4,13,4,dark,4);line(4,3,12,3,mid,2);line(6,3,10,3,light,1)}else if(key.endsWith('axe')){r(7,2,7,7,dark);r(7,2,5,6,mid);r(8,2,3,2,light)}else if(key.endsWith('shovel')){r(7,1,6,7,dark);r(8,1,4,6,mid);r(9,1,2,2,light)}else{line(4,12,13,2,dark,4);line(5,11,12,2,mid,2);line(6,10,11,2,light,1);line(3,10,8,14,purple,2)}}
  const out=document.createElement('canvas');out.width=out.height=size;const o=out.getContext('2d',{alpha:true});o.imageSmoothingEnabled=false;o.drawImage(c,0,0,16,16,0,0,size,size);return out;
};
V.iconCache={};

const WP=V.World.prototype;
const previousNether=WP.generateEmberChunk;
WP.generateEmberChunk=function(cx,cz){const existed=this.chunkData.has(V.chunkKey(cx,cz)),a=previousNether.call(this,cx,cz);if(!existed){for(let z=0;z<CS;z++)for(let x=0;x<CS;x++)for(let y=7;y<=24;y++){const i=y*CS*CS+z*CS+x;if(a[i]===B.EMBERSTONE&&V.Noise.hash3(cx*CS+x,y,cz*CS+z,this.seed+99173)>.9972)a[i]=B.ANCIENT_DEBRIS}}return a};

/* -------------------------------------------------------------------------
   Stable fluids and water/lava conversion
------------------------------------------------------------------------- */
const priorSetBlock=WP.setBlock;
function fluidMeta(world,x,y,z){return world.blockEntities[V.blockKey(x,y,z)]}
function isFluid(id){return id===B.WATER||id===B.LAVA}
function isReplaceable(world,x,y,z){const id=world.getBlock(x,y,z);return id===B.AIR||id===B.TALL_GRASS||id===B.RED_FLOWER||id===B.GOLD_FLOWER}
function rawWrite(world,x,y,z,id,meta=null){const ok=priorSetBlock.call(world,x,y,z,id,false);const key=V.blockKey(x,y,z);if(meta)world.blockEntities[key]=meta;else if(!isFluid(id))delete world.blockEntities[key];world.queueFluid(x,y,z);return ok}
function solidify(world,x,y,z,id){rawWrite(world,x,y,z,id,null);if(world.game&&world.game.audio)world.game.audio.play('splash');}
function convertTouching(world,x,y,z,id){
  if(!isFluid(id))return false;
  const own=fluidMeta(world,x,y,z),ownSource=!own||own.source;
  for(const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
    const nx=x+dx,ny=y+dy,nz=z+dz,other=world.getBlock(nx,ny,nz);
    if(id===B.WATER&&other===B.LAVA){const m=fluidMeta(world,nx,ny,nz),source=!m||m.source;solidify(world,nx,ny,nz,source?B.OBSIDIAN:B.COBBLE);return true}
    if(id===B.LAVA&&other===B.WATER){solidify(world,x,y,z,ownSource?B.OBSIDIAN:B.COBBLE);return true}
  }
  return false;
}
WP.setBlock=function(x,y,z,id,playerChange=true){const ok=priorSetBlock.call(this,x,y,z,id,playerChange);if(ok&&isFluid(id))convertTouching(this,Math.floor(x),Math.floor(y),Math.floor(z),id);return ok};
WP.tickFluids=function(dt){
  this.fluidTimer=(this.fluidTimer||0)-dt;if(this.fluidTimer>0)return;this.fluidTimer=.16;this.fluidQueue=this.fluidQueue||new Set();let processed=0;
  for(const key of [...this.fluidQueue]){
    this.fluidQueue.delete(key);if(processed++>=96)break;
    const [x,y,z]=key.split(',').map(Number),id=this.getBlock(x,y,z);if(!isFluid(id))continue;
    if(convertTouching(this,x,y,z,id))continue;
    const meta=fluidMeta(this,x,y,z),source=!meta||meta.source,level=source?0:V.clamp(meta.level==null?1:meta.level,1,7),step=id===B.LAVA?2:1;
    const put=(nx,ny,nz,nextLevel,falling=false)=>{
      const current=this.getBlock(nx,ny,nz);
      if(current!==id&&isFluid(current)){
        if(id===B.WATER){const m=fluidMeta(this,nx,ny,nz);solidify(this,nx,ny,nz,!m||m.source?B.OBSIDIAN:B.COBBLE)}else solidify(this,nx,ny,nz,source?B.OBSIDIAN:B.COBBLE);
        return true;
      }
      if(current===id){const cm=fluidMeta(this,nx,ny,nz);if(!cm||cm.source||((cm.level||7)<=nextLevel&&!falling))return false}
      else if(!isReplaceable(this,nx,ny,nz))return false;
      rawWrite(this,nx,ny,nz,id,{type:'fluid',fluid:id===B.WATER?'water':'lava',source:false,level:V.clamp(nextLevel,1,7),falling:!!falling});return true;
    };
    const below=this.getBlock(x,y-1,z);
    let flowedDown=false;
    if(y>1&&(isReplaceable(this,x,y-1,z)||below===id||isFluid(below)&&below!==id))flowedDown=put(x,y-1,z,Math.min(7,level+step),true);
    if(!flowedDown&&level<7){for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])put(x+dx,y,z+dz,Math.min(7,level+step),false)}
    if(!source){
      let desired=99,falling=false;
      if(this.getBlock(x,y+1,z)===id){desired=1;falling=true}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(this.getBlock(x+dx,y,z+dz)===id){const nm=fluidMeta(this,x+dx,y,z+dz),nl=!nm||nm.source?0:(nm.level||7);desired=Math.min(desired,nl+step)}
      if(desired>7){rawWrite(this,x,y,z,B.AIR,null)}else if(desired!==level||!!meta.falling!==falling){this.blockEntities[V.blockKey(x,y,z)]={type:'fluid',fluid:id===B.WATER?'water':'lava',source:false,level:V.clamp(desired,1,7),falling}}
    }
  }
};

/* -------------------------------------------------------------------------
   Correct 64x64/64x32 skin pipeline and reusable player model
------------------------------------------------------------------------- */
const CLASSIC={
 head:[[0,8,8,8],[16,8,8,8],[8,0,8,8],[16,0,8,8],[8,8,8,8],[24,8,8,8]],head2:[[32,8,8,8],[48,8,8,8],[40,0,8,8],[48,0,8,8],[40,8,8,8],[56,8,8,8]],
 body:[[16,20,4,12],[28,20,4,12],[20,16,8,4],[28,16,8,4],[20,20,8,12],[32,20,8,12]],body2:[[16,36,4,12],[28,36,4,12],[20,32,8,4],[28,32,8,4],[20,36,8,12],[32,36,8,12]],
 rightArm:[[40,20,4,12],[48,20,4,12],[44,16,4,4],[48,16,4,4],[44,20,4,12],[52,20,4,12]],rightArm2:[[40,36,4,12],[48,36,4,12],[44,32,4,4],[48,32,4,4],[44,36,4,12],[52,36,4,12]],
 leftArm:[[32,52,4,12],[40,52,4,12],[36,48,4,4],[40,48,4,4],[36,52,4,12],[44,52,4,12]],leftArm2:[[48,52,4,12],[56,52,4,12],[52,48,4,4],[56,48,4,4],[52,52,4,12],[60,52,4,12]],
 rightLeg:[[0,20,4,12],[8,20,4,12],[4,16,4,4],[8,16,4,4],[4,20,4,12],[12,20,4,12]],rightLeg2:[[0,36,4,12],[8,36,4,12],[4,32,4,4],[8,32,4,4],[4,36,4,12],[12,36,4,12]],
 leftLeg:[[16,52,4,12],[24,52,4,12],[20,48,4,4],[24,48,4,4],[20,52,4,12],[28,52,4,12]],leftLeg2:[[0,52,4,12],[8,52,4,12],[4,48,4,4],[8,48,4,4],[4,52,4,12],[12,52,4,12]]
};
function slimRegions(){const r=V.deepClone(CLASSIC);r.rightArm=[[40,20,4,12],[47,20,4,12],[44,16,3,4],[47,16,3,4],[44,20,3,12],[51,20,3,12]];r.rightArm2=[[40,36,4,12],[47,36,4,12],[44,32,3,4],[47,32,3,4],[44,36,3,12],[51,36,3,12]];r.leftArm=[[32,52,4,12],[39,52,4,12],[36,48,3,4],[39,48,3,4],[36,52,3,12],[43,52,3,12]];r.leftArm2=[[48,52,4,12],[55,52,4,12],[52,48,3,4],[55,48,3,4],[52,52,3,12],[59,52,3,12]];return r}
const SLIM=slimRegions();
function setUV(geo,regions){const uv=geo.attributes&&geo.attributes.uv;if(!uv||!uv.array)return;for(let face=0;face<6;face++){const q=regions[face],u0=q[0]/64,u1=(q[0]+q[2])/64,v0=1-(q[1]+q[3])/64,v1=1-q[1]/64,off=face*8;uv.array[off]=u0;uv.array[off+1]=v1;uv.array[off+2]=u1;uv.array[off+3]=v1;uv.array[off+4]=u0;uv.array[off+5]=v0;uv.array[off+6]=u1;uv.array[off+7]=v0}uv.needsUpdate=true}
let defaultSkinData=null;
function makeDefaultSkin(){if(defaultSkinData)return defaultSkinData;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d',{alpha:true}),f=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};f(0,0,64,64,'rgba(0,0,0,0)');f(8,8,8,8,'#d49b78');f(0,8,8,8,'#bd7f61');f(16,8,8,8,'#e4b08c');f(24,8,8,8,'#a96e54');f(8,0,8,8,'#56392d');f(20,20,8,12,'#315873');f(16,20,4,12,'#244256');f(28,20,4,12,'#3f6e8d');f(32,20,8,12,'#1d3444');f(44,20,4,12,'#315d7c');f(40,20,4,12,'#24465f');f(48,20,4,12,'#3e7192');f(52,20,4,12,'#1e394d');f(36,52,4,12,'#315d7c');f(32,52,4,12,'#24465f');f(40,52,4,12,'#3e7192');f(44,52,4,12,'#1e394d');f(4,20,4,12,'#263240');f(0,20,4,12,'#1a232e');f(8,20,4,12,'#354555');f(12,20,4,12,'#1e2833');f(20,52,4,12,'#263240');f(16,52,4,12,'#1a232e');f(24,52,4,12,'#354555');f(28,52,4,12,'#1e2833');defaultSkinData=c.toDataURL('image/png');return defaultSkinData}
function textureFrom(data){const t=new THREE.TextureLoader().load(data||makeDefaultSkin());t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;if('encoding' in t&&THREE.sRGBEncoding)t.encoding=THREE.sRGBEncoding;return t}
function skinPart(texture,part,w,h,d,model='classic',view=false,overlay=false){const geo=new THREE.BoxGeometry(w,h,d),regions=(model==='slim'?SLIM:CLASSIC)[part+(overlay?'2':'')];setUV(geo,regions);const options={map:texture,transparent:overlay,alphaTest:overlay?.02:0,side:THREE.FrontSide};const mat=view?new THREE.MeshBasicMaterial(Object.assign({toneMapped:false,depthTest:true,depthWrite:true},options)):new THREE.MeshLambertMaterial(options);const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=!view;mesh.receiveShadow=!view;return mesh}
function disposeObject(root){if(!root)return;root.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m&&m.dispose)m.dispose()}})}
function armorColour(stack){if(!stack)return 0xffffff;if(stack.key.startsWith('netherite_'))return 0x302f36;if(stack.key.startsWith('diamond_'))return 0x43d8e8;if(stack.key.startsWith('iron_'))return 0xc7cbd0;return 0x8b5b35}
function shieldModel(first=false){
 const root=new THREE.Group();root.name='ShieldModel';root.userData.isShield=true;
 const scale=first?1:.58,view=!!first;
 const material=(colour)=>view?new THREE.MeshBasicMaterial({color:colour,toneMapped:false,depthTest:true,depthWrite:true}):new THREE.MeshLambertMaterial({color:colour});
 const wood=material(0x8a542e),woodDark=material(0x5a321c),iron=material(0xb9c1c8),ironDark=material(0x69737b);
 const add=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w*scale,h*scale,d*scale),mat);m.position.set(x*scale,y*scale,z*scale);m.castShadow=!view;m.receiveShadow=!view;m.renderOrder=8;root.add(m);return m};
 // Broad upper board, tapered lower board and a short pointed foot create a proper voxel shield silhouette.
 add(.62,.46,.09,0,.13,0,wood);add(.52,.30,.095,0,-.24,0,wood);add(.30,.16,.10,0,-.45,0,woodDark);
 add(.68,.065,.12,0,.37,-.002,iron);add(.06,.70,.12,-.31,.02,-.002,iron);add(.06,.70,.12,.31,.02,-.002,iron);
 add(.48,.055,.115,0,-.39,-.002,ironDark);add(.08,.08,.125,0,.08,-.012,iron);
 // Rear grip is visible in third person and gives the model real thickness.
 add(.08,.34,.12,0,.02,.10,ironDark);add(.28,.06,.13,0,.02,.14,ironDark);
 root.rotation.set(first?-.05:-.18,first?.05:0,first?-.06:.04);return root;
}
function heldMesh(key,first=false){const item=key&&V.Items[key];if(!item)return null;if(item.shield||key==='shield')return shieldModel(first);const isBlock=item.blockId!=null&&V.Blocks[item.blockId]&&!V.Blocks[item.blockId].fluid;let geo,mat;if(isBlock){const def=V.Blocks[item.blockId],size=first?.36:.21;geo=new THREE.BoxGeometry(size,size,size);mat=def.textures.map(n=>new THREE.MeshBasicMaterial({map:V.createTileTexture(n,64),transparent:!!def.transparent,alphaTest:def.cutout?.32:0,side:def.transparent?THREE.DoubleSide:THREE.FrontSide,toneMapped:false}))}else{geo=new THREE.PlaneGeometry(first?.5:.28,first?.5:.28);mat=new THREE.MeshBasicMaterial({map:V.createItemTexture(key,64),transparent:true,alphaTest:.06,side:THREE.DoubleSide,toneMapped:false})}const m=new THREE.Mesh(geo,mat);m.renderOrder=8;if(isBlock)m.rotation.set(.25,.65,.08);else m.rotation.z=-.18;return m}
function buildPlayerModel(settings,inventory,view=false){
 const texture=textureFrom(settings.skinData),model=settings.skinModel==='slim'?'slim':'classic',root=new THREE.Group(),aw=model==='slim'?.18:.22;
 const body=skinPart(texture,'body',.58,.72,.3,model,view);body.position.y=1.05;root.add(body);const body2=skinPart(texture,'body',.595,.735,.315,model,view,true);body2.position.copy(body.position);root.add(body2);
 const head=skinPart(texture,'head',.5,.5,.5,model,view);head.position.y=1.66;root.add(head);const head2=skinPart(texture,'head',.56,.56,.56,model,view,true);head2.position.copy(head.position);root.add(head2);
 const leftArm=skinPart(texture,'leftArm',aw,.7,.22,model,view);leftArm.position.set(-.42,1.09,0);root.add(leftArm);leftArm.add(skinPart(texture,'leftArm',aw+.012,.715,.232,model,view,true));
 const rightArm=skinPart(texture,'rightArm',aw,.7,.22,model,view);rightArm.position.set(.42,1.09,0);root.add(rightArm);rightArm.add(skinPart(texture,'rightArm',aw+.012,.715,.232,model,view,true));
 const leftLeg=skinPart(texture,'leftLeg',.23,.72,.24,model,view);leftLeg.position.set(-.16,.36,0);root.add(leftLeg);leftLeg.add(skinPart(texture,'leftLeg',.242,.735,.252,model,view,true));
 const rightLeg=skinPart(texture,'rightLeg',.23,.72,.24,model,view);rightLeg.position.set(.16,.36,0);root.add(rightLeg);rightLeg.add(skinPart(texture,'rightLeg',.242,.735,.252,model,view,true));
 const rightAnchor=new THREE.Group();rightAnchor.position.set(0,-.51,-.07);rightAnchor.rotation.set(-.38,0,-.12);rightArm.add(rightAnchor);const leftAnchor=new THREE.Group();leftAnchor.position.set(0,-.51,-.07);leftAnchor.rotation.set(-.38,0,.12);leftArm.add(leftAnchor);
 const armourMaterial=()=>new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.96});
 const armourPart=(parent,w,h,d,x=0,y=0,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),armourMaterial());m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 const armor={head:new THREE.Group(),chest:new THREE.Group(),legs:new THREE.Group(),feet:new THREE.Group()};
 // Helmet: crown, brow, cheek guards and rear plate rather than a single cube.
 head.add(armor.head);armourPart(armor.head,.58,.13,.58,0,.235,0);armourPart(armor.head,.60,.10,.12,0,.10,-.285);armourPart(armor.head,.10,.39,.58,-.29,.025,0);armourPart(armor.head,.10,.39,.58,.29,.025,0);armourPart(armor.head,.50,.37,.09,0,.015,.285);
 // Chestplate: shaped torso, lower rim and raised shoulder guards.
 root.add(armor.chest);armourPart(armor.chest,.65,.58,.37,0,1.11,0);armourPart(armor.chest,.58,.13,.39,0,.78,0);armourPart(armor.chest,.28,.17,.34,-.43,1.31,0);armourPart(armor.chest,.28,.17,.34,.43,1.31,0);armourPart(armor.chest,.18,.42,.08,0,1.12,-.22);
 // Leggings: belt, separate thigh plates and knee guards.
 root.add(armor.legs);armourPart(armor.legs,.58,.15,.31,0,.70,0);armourPart(armor.legs,.255,.48,.285,-.16,.43,0);armourPart(armor.legs,.255,.48,.285,.16,.43,0);armourPart(armor.legs,.27,.12,.31,-.16,.20,-.015);armourPart(armor.legs,.27,.12,.31,.16,.20,-.015);
 // Boots: ankle cuffs, solid feet and projecting toes.
 root.add(armor.feet);for(const side of [-1,1]){armourPart(armor.feet,.275,.27,.30,side*.16,.17,0);armourPart(armor.feet,.29,.10,.39,side*.16,.055,-.06);armourPart(armor.feet,.25,.07,.12,side*.16,.25,-.17)}
 root.userData={texture,body,body2,head,head2,leftArm,rightArm,leftLeg,rightLeg,rightAnchor,leftAnchor,armor};
 updatePlayerEquipment(root,inventory);return root;
}
function updatePlayerEquipment(root,inventory){if(!root||!root.userData)return;const u=root.userData,arm=inventory&&inventory.armor||{};for(const [slot,group] of Object.entries(u.armor||{})){const stack=arm[slot];group.visible=!!stack;if(stack)group.traverse(mesh=>{if(mesh.material&&mesh.material.color)mesh.material.color.set(armorColour(stack))})}while(u.rightAnchor.children.length){const c=u.rightAnchor.children[0];u.rightAnchor.remove(c);disposeObject(c)}while(u.leftAnchor.children.length){const c=u.leftAnchor.children[0];u.leftAnchor.remove(c);disposeObject(c)}const main=inventory&&inventory.selectedStack?inventory.selectedStack():null,off=inventory&&inventory.offhand;if(main){const m=heldMesh(main.key,false);if(m)u.rightAnchor.add(m)}if(off){const m=heldMesh(off.key,false);if(m){m.rotation.y=Math.PI;m.scale.x=-1;u.leftAnchor.add(m)}}}
V.buildPlayerModel=buildPlayerModel;V.updatePlayerEquipment=updatePlayerEquipment;V.makeDefaultSkin=makeDefaultSkin;

class FixedPlayerVisuals{
 constructor(game){this.game=game;this.swingTime=0;this.swingLength=.32;this.mainKey=null;this.offKey=null;this.build()}
 build(){this.skin=textureFrom(this.game.settings.skinData);this.createFirstPerson();this.thirdPerson=buildPlayerModel(this.game.settings,this.game.inventory,false);this.game.scene.add(this.thirdPerson);this.refreshHeldItem(true)}
 createFirstPerson(){if(!this.game.viewScene)this.game.viewScene=new THREE.Scene();if(!this.game.viewCamera){this.game.viewCamera=new THREE.PerspectiveCamera(this.game.settings.fov||75,(typeof innerWidth==='number'?innerWidth:1280)/(typeof innerHeight==='number'?innerHeight:720),.01,12);this.game.viewScene.add(this.game.viewCamera)}const model=this.game.settings.skinModel==='slim'?'slim':'classic',aw=model==='slim'?.18:.22;this.firstPerson=new THREE.Group();this.firstPerson.position.set(.48,-.40,-.82);this.game.viewCamera.add(this.firstPerson);this.fpArm=skinPart(this.skin,'rightArm',aw,.72,.22,model,true);this.fpArm.position.set(.04,-.08,.03);this.fpArm.rotation.z=-.12;this.firstPerson.add(this.fpArm);this.fpArmOuter=skinPart(this.skin,'rightArm',aw+.01,.735,.23,model,true,true);this.fpArmOuter.position.copy(this.fpArm.position);this.fpArmOuter.rotation.set(this.fpArm.rotation.x,this.fpArm.rotation.y,this.fpArm.rotation.z);this.firstPerson.add(this.fpArmOuter);this.fpItemAnchor=new THREE.Group();this.fpItemAnchor.position.set(-.04,-.30,-.16);this.fpItemAnchor.rotation.set(-.18,-.18,.08);this.firstPerson.add(this.fpItemAnchor);this.offhandView=new THREE.Group();this.offhandView.position.set(-.58,-.42,-.86);this.offhandView.rotation.y=Math.PI;this.game.viewCamera.add(this.offhandView);this.fpOffArm=skinPart(this.skin,'leftArm',aw,.72,.22,model,true);this.fpOffArm.position.set(0,-.08,.03);this.fpOffArm.rotation.z=.12;this.offhandView.add(this.fpOffArm);this.fpOffArmOuter=skinPart(this.skin,'leftArm',aw+.01,.735,.23,model,true,true);this.fpOffArmOuter.position.copy(this.fpOffArm.position);this.fpOffArmOuter.rotation.set(this.fpOffArm.rotation.x,this.fpOffArm.rotation.y,this.fpOffArm.rotation.z);this.offhandView.add(this.fpOffArmOuter);this.fpOffAnchor=new THREE.Group();this.fpOffAnchor.position.set(.02,-.3,-.16);this.offhandView.add(this.fpOffAnchor);this.firstPerson.traverse(o=>{if(o.material){o.renderOrder=7;o.material.depthTest=true;o.material.depthWrite=true}})}
 clear(anchor){while(anchor.children.length){const c=anchor.children[0];anchor.remove(c);disposeObject(c)}}
 refreshHeldItem(force=false){const main=this.game.inventory.selectedStack(),off=this.game.inventory.offhand,mk=main&&main.key||null,ok=off&&off.key||null;if(!force&&mk===this.mainKey&&ok===this.offKey)return;this.mainKey=mk;this.offKey=ok;this.clear(this.fpItemAnchor);this.clear(this.fpOffAnchor);if(mk){const m=heldMesh(mk,true);if(m)this.fpItemAnchor.add(m)}if(ok){const m=heldMesh(ok,true);if(m){m.scale.x=-1;this.fpOffAnchor.add(m)}}updatePlayerEquipment(this.thirdPerson,this.game.inventory)}
 swing(kind='attack'){this.swingKind=kind;this.swingTime=this.swingLength}
 applySkin(){if(this.firstPerson?.parent)this.firstPerson.parent.remove(this.firstPerson);if(this.offhandView?.parent)this.offhandView.parent.remove(this.offhandView);if(this.thirdPerson?.parent)this.thirdPerson.parent.remove(this.thirdPerson);disposeObject(this.firstPerson);disposeObject(this.offhandView);const tpTex=this.thirdPerson&&this.thirdPerson.userData&&this.thirdPerson.userData.texture;disposeObject(this.thirdPerson);if(tpTex&&tpTex.dispose)tpTex.dispose();if(this.skin&&this.skin.dispose)this.skin.dispose();this.mainKey=this.offKey=null;this.build()}
 update(dt){
  const p=this.game.player;if(!p)return;this.swingTime=Math.max(0,this.swingTime-dt);this.refreshHeldItem();
  const first=p.perspective===0&&!this.game.hudHidden&&!p.dead&&this.game.state!=='destroyed';this.firstPerson.visible=first;this.offhandView.visible=first&&!!this.offKey;this.thirdPerson.visible=p.perspective!==0&&!p.dead;
  const moving=Math.hypot(p.velocity.x,p.velocity.z)>.25&&p.grounded,bob=moving?Math.sin(p.walkDistance*7.5):0,progress=this.swingTime>0?1-this.swingTime/this.swingLength:0,swing=this.swingTime>0?Math.sin(progress*Math.PI):0;
  this.firstPerson.position.set(.48+bob*.018,-.40+Math.abs(bob)*.018,-.82);this.firstPerson.rotation.set(-swing*.72,swing*.18,-swing*.48);
  const shieldRaised=p.blocking&&this.offKey==='shield';this.offhandView.position.set(shieldRaised?-.37:-.58-bob*.014,shieldRaised?-.08:-.42,shieldRaised?-.46:-.86);this.offhandView.rotation.set(shieldRaised?-.08:0,shieldRaised?2.90:Math.PI,shieldRaised?.04:0);
  if(p.eating){const eat=Math.sin(p.eatTime*15)*.08;(p.eatingHand==='offhand'?this.offhandView:this.firstPerson).position.y=-.29+eat}
  const u=this.thirdPerson.userData;this.thirdPerson.position.copy(p.position);this.thirdPerson.rotation.y=p.yaw;u.head.rotation.x=u.head2.rotation.x=-p.pitch;
  const stride=moving?Math.sin(p.walkDistance*5.4)*.72:0;u.leftLeg.rotation.x=stride;u.rightLeg.rotation.x=-stride;u.leftArm.rotation.x=shieldRaised?-1.08:-stride*.75;u.leftArm.rotation.z=shieldRaised?-.28:0;u.rightArm.rotation.x=stride*.75-swing*1.35;
  if(u.leftAnchor){u.leftAnchor.rotation.x=shieldRaised?-.18:-.38;u.leftAnchor.rotation.y=shieldRaised?-.2:0;u.leftAnchor.rotation.z=shieldRaised?.12:.12}
  if(p.sneaking){u.body.rotation.x=u.body2.rotation.x=.22;u.head.position.y=u.head2.position.y=1.58;u.leftArm.position.y=u.rightArm.position.y=1.02}else{u.body.rotation.x=u.body2.rotation.x=0;u.head.position.y=u.head2.position.y=1.66;u.leftArm.position.y=u.rightArm.position.y=1.09}
 }
 dispose(){if(this.firstPerson?.parent)this.firstPerson.parent.remove(this.firstPerson);if(this.offhandView?.parent)this.offhandView.parent.remove(this.offhandView);if(this.thirdPerson?.parent)this.thirdPerson.parent.remove(this.thirdPerson);disposeObject(this.firstPerson);disposeObject(this.offhandView);const tpTex=this.thirdPerson&&this.thirdPerson.userData&&this.thirdPerson.userData.texture;disposeObject(this.thirdPerson);if(tpTex&&tpTex.dispose)tpTex.dispose();if(this.skin&&this.skin.dispose)this.skin.dispose()}
 destroy(){this.dispose()}
}
V.PlayerVisuals=FixedPlayerVisuals;

/* -------------------------------------------------------------------------
   Offhand key, all-item use, ghost-shield fix and offhand eating
------------------------------------------------------------------------- */
const IP=V.Inventory.prototype,oldLoad=IP.load;
IP.load=function(data){oldLoad.call(this,data);if(this.offhand&&!V.Items[this.offhand.key])this.offhand=null};
const PP=V.Player.prototype,oldStartEating=PP.startEating,oldUpdateEating=PP.updateEating,oldStopEating=PP.stopEating;
PP.startEating=function(hand='main'){if(hand!=='offhand')return oldStartEating.call(this);const s=this.game.inventory.offhand,it=s&&V.Items[s.key];if(!it||!it.food||this.hunger>=20)return false;this.eating=true;this.eatingHand='offhand';this.eatTime=0;return true};
PP.stopEating=function(){this.eatingHand=null;return oldStopEating.call(this)};
PP.updateEating=function(dt){if(this.eatingHand!=='offhand')return oldUpdateEating.call(this,dt);const s=this.game.inventory.offhand,it=s&&V.Items[s.key];if(!this.eating||!it||!it.food){this.stopEating();return}this.eatTime+=dt;if(Math.floor(this.eatTime*5)!==Math.floor((this.eatTime-dt)*5))this.game.audio.play('eat');if(this.eatTime>=1.6){this.hunger=Math.min(20,this.hunger+it.food);this.saturation=Math.min(this.hunger,this.saturation+(it.saturation||1));s.count--;if(s.count<=0)this.game.inventory.offhand=null;this.stopEating();this.game.ui.refreshHUD()}};
const GP=V.Game.prototype,oldKeyDown=GP.keyDown,oldKeyUp=GP.keyUp,oldFixed=GP.fixedUpdate,oldClear=GP.clearInput;
GP.useOffhand=function(){const inv=this.inventory,stack=inv.offhand;if(!stack)return false;const item=V.Items[stack.key];if(!item)return false;if(item.shield){this.offhandActive=true;this.player.blocking=true;this.visuals.swing('block');return true}if(item.food){if(this.player.startEating('offhand')){this.offhandActive=true;this.visuals.swing('use');return true}return false}const index=inv.selected,main=inv.slots[index];inv.slots[index]=stack;inv.offhand=main;this._usingOffhand=true;try{this.useOrPlace()}finally{const changed=inv.slots[index];inv.slots[index]=inv.offhand;inv.offhand=changed;this._usingOffhand=false}this.offhandActive=true;this.ui.refreshHUD();return true};
GP.releaseOffhand=function(){this.offhandActive=false;if(this.player&&this.player.eatingHand==='offhand')this.player.stopEating();if(this.player)this.player.blocking=false};
GP.keyDown=function(e){oldKeyDown.call(this,e);if(!e.repeat&&this.state==='playing'&&!this.paused&&this.matchesBinding(e.code,this.settings.keybinds.offhand))this.useOffhand()};
GP.keyUp=function(e){oldKeyUp.call(this,e);if(this.matchesBinding(e.code,this.settings.keybinds.offhand))this.releaseOffhand()};
GP.fixedUpdate=function(dt){oldFixed.call(this,dt);const shield=this.inventory.offhand&&this.inventory.offhand.key==='shield';this.player.blocking=!!(shield&&this.offhandActive)};
GP.clearInput=function(reset){oldClear.call(this,reset);this.releaseOffhand()};

/* -------------------------------------------------------------------------
   Inventory model, recipe scroll retention and skin importer
------------------------------------------------------------------------- */
class AvatarPreview{
 constructor(host,ui){this.host=host;this.ui=ui;this.canvas=document.createElement('canvas');this.canvas.width=180;this.canvas.height=230;this.canvas.className='avatar-preview-canvas';host.replaceChildren(this.canvas);try{this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:false,preserveDrawingBuffer:false});this.renderer.setSize(180,230,false);this.renderer.setPixelRatio(1);this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(32,180/230,.1,20);this.camera.position.set(0,1.05,4.3);this.camera.lookAt(0,.95,0);this.scene.add(new THREE.HemisphereLight(0xffffff,0x33412f,1.45));const light=new THREE.DirectionalLight(0xffffff,1.1);light.position.set(3,5,4);this.scene.add(light);this.rebuild();this.loop()}catch(e){this.renderer=null;this.canvas.classList.add('preview-unavailable')}}
 attach(host){this.host=host;host.replaceChildren(this.canvas)}
 rebuild(){if(!this.scene)return;if(this.model){this.scene.remove(this.model);disposeObject(this.model);if(this.model.userData.texture?.dispose)this.model.userData.texture.dispose()}const inv=this.ui.app.game&&this.ui.app.game.inventory||{armor:{},offhand:null,selectedStack:()=>null};this.model=buildPlayerModel(this.ui.app.settings,inv,false);this.model.position.y=-.05;this.scene.add(this.model);this.signature=this.getSignature()}
 getSignature(){const s=this.ui.app.settings,g=this.ui.app.game,inv=g&&g.inventory;return[s.skinData?s.skinData.length:0,s.skinName,s.skinModel,inv&&inv.selectedStack()?.key,inv&&inv.offhand?.key,...Object.values(inv&&inv.armor||{}).map(x=>x&&x.key)].join('|')}
 loop(){if(!this.renderer)return;requestAnimationFrame(()=>this.loop());if(this.host.isConnected&&this.host.offsetParent!==null){if(this.signature!==this.getSignature())this.rebuild();this.model.rotation.y=.18+Math.sin(performance.now()*.00045)*.18;this.renderer.render(this.scene,this.camera)}}
}
const UIP=V.UI.prototype,oldRenderInventory=UIP.renderInventory,oldRenderControls=UIP.renderControls,oldShowSkin=UIP.showSkinScreen,oldBindUI=UIP.bind;
UIP.renderControls=function(){const labels={forward:'Move Forward',back:'Move Back',left:'Strafe Left',right:'Strafe Right',jump:'Jump / Fly Up',sneak:'Sneak / Fly Down',sprint:'Sprint',offhand:'Use Offhand Item',inventory:'Inventory',drop:'Drop Item',chat:'Chat / Commands',hud:'Toggle HUD',debug:'Debug Overlay',perspective:'Camera Perspective',zoom:'Zoom'};if(this.rebindingHandler){document.removeEventListener('keydown',this.rebindingHandler,true);this.rebindingHandler=null}this.q('#controlsList').innerHTML=Object.entries(labels).map(([k,n])=>`<div class="control-row"><span>${n}</span><button data-bind="${k}">${V.KEY_NAMES[this.app.settings.keybinds[k]]||this.app.settings.keybinds[k]}</button></div>`).join('');this.qa('[data-bind]').forEach(b=>b.onclick=()=>{if(this.rebindingHandler)document.removeEventListener('keydown',this.rebindingHandler,true);b.textContent='Press a key… (Esc to cancel)';const action=b.dataset.bind,h=e=>{e.preventDefault();e.stopPropagation();document.removeEventListener('keydown',h,true);this.rebindingHandler=null;if(e.code==='Escape'){this.renderControls();return}const binds=this.app.settings.keybinds,oldCode=binds[action],newCodes=V.KEY_ALIASES[e.code]||[e.code],conflict=Object.keys(binds).find(key=>key!==action&&(V.KEY_ALIASES[binds[key]]||[binds[key]]).some(code=>newCodes.includes(code)));if(conflict)binds[conflict]=oldCode;binds[action]=e.code;this.app.storage.saveSettings(this.app.settings);if(this.app.game)this.app.game.clearInput(true);this.renderControls();this.toast(conflict?'Controls swapped to avoid a conflict':'Control updated')};this.rebindingHandler=h;document.addEventListener('keydown',h,true)})};
UIP.renderInventory=function(){const win=this.q('.inventory-window'),list=this.q('.recipe-list');if(win)this.inventoryScrollTop=win.scrollTop;if(list)this.recipeScrollTop=list.scrollTop;oldRenderInventory.call(this);const nextWin=this.q('.inventory-window'),nextList=this.q('.recipe-list');if(nextWin&&Number.isFinite(this.inventoryScrollTop))nextWin.scrollTop=this.inventoryScrollTop||0;if(nextList&&Number.isFinite(this.recipeScrollTop))nextList.scrollTop=this.recipeScrollTop||0;const host=this.q('.player-preview');if(host){host.classList.add('model-preview');if(!this.inventoryAvatar)this.inventoryAvatar=new AvatarPreview(host,this);else this.inventoryAvatar.attach(host)}};
function detectSlim(ctx){let transparent=0,total=0;for(let y=20;y<32;y++)for(let x=54;x<56;x++){total++;if(ctx.getImageData(x,y,1,1).data[3]===0)transparent++}return transparent>total*.85}
function normalizeLegacy(img){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d',{alpha:true});x.imageSmoothingEnabled=false;x.clearRect(0,0,64,64);x.drawImage(img,0,0);if(img.height===32){x.save();x.translate(16+16,48);x.scale(-1,1);x.drawImage(img,0,16,16,16,0,0,16,16);x.restore();x.save();x.translate(32+16,48);x.scale(-1,1);x.drawImage(img,40,16,16,16,0,0,16,16);x.restore()}return c}
UIP.importSkin=function(file){if(!file)return;if(file.size>2*1024*1024){this.toast('Skin PNG must be smaller than 2 MB');return}if(file.type&&file.type!=='image/png'&&!/\.png$/i.test(file.name)){this.toast('Skin must be a PNG file');return}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{if(!((img.width===64&&img.height===64)||(img.width===64&&img.height===32))){this.toast('Use a standard 64×64 or legacy 64×32 skin PNG');return}const normalized=normalizeLegacy(img),ctx=normalized.getContext('2d',{alpha:true}),data=normalized.toDataURL('image/png');this.app.settings.skinData=data;this.app.settings.skinName=file.name.replace(/\.png$/i,'')||'Custom Skin';if(img.height===64&&detectSlim(ctx))this.app.settings.skinModel='slim';this.app.storage.saveSettings(this.app.settings);this.q('#skinNameLabel').textContent=this.app.settings.skinName;this.q('#skinModel').value=this.app.settings.skinModel;if(this.app.game&&this.app.game.visuals)this.app.game.visuals.applySkin();this.renderSkinPreview();this.toast(img.height===32?'Legacy skin converted and applied':'Skin applied')};img.onerror=()=>this.toast('The skin image could not be read');img.src=reader.result};reader.onerror=()=>this.toast('The skin file could not be read');reader.readAsDataURL(file)};
UIP.renderSkinPreview=function(){const host=this.q('.skin-preview-bg');if(!host)return;if(!this.skinAvatar)this.skinAvatar=new AvatarPreview(host,this);else{this.skinAvatar.attach(host);this.skinAvatar.rebuild()}};
UIP.showSkinScreen=function(returnScreen){this.returnScreen=returnScreen;const s=this.app.settings;this.q('#skinNameLabel').textContent=s.skinName||'Default Explorer';this.q('#skinModel').value=s.skinModel||'classic';this.q('#skinFile').value='';this.show('skinsScreen');this.renderSkinPreview()};
UIP.bind=function(){oldBindUI.call(this);const model=this.q('#skinModel');if(model)model.addEventListener('change',()=>{this.app.settings.skinModel=model.value;this.app.storage.saveSettings(this.app.settings);if(this.app.game&&this.app.game.visuals)this.app.game.visuals.applySkin();this.renderSkinPreview()})};

})();
