(function(){
'use strict';
const V=window.Voidlands,B=V.B;
V.VERSION='1.6.0';

/* -------------------------------------------------------------------------
   Diamond migration, progression items and new workstation blocks.
   Numeric ore id 15 is retained so existing worlds remain compatible.
------------------------------------------------------------------------- */
const ALIASES={
  lumen_crystal:'diamond',lumen_ore:'diamond_ore',lumen_pickaxe:'diamond_pickaxe',
  lumen_axe:'diamond_axe',lumen_shovel:'diamond_shovel',lumen_sword:'diamond_sword',
  grazer:'cow',dunetail:'sheep',gloam:'zombie',endwalker:'enderman',blazer:'blaze'
};
const canonical=k=>ALIASES[k]||k;
B.DIAMOND_ORE=B.LUMEN_ORE;
const ore=V.Blocks[B.DIAMOND_ORE];
if(ore){delete V.BlockByKey[ore.key];Object.assign(ore,{key:'diamond_ore',name:'Diamond Ore',drop:'diamond'});V.BlockByKey.diamond_ore=ore;}

function addBlock(id,key,name,opts){
  const d=Object.assign({id,key,name,solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:1,tool:'any',requiresTool:false,minTier:0,drop:key,maxStack:64,sound:'stone',textures:[key,key,key,key,key,key],placeable:true},opts||{});
  V.Blocks[id]=d;V.BlockByKey[key]=d;V.Items[key]={key,name,maxStack:d.maxStack,category:'blocks',icon:d.textures[2]||key,blockId:id};return d;
}
B.ENCHANTING_TABLE=46;B.LAPIS_ORE=47;
addBlock(B.ENCHANTING_TABLE,'enchanting_table','Enchanting Table',{hardness:5,tool:'pickaxe',requiresTool:true,minTier:3,interact:'enchanting',textures:['rift_frame','rift_frame','craft_top','obsidian','rift_frame','rift_frame'],maxStack:64});
addBlock(B.LAPIS_ORE,'lapis_ore','Lapis Ore',{hardness:3,tool:'pickaxe',requiresTool:true,minTier:2,drop:'lapis_lazuli',textures:['star_crystal_ore','star_crystal_ore','star_crystal_ore','star_crystal_ore','star_crystal_ore','star_crystal_ore']});

const item=(key,name,opts)=>V.Items[key]=Object.assign({key,name,maxStack:64,category:'materials',icon:key},opts||{});
for(const k of ['lumen_crystal','lumen_ore','lumen_pickaxe','lumen_axe','lumen_shovel','lumen_sword'])delete V.Items[k];
item('diamond_ore','Diamond Ore',{blockId:B.DIAMOND_ORE,category:'blocks',icon:'lumen_ore'});
item('diamond','Diamond');
item('lapis_lazuli','Lapis Lazuli');
item('paper','Paper');item('book','Book');
V.Items.raw_meat.name='Raw Meat';V.Items.cooked_meat.name='Cooked Meat';
item('rotten_flesh','Rotten Flesh',{category:'food',food:2,saturation:0});
item('bone','Bone');item('arrow','Arrow',{category:'combat'});item('string','String');item('spider_eye','Spider Eye',{category:'food',food:1,saturation:0});
item('diamond_pickaxe','Diamond Pickaxe',{category:'tools',tool:'pickaxe',tier:4,speed:9,durability:1561,maxStack:1,damage:5});
item('diamond_axe','Diamond Axe',{category:'tools',tool:'axe',tier:4,speed:9,durability:1561,maxStack:1,damage:9});
item('diamond_shovel','Diamond Shovel',{category:'tools',tool:'shovel',tier:4,speed:9,durability:1561,maxStack:1,damage:5.5});
item('diamond_sword','Diamond Sword',{category:'combat',tool:'sword',tier:4,speed:1,durability:1561,maxStack:1,damage:9});
item('diamond_helmet','Diamond Helmet',{category:'combat',armourSlot:'head',armour:3,durability:363,maxStack:1});
item('diamond_chestplate','Diamond Chestplate',{category:'combat',armourSlot:'chest',armour:8,durability:528,maxStack:1});
item('diamond_leggings','Diamond Leggings',{category:'combat',armourSlot:'legs',armour:6,durability:495,maxStack:1});
item('diamond_boots','Diamond Boots',{category:'combat',armourSlot:'feet',armour:3,durability:429,maxStack:1});

const oldMake=V.makeStack;
V.makeStack=function(key,count=1,extra){return oldMake(canonical(key),count,extra)};
const oldClone=V.stackClone;
V.stackClone=function(s){if(!s)return null;const c=oldClone(s);c.key=canonical(c.key);if(Array.isArray(s.enchants))c.enchants=s.enchants.map(e=>Object.assign({},e));return c};
V.canMerge=function(a,b){if(!a||!b||canonical(a.key)!==canonical(b.key)||(a.damage||0)!==(b.damage||0))return false;const ae=JSON.stringify(a.enchants||[]),be=JSON.stringify(b.enchants||[]);return ae===be};

const oldLoad=V.Inventory.prototype.load;
V.Inventory.prototype.load=function(d){oldLoad.call(this,d);const migrate=s=>{if(s)s.key=canonical(s.key);return s};this.slots.forEach(migrate);Object.values(this.armor).forEach(migrate);migrate(this.offhand)};

for(const r of V.Recipes){
  r.out[0]=canonical(r.out[0]);
  if(r.map)for(const k of Object.keys(r.map))r.map[k]=canonical(r.map[k]);
  if(r.in){const n={};for(const [k,v] of Object.entries(r.in))n[canonical(k)]=(n[canonical(k)]||0)+v;r.in=n;}
}
function recipe(r){if(!V.Recipes.some(x=>x.out[0]===r.out[0]))V.Recipes.push(r)}
recipe({type:'shaped',shape:['DDD',' S ',' S '],map:{D:'diamond',S:'stick'},out:['diamond_pickaxe',1]});
recipe({type:'shaped',shape:['DD','DS',' S'],map:{D:'diamond',S:'stick'},out:['diamond_axe',1]});
recipe({type:'shaped',shape:['D','S','S'],map:{D:'diamond',S:'stick'},out:['diamond_shovel',1]});
recipe({type:'shaped',shape:['D','D','S'],map:{D:'diamond',S:'stick'},out:['diamond_sword',1]});
recipe({type:'shaped',shape:['DDD','D D'],map:{D:'diamond'},out:['diamond_helmet',1]});
recipe({type:'shaped',shape:['D D','DDD','DDD'],map:{D:'diamond'},out:['diamond_chestplate',1]});
recipe({type:'shaped',shape:['DDD','D D','D D'],map:{D:'diamond'},out:['diamond_leggings',1]});
recipe({type:'shaped',shape:['D D','D D'],map:{D:'diamond'},out:['diamond_boots',1]});
recipe({type:'shaped',shape:['PPP'],map:{P:'planks'},out:['paper',3]});
recipe({type:'shapeless',in:{paper:3,hide:1},out:['book',1]});
recipe({type:'shaped',shape:[' B ','D D','OOO'],map:{B:'book',D:'diamond',O:'obsidian'},out:['enchanting_table',1]});

/* New ore is added after base terrain generation so the original deterministic
   generator and existing chunk format remain unchanged. */
const oldGenerate=V.World.prototype.generateChunkData;
V.World.prototype.generateChunkData=function(cx,cz){
  const key=V.chunkKey(cx,cz),existed=this.chunkData.has(key),a=oldGenerate.call(this,cx,cz);
  if(!existed&&this.dimension==='overworld')for(let z=0;z<V.CHUNK_SIZE;z++)for(let x=0;x<V.CHUNK_SIZE;x++){
    const wx=cx*V.CHUNK_SIZE+x,wz=cz*V.CHUNK_SIZE+z;
    for(let y=5;y<31;y++){
      const i=y*V.CHUNK_SIZE*V.CHUNK_SIZE+z*V.CHUNK_SIZE+x;
      if(a[i]===B.STONE&&V.Noise.hash3(wx,y,wz,this.seed+1515)>.9915)a[i]=B.LAPIS_ORE;
    }
  }
  return a;
};
const oldEnsure=V.World.prototype.ensureBlockEntity;
V.World.prototype.ensureBlockEntity=function(x,y,z,type){
  const k=V.blockKey(x,y,z);if(this.blockEntities[k])return this.blockEntities[k];
  if(type==='enchanting')return this.blockEntities[k]={type,item:null,lapis:null};
  return oldEnsure.call(this,x,y,z,type);
};

/* -------------------------------------------------------------------------
   Enchanting system.
------------------------------------------------------------------------- */
const ENCHANT_NAMES={efficiency:'Efficiency',unbreaking:'Unbreaking',fortune:'Fortune',silk_touch:'Silk Touch',mending:'Mending',sharpness:'Sharpness',smite:'Smite',bane_of_arthropods:'Bane of Arthropods',knockback:'Knockback',fire_aspect:'Fire Aspect',looting:'Looting',sweeping_edge:'Sweeping Edge',power:'Power',punch:'Punch',flame:'Flame',infinity:'Infinity',quick_charge:'Quick Charge',multishot:'Multishot',piercing:'Piercing',protection:'Protection',fire_protection:'Fire Protection',blast_protection:'Blast Protection',projectile_protection:'Projectile Protection',thorns:'Thorns',respiration:'Respiration',aqua_affinity:'Aqua Affinity',feather_falling:'Feather Falling',depth_strider:'Depth Strider',frost_walker:'Frost Walker',soul_speed:'Soul Speed',swift_sneak:'Swift Sneak',loyalty:'Loyalty',impaling:'Impaling',riptide:'Riptide',channeling:'Channeling',luck_of_the_sea:'Luck of the Sea',lure:'Lure',density:'Density',breach:'Breach',wind_burst:'Wind Burst'};
V.enchantLevel=function(stack,id){const e=stack&&stack.enchants&&stack.enchants.find(x=>x.id===id);return e?e.level:0};
function enchantPool(stack){
  const it=stack&&V.Items[stack.key];if(!it)return[];
  const p=[];
  if(['pickaxe','axe','shovel'].includes(it.tool))p.push(['efficiency',5],['unbreaking',3]);
  if(it.tool==='pickaxe')p.push(['fortune',3]);
  if(it.tool==='sword'||it.tool==='mace')p.push(['sharpness',5],['knockback',2],['unbreaking',3]);
  if(it.armourSlot)p.push(['protection',4],['unbreaking',3]);
  if(it.armourSlot==='feet')p.push(['feather_falling',4]);
  return p;
}
const IP=V.Inventory.prototype,oldOpen=IP.open,oldClose=IP.close,oldSlotRef=IP.slotRef,oldDamageSelected=IP.damageSelected;
IP.open=function(type,data){
  const migrate=s=>{if(s)s.key=canonical(s.key);return s};
  if(data){if(Array.isArray(data.slots))data.slots.forEach(migrate);for(const k of ['input','fuel','output','item','lapis'])migrate(data[k]);}
  oldOpen.call(this,type,data);if(type==='enchanting')this.enchant=data
};
IP.close=function(){oldClose.call(this);this.enchant=null};
IP.slotRef=function(group,index){
  if(group==='enchant'&&this.enchant){
    if(index===0)return{get:()=>this.enchant.item,set:v=>this.enchant.item=v,accept:s=>!!s&&enchantPool(s).length>0};
    if(index===1)return{get:()=>this.enchant.lapis,set:v=>this.enchant.lapis=v,accept:s=>!!s&&s.key==='lapis_lazuli'};
  }
  return oldSlotRef.call(this,group,index);
};
IP.enchantOptions=function(player){
  const stack=this.enchant&&this.enchant.item,pool=enchantPool(stack);if(!pool.length)return[];
  const seed=V.hashString((stack.key||'')+':' +(player.level||0)+':' +(stack.damage||0));
  return [1,2,3].map((cost,i)=>{const r=V.rng(seed+i*977)(),entry=pool[Math.floor(r*pool.length)%pool.length],max=Math.min(entry[1],cost===1?2:cost===2?3:entry[1]),level=Math.max(1,Math.min(max,1+Math.floor(r*max)));return{id:entry[0],level,cost,lapis:cost}});
};
IP.applyEnchant=function(option,player,creative){
  const e=this.enchant,stack=e&&e.item;if(!stack||!option)return{ok:false,message:'Place a tool, weapon or armour piece in the table.'};
  if(!creative){if(!e.lapis||e.lapis.key!=='lapis_lazuli'||e.lapis.count<option.lapis)return{ok:false,message:`Requires ${option.lapis} Lapis Lazuli.`};if((player.level||0)<option.cost)return{ok:false,message:`Requires level ${option.cost}.`};e.lapis.count-=option.lapis;if(e.lapis.count<=0)e.lapis=null;player.level-=option.cost;}
  stack.enchants=stack.enchants||[];let current=stack.enchants.find(x=>x.id===option.id);if(current)current.level=Math.max(current.level,option.level);else stack.enchants.push({id:option.id,level:option.level});
  if(option.cost===3){const extra=enchantPool(stack).filter(x=>x[0]!==option.id);if(extra.length&&Math.random()<.65){const add=extra[Math.floor(Math.random()*extra.length)],level=Math.min(add[1],1+Math.floor(Math.random()*2));current=stack.enchants.find(x=>x.id===add[0]);if(current)current.level=Math.max(current.level,level);else stack.enchants.push({id:add[0],level});}}
  return{ok:true,message:`Enchanted with ${ENCHANT_NAMES[option.id]} ${roman(option.level)}.`};
};
IP.damageSelected=function(amount=1){const s=this.selectedStack(),u=V.enchantLevel(s,'unbreaking');if(u&&Math.random()<u/(u+1))return false;return oldDamageSelected.call(this,amount)};
function roman(n){return['','I','II','III','IV','V'][n]||String(n)}
V.enchantDisplay=e=>`${ENCHANT_NAMES[e.id]||e.id} ${roman(e.level)}`;
V.addExperience=function(player,n){player.xp=(player.xp||0)+n;let levelled=false;while(player.xp>=10+player.level*2){player.xp-=10+player.level*2;player.level++;levelled=true}return levelled};

/* Item art for the new progression set. */
const oldCanvas=V.createItemCanvas;
V.createItemCanvas=function(key,size=32){
  key=canonical(key);const custom=['diamond','lapis_lazuli','paper','book','rotten_flesh','bone','arrow','string','spider_eye','enchanting_table','diamond_helmet','diamond_chestplate','diamond_leggings','diamond_boots'];
  if(!custom.includes(key))return oldCanvas(key,size);
  const small=document.createElement('canvas');small.width=small.height=16;const c=small.getContext('2d',{alpha:true});c.imageSmoothingEnabled=false;const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  if(key==='diamond'){r(7,1,2,2,'#eaffff');r(5,3,6,8,'#38d5e6');r(7,11,2,4,'#087d9b');r(6,5,2,4,'#bfffff');}
  if(key==='lapis_lazuli'){r(4,4,8,8,'#153e9e');r(5,3,6,10,'#285ed4');r(3,6,10,5,'#204db8');r(6,5,3,3,'#76a4ff');}
  if(key==='paper'){r(3,2,10,12,'#d9d4bb');r(4,2,8,11,'#fff9de');r(5,5,6,1,'#9ba3a5');r(5,8,5,1,'#9ba3a5');}
  if(key==='book'){r(2,3,6,11,'#6e2d22');r(8,3,6,11,'#7c3527');r(4,4,4,8,'#f4e6bf');r(8,4,4,8,'#f4e6bf');r(7,3,2,11,'#3b1c19');}
  if(key==='rotten_flesh'){r(3,4,10,9,'#6a3c2c');r(5,3,6,11,'#8b5540');r(6,6,3,3,'#ad7860');}
  if(key==='bone'){r(6,2,4,12,'#d9d3b8');r(4,1,4,4,'#f2ecd2');r(8,11,4,4,'#b9b49e');}
  if(key==='arrow'){r(7,2,2,11,'#6e4a2a');r(5,2,6,3,'#c7ced2');r(5,11,2,4,'#d8e1e3');r(9,11,2,4,'#d8e1e3');}
  if(key==='string'){r(3,3,2,2,'#e7e7df');r(5,4,2,2,'#c7cac5');r(7,6,2,2,'#f4f4ed');r(9,8,2,2,'#c7cac5');r(11,10,2,3,'#ededdf');}
  if(key==='spider_eye'){r(3,5,10,7,'#6e171a');r(5,3,6,10,'#a72a2d');r(7,5,3,3,'#ef6a61');}
  if(key==='enchanting_table'){r(2,8,12,6,'#21182b');r(3,7,10,5,'#5f2a56');r(4,4,8,4,'#d8c99f');r(5,3,6,4,'#f5edcf');r(7,4,2,4,'#593f82');}
  if(key.startsWith('diamond_')){const part=key.slice(8),d='#087d9b',m='#35d8e5',l='#c5ffff';if(part==='helmet'){r(3,4,10,8,d);r(4,3,8,7,m);r(5,4,4,2,l);c.clearRect(5,8,6,4)}if(part==='chestplate'){r(3,3,10,12,d);r(5,2,6,13,m);r(2,5,12,5,m);r(6,4,4,3,l);c.clearRect(7,2,2,3)}if(part==='leggings'){r(4,3,8,7,m);r(4,9,3,6,d);r(9,9,3,6,d);r(6,4,4,2,l)}if(part==='boots'){r(3,6,4,7,m);r(9,6,4,7,m);r(2,11,6,3,d);r(8,11,6,3,d)}}
  const out=document.createElement('canvas');out.width=out.height=size;const oc=out.getContext('2d',{alpha:true});oc.imageSmoothingEnabled=false;oc.drawImage(small,0,0,16,16,0,0,size,size);return out;
};
V.createItemTexture=function(key,size=64){const tex=new THREE.CanvasTexture(V.createItemCanvas(key,size));tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;if('encoding'in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;return tex};
V.iconCache={};V.itemIcon=function(key){key=canonical(key);if(V.iconCache[key])return V.iconCache[key];return V.iconCache[key]=`url(${V.createItemCanvas(key,32).toDataURL()})`};

/* -------------------------------------------------------------------------
   Textured voxel mobs. The silhouettes follow familiar voxel archetypes but
   all texture canvases and model code are original to Voidlands.
------------------------------------------------------------------------- */
const textureCache={};
function mobTexture(kind,part){const k=kind+':'+part;if(textureCache[k])return textureCache[k];const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{alpha:true});x.imageSmoothingEnabled=false;const palettes={
  cow:['#5a3324','#8b5a3c','#c49a78','#251914'],sheep:['#deded5','#f4f2e8','#8d8174','#312b29'],pig:['#d98991','#f2a5aa','#b85d68','#522f35'],
  zombie:['#496f46','#6d965c','#2d4f36','#22395d'],skeleton:['#c8c5ad','#ede9cd','#8c8978','#3c3a35'],spider:['#251d22','#413038','#111014','#8d202f'],
  enderman:['#15111d','#2b2037','#060509','#9d45d5'],blaze:['#d16a24','#ff9b32','#74331d','#ffdc62']};const p=palettes[kind]||palettes.zombie;x.fillStyle=p[0];x.fillRect(0,0,16,16);for(let i=0;i<34;i++){const h=V.Noise.hash3(i,part.length,kind.length,V.hashString(k)),px=Math.floor(h*997)%16,py=Math.floor(h*613)%16;x.fillStyle=p[1+Math.floor(h*3)%3];x.fillRect(px,py,h>.82?2:1,1)}if(part==='eyes'){x.fillStyle=p[3];x.fillRect(3,7,3,2);x.fillRect(10,7,3,2)}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;textureCache[k]=t;return t}
function mobMat(kind,part,emissive=false){return new THREE.MeshLambertMaterial({map:mobTexture(kind,part),color:0xffffff,emissive:emissive?0x4a175f:0x000000,emissiveIntensity:emissive?.9:0})}
function mobBox(w,h,d,kind,part,emissive=false){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mobMat(kind,part,emissive));m.castShadow=true;m.receiveShadow=true;return m}
const MC={
 cow:{width:.9,height:1.4,health:10,speed:1.15,xp:2,passive:true},sheep:{width:.85,height:1.35,health:8,speed:1.1,xp:2,passive:true},pig:{width:.85,height:1.15,health:10,speed:1.2,xp:2,passive:true},
 zombie:{width:.58,height:1.8,health:20,speed:1.75,attack:3,xp:5,hostile:true,burns:true},skeleton:{width:.55,height:1.85,health:20,speed:1.8,attack:3,xp:5,hostile:true,burns:true},
 spider:{width:1.35,height:.72,health:16,speed:2.35,attack:2,xp:5,hostile:true},enderman:{width:.62,height:2.9,health:40,speed:2.5,attack:7,xp:8,neutral:true},blaze:{width:.7,height:1.9,health:22,speed:2,attack:4,xp:7,hostile:true,floating:true}
};
class TexturedMob{
 constructor(manager,type,x,y,z){this.manager=manager;this.game=manager.game;this.world=this.game.world;this.type=canonical(type);this.cfg=MC[this.type]||MC.zombie;this.position=new THREE.Vector3(x,y,z);this.velocity=new THREE.Vector3();this.yaw=Math.random()*Math.PI*2;this.state='wander';this.targetTime=0;this.attackTime=0;this.hurtTime=0;this.age=0;this.grounded=false;this.dead=false;this.aggro=!!this.cfg.hostile;this.width=this.cfg.width;this.height=this.cfg.height;this.health=this.maxHealth=this.cfg.health;this.speed=this.cfg.speed;this.attackDamage=this.cfg.attack||0;this.daylightTimer=0;this.mesh=this.createMesh();this.mesh.userData.entity=this;this.mesh.position.copy(this.position);manager.group.add(this.mesh)}
 createMesh(){const g=new THREE.Group(),parts=this.parts={};
  if(['zombie','skeleton','enderman'].includes(this.type)){const tall=this.type==='enderman',thin=this.type==='skeleton'||tall,scale=tall?1.48:1,kind=this.type;parts.body=mobBox(thin?.32:.52,.72*scale,thin?.24:.3,kind,'body');parts.body.position.y=.98*scale;g.add(parts.body);parts.head=mobBox(tall?.48:.5,tall?.48:.5,tall?.48:.5,kind,'head',tall);parts.head.position.y=tall?2.62:1.58;g.add(parts.head);parts.arms=[];parts.legs=[];for(const s of [-1,1]){const arm=mobBox(thin?.14:.18,tall?1.25:.72,thin?.14:.18,kind,'limb');arm.position.set(s*(tall?.36:.37),tall?1.55:1.02,-.04);if(this.type==='zombie')arm.rotation.x=-1.25;g.add(arm);parts.arms.push(arm);const leg=mobBox(thin?.15:.2,tall?1.25:.72,thin?.15:.22,kind,'limb');leg.position.set(s*(tall?.13:.14),tall?.63:.36,0);g.add(leg);parts.legs.push(leg)}if(tall){const eye=new THREE.Mesh(new THREE.BoxGeometry(.3,.055,.025),new THREE.MeshBasicMaterial({color:0xc65cff,toneMapped:false}));eye.position.set(0,2.65,-.252);g.add(eye)}}
  else if(this.type==='spider'){parts.body=mobBox(.72,.42,.72,'spider','body');parts.body.position.y=.43;g.add(parts.body);parts.head=mobBox(.55,.38,.5,'spider','head');parts.head.position.set(0,.43,-.57);g.add(parts.head);parts.legs=[];for(const s of [-1,1])for(let i=0;i<4;i++){const leg=mobBox(.72,.09,.09,'spider','leg');leg.position.set(s*.68,.38,(i-1.5)*.19);leg.rotation.z=s*(.35+i*.08);leg.rotation.y=s*(i-1.5)*.14;g.add(leg);parts.legs.push(leg)}const eyes=new THREE.Mesh(new THREE.BoxGeometry(.34,.11,.025),new THREE.MeshBasicMaterial({color:0xe13d4c,toneMapped:false}));eyes.position.set(0,.48,-.825);g.add(eyes)}
  else if(this.type==='blaze'){parts.body=mobBox(.42,.8,.42,'blaze','body',true);parts.body.position.y=1.15;g.add(parts.body);parts.head=mobBox(.55,.55,.55,'blaze','head',true);parts.head.position.y=1.75;g.add(parts.head);parts.rods=[];for(let i=0;i<8;i++){const rod=mobBox(.12,.72,.12,'blaze','rod',true);const a=i/8*Math.PI*2;rod.position.set(Math.cos(a)*.65,.9+(i%2)*.55,Math.sin(a)*.65);g.add(rod);parts.rods.push(rod)}}
  else{const kind=this.type;parts.body=mobBox(.92,.68,.52,kind,'body');parts.body.position.y=.82;g.add(parts.body);parts.head=mobBox(.48,.48,.48,kind,'head');parts.head.position.set(0,1.18,-.45);g.add(parts.head);parts.legs=[];for(const s of [-1,1])for(const z of [-.18,.18]){const leg=mobBox(.16,.55,.16,kind,'leg');leg.position.set(s*.31,.3,z);g.add(leg);parts.legs.push(leg)}if(kind==='cow'){for(const s of [-1,1]){const horn=mobBox(.08,.2,.08,'skeleton','horn');horn.position.set(s*.2,1.48,-.44);horn.rotation.z=s*.45;g.add(horn)}}if(kind==='sheep'){const wool=mobBox(1.02,.78,.62,'sheep','wool');wool.position.y=.84;g.add(wool)}}return g}
 aabb(){return{minX:this.position.x-this.width/2,maxX:this.position.x+this.width/2,minY:this.position.y,maxY:this.position.y+this.height,minZ:this.position.z-this.width/2,maxZ:this.position.z+this.width/2}}
 intersects(a,b){return a.maxX>b.minX&&a.minX<b.maxX&&a.maxY>b.minY&&a.minY<b.maxY&&a.maxZ>b.minZ&&a.minZ<b.maxZ}
 moveAxis(axis,d){if(!d)return false;let blocked=false;const steps=Math.max(1,Math.ceil(Math.abs(d)/.18));for(let s=0;s<steps;s++){const p=d/steps;this.position[axis]+=p;const a=this.aabb();outer:for(let y=Math.floor(a.minY);y<=Math.floor(a.maxY);y++)for(let z=Math.floor(a.minZ);z<=Math.floor(a.maxZ);z++)for(let x=Math.floor(a.minX);x<=Math.floor(a.maxX);x++)for(const b of this.world.collisionBoxes(x,y,z))if(this.intersects(a,b)){blocked=true;if(axis==='x')this.position.x=p>0?b.minX-this.width/2:b.maxX+this.width/2;if(axis==='z')this.position.z=p>0?b.minZ-this.width/2:b.maxZ+this.width/2;if(axis==='y'){if(p>0)this.position.y=b.minY-this.height;else{this.position.y=b.maxY;this.grounded=true}this.velocity.y=0}break outer}if(blocked&&axis!=='y')break}return blocked}
 chooseDirection(){this.targetTime=2+Math.random()*5;this.yaw+=(-1+Math.random()*2)*1.8;this.state=Math.random()<.22?'idle':'wander'}
 lookedAt(player){if(this.type!=='enderman'||!player.viewDirection)return false;const eye=this.position.clone();eye.y+=2.45;const from=eye.sub(player.eyePosition?player.eyePosition():player.position),dist=from.length();if(dist>22)return false;from.normalize();return player.viewDirection().dot(from)>.965}
 teleportNear(player){for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,d=4+Math.random()*7,x=Math.floor(player.position.x+Math.cos(a)*d),z=Math.floor(player.position.z+Math.sin(a)*d),y=this.world.getSurfaceY(x,z);if(y>2&&this.world.getBlock(x,y,z)===B.AIR&&this.world.getBlock(x,y+1,z)===B.AIR&&this.world.getBlock(x,y+2,z)===B.AIR){this.position.set(x+.5,y,z+.5);this.game.audio.play('pickup');return true}}return false}
 update(dt){if(this.dead)return;this.age+=dt;this.hurtTime=Math.max(0,this.hurtTime-dt);this.attackTime=Math.max(0,this.attackTime-dt);const player=this.game.player,dist=this.position.distanceTo(player.position);
  if(this.cfg.burns&&!this.game.isNight()){this.daylightTimer+=dt;if(this.daylightTimer>1){this.daylightTimer=0;if(this.world.canSeeSky(this.position.x,this.position.y+this.height,this.position.z))this.takeDamage(2)}}else this.daylightTimer=0;
  if(this.type==='enderman'&&this.lookedAt(player))this.aggro=true;if(dist>72){this.remove();return}const chasing=(this.aggro||this.cfg.hostile)&&!player.dead&&dist<24;
  if(chasing){this.state='chase';const dx=player.position.x-this.position.x,dz=player.position.z-this.position.z;this.yaw=Math.atan2(-dx,-dz);if(this.type==='enderman'&&dist>10&&Math.random()<dt*.22)this.teleportNear(player);if(dist<(this.type==='spider'?1.6:1.45)&&this.attackTime<=0){this.attackTime=this.type==='enderman'?1.05:1.25;player.damage(this.attackDamage,`was slain by ${this.type==='enderman'?'an Enderman':'a '+this.type}`);const push=new THREE.Vector3(dx,0,dz).normalize();player.velocity.addScaledVector(push,this.type==='enderman'?7:5);this.game.audio.play('hostile')}}else{this.targetTime-=dt;if(this.targetTime<=0)this.chooseDirection()}
  const speed=this.state==='chase'?this.speed:this.state==='wander'?this.speed*.5:0,dx=-Math.sin(this.yaw)*speed,dz=-Math.cos(this.yaw)*speed;this.velocity.x=V.lerp(this.velocity.x,dx,Math.min(1,dt*4));this.velocity.z=V.lerp(this.velocity.z,dz,Math.min(1,dt*4));if(!this.cfg.floating)this.velocity.y-=18*dt;else this.velocity.y=Math.sin(this.age*2.2)*.35;const was=this.grounded;this.grounded=false;const bx=this.moveAxis('x',this.velocity.x*dt),bz=this.moveAxis('z',this.velocity.z*dt);if((bx||bz)&&was){if(this.type==='enderman'&&Math.random()<.55)this.teleportNear(player);else{this.velocity.y=this.type==='spider'?7:6;this.yaw+=Math.PI*(.4+Math.random()*.7)}}this.moveAxis('y',this.velocity.y*dt);if(this.position.y<-8){this.remove();return}
  this.animate(dt,speed);this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw;this.mesh.position.y+=Math.sin(this.age*(this.cfg.floating?3:8))*(this.cfg.floating?.12:.018);this.mesh.traverse(o=>{if(o.material&&o.material.emissive&&!o.material.userData?.baseGlow){o.material.emissive.setHex(this.hurtTime>0?0x5b1010:0x000000)}})}
 animate(dt,speed){const swing=Math.sin(this.age*(speed>0?9:2))*Math.min(1,speed);if(this.parts.legs)this.parts.legs.forEach((l,i)=>l.rotation.x=(i%2?1:-1)*swing*.58);if(this.parts.arms&&this.type!=='zombie')this.parts.arms.forEach((a,i)=>a.rotation.x=(i%2?-1:1)*swing*.55);if(this.parts.rods)this.parts.rods.forEach((r,i)=>{const a=this.age*(i%2?1.4:-1.2)+i/8*Math.PI*2;r.position.x=Math.cos(a)*.65;r.position.z=Math.sin(a)*.65})}
 takeDamage(n,knock){if(this.dead)return false;this.health-=n;this.hurtTime=.25;if(this.type==='enderman')this.aggro=true;if(knock){this.velocity.addScaledVector(knock,5);this.velocity.y=Math.max(this.velocity.y,2.2)}this.game.audio.play(this.cfg.passive?'passive':'hostile');if(this.health<=0)this.die();return true}
 die(){if(this.dead)return;this.dead=true;this.game.world.data.stats.mobsDefeated++;const drops={cow:[['raw_meat',2],['hide',1]],sheep:[['wool',2],['raw_meat',1]],pig:[['raw_meat',2]],zombie:[['rotten_flesh',2]],skeleton:[['bone',2],['arrow',2]],spider:[['string',2],['spider_eye',1]],enderman:[['ender_pearl',1]],blaze:[['blaze_rod',1]]}[this.type]||[['coal',1]];for(const [k,max] of drops){const n=1+Math.floor(Math.random()*max);if(n>0)this.manager.drop(V.makeStack(k,n),this.position.x,this.position.y+.5,this.position.z)}if(V.addExperience(this.game.player,this.cfg.xp||2))this.game.audio.play('level');this.remove()}
 remove(){if(this.dead&&this._removed)return;this.dead=true;this._removed=true;this.manager.group.remove(this.mesh);this.mesh.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();if(o.material&&o.material.dispose)o.material.dispose()});this.manager.mobs=this.manager.mobs.filter(m=>m!==this)}
}
const PreviousManager=V.EntityManager;
class ExpandedEntityManager extends PreviousManager{
 constructor(game){super(game);this.spawnTimer=1.4}
 spawn(type,x,y,z){const m=new TexturedMob(this,canonical(type),x,y,z);this.mobs.push(m);return m}
 trySpawn(){const dim=this.game.world.dimension,p=this.game.player;if(this.mobs.length>30)return;const angle=Math.random()*Math.PI*2,dist=14+Math.random()*24,x=Math.floor(p.position.x+Math.cos(angle)*dist),z=Math.floor(p.position.z+Math.sin(angle)*dist),y=this.game.world.getSurfaceY(x,z);if(y<2||y>V.WORLD_HEIGHT-4)return;const clear=n=>{for(let i=0;i<n;i++)if(this.game.world.getBlock(x,y+i,z)!==B.AIR)return false;return true};
  let type;if(dim==='emberdeep')type=Math.random()<.45?'blaze':'zombie';else if(dim==='starreach')type='enderman';else if(this.game.isNight()&&this.game.difficulty!=='peaceful'){const hostile=this.mobs.filter(m=>MC[m.type]&&(MC[m.type].hostile||MC[m.type].neutral)).length;if(hostile>=18)return;const r=Math.random();type=r<.38?'zombie':r<.64?'skeleton':r<.9?'spider':'enderman'}else{const passive=this.mobs.filter(m=>MC[m.type]&&MC[m.type].passive).length;if(passive>=12)return;const r=Math.random();type=r<.4?'cow':r<.75?'sheep':'pig'}
  const need=type==='enderman'?3:2;if(!clear(need))return;this.spawn(type,x+.5,y,z+.5)}
 spawnNightWave(){if(this.game.difficulty==='peaceful'||this.game.world.dimension!=='overworld')return;for(let i=0;i<3;i++){const p=this.game.player,a=Math.random()*Math.PI*2,d=13+i*3,x=Math.floor(p.position.x+Math.cos(a)*d),z=Math.floor(p.position.z+Math.sin(a)*d),y=this.game.world.getSurfaceY(x,z);if(this.game.world.getBlock(x,y,z)===B.AIR&&this.game.world.getBlock(x,y+1,z)===B.AIR)this.spawn(i===2&&Math.random()<.35?'enderman':i%2?'skeleton':'zombie',x+.5,y,z+.5)}}
}
V.EntityManager=ExpandedEntityManager;

/* -------------------------------------------------------------------------
   Gameplay hooks: functional enchant effects and unmistakable nights.
------------------------------------------------------------------------- */
const GP=V.Game.prototype,PP=V.Player.prototype;
const oldBreakSpeed=GP.breakSpeed;GP.breakSpeed=function(d){const base=oldBreakSpeed.call(this,d),s=this.inventory.selectedStack(),e=V.enchantLevel(s,'efficiency');return base*(1+e*.32)};
const oldFinish=GP.finishBreak;GP.finishBreak=function(t){const s=this.inventory.selectedStack(),fortune=V.enchantLevel(s,'fortune'),id=this.world.getBlock(t.x,t.y,t.z),eligible=[B.DIAMOND_ORE,B.LAPIS_ORE,B.COAL_ORE,B.IRON_ORE,B.GOLD_ORE].includes(id);if(!fortune||!eligible)return oldFinish.call(this,t);const drop=this.entities.drop;this.entities.drop=(stack,x,y,z)=>{stack.count+=Math.floor(Math.random()*(fortune+1));return drop.call(this.entities,stack,x,y,z)};try{return oldFinish.call(this,t)}finally{this.entities.drop=drop}};
const oldBegin=GP.beginBreak;GP.beginBreak=function(){const s=this.inventory.selectedStack(),sharp=V.enchantLevel(s,'sharpness'),knock=V.enchantLevel(s,'knockback');if(!sharp&&!knock)return oldBegin.call(this);const attack=this.entities.attackRay;this.entities.attackRay=(o,d,r,damage)=>{const hit=attack.call(this.entities,o,d,r,damage+sharp*1.25);if(hit&&knock)hit.mob.velocity.addScaledVector(d,knock*2.2);return hit};try{return oldBegin.call(this)}finally{this.entities.attackRay=attack}};
const oldDamage=PP.damage;PP.damage=function(n,reason,continuous){let protection=0;for(const s of Object.values(this.game.inventory.armor))protection+=V.enchantLevel(s,'protection');if(protection)n*=Math.max(.2,1-protection*.04);if(typeof reason==='string'&&reason.startsWith('fell ')){const boots=this.game.inventory.armor.feet,ff=V.enchantLevel(boots,'feather_falling');if(ff)n*=Math.max(.15,1-ff*.15)}return oldDamage.call(this,n,reason,continuous)};
const oldFixed=GP.fixedUpdate;GP.fixedUpdate=function(dt){oldFixed.call(this,dt);let levelled=false;while(this.player.xp>=10+this.player.level*2){this.player.xp-=10+this.player.level*2;this.player.level++;levelled=true}if(levelled)this.audio.play('level')};
const oldAtmosphere=GP.updateAtmosphere;GP.updateAtmosphere=function(dt){const was=this._visibleNight||false,result=oldAtmosphere.call(this,dt);if(this.world.dimension!=='overworld'){const bt=this.settings.vibrantVisuals?1:.97;this.world.materials.opaque.color.setRGB(bt,bt,bt);this.world.materials.cutout.color.setRGB(bt,bt,bt);return result;}const baseTint=this.settings.vibrantVisuals?1:.97;this.world.materials.opaque.color.setRGB(baseTint,baseTint,baseTint);this.world.materials.cutout.color.setRGB(baseTint,baseTint,baseTint);
  const t=this.data.time,fadeIn=V.clamp((t-11500)/1800,0,1),fadeOut=t>22500?V.clamp((24000-t)/1500,0,1):1,night=fadeIn*fadeOut;this._visibleNight=night>.55;if(night>0){const deep=new THREE.Color(this.settings.vibrantVisuals?0x020817:0x01040d),fog=new THREE.Color(this.settings.vibrantVisuals?0x07132a:0x030816);this.scene.background.lerp(deep,night*.88);this.scene.fog.color.lerp(fog,night*.86);this.ambient.intensity=Math.min(this.ambient.intensity,.055+(1-night)*.16);this.sunLight.intensity=Math.min(this.sunLight.intensity,.018+(1-night)*.12);this.sunLight.color.set(0x7b95c7);this.ambient.color.set(0x52658c);this.ambient.groundColor.set(0x080b12);this.stars.material.opacity=Math.max(this.stars.material.opacity,night);this.world.materials.opaque.color.setRGB(1-night*.18,1-night*.14,1-night*.07);this.world.materials.cutout.color.copy(this.world.materials.opaque.color);this.world.materials.fluid.color.set(night>.55?0x416582:0x8fbdd2)}const label=document.querySelector('#weatherLabel');if(label)label.textContent=`${this._visibleNight?'NIGHT · HOSTILES ACTIVE':'DAY'} · ${V.formatTime(t)}${this.weather==='clear'?'':' · '+this.weather.toUpperCase()}`;if(this._visibleNight&&!was){this.ui.toast('Night has fallen — hostile mobs are spawning.');this.ui.chat('Night has fallen. Zombies, skeletons, spiders and Endermen now roam the surface.');if(this.entities.spawnNightWave)this.entities.spawnNightWave()}return result};
GP.useBed=function(x,y,z){if(this.world.dimension!=='overworld'){this.ui.toast('The bed cannot be used in this dimension.');return}const spawn={x:x+.5,y:y+.58,z:z+.5};this.data.spawn=spawn;this.data.respawnDimension='overworld';this.player.spawn=spawn;const nearby=this.entities.mobs.some(m=>!m.dead&&(MC[m.type]?.hostile||m.aggro)&&m.position.distanceTo(this.player.position)<10);if(!this.isNight()){this.ui.toast('Respawn point set. You can sleep when night falls.');this.save();return}if(nearby){this.ui.toast('You may not rest now; monsters are nearby.');this.save();return}this.data.time=1000;this.weather='clear';this.weatherTime=9000;for(const m of [...this.entities.mobs])if((MC[m.type]?.hostile||m.aggro)&&m.position.distanceTo(this.player.position)<32)m.remove();const fade=document.querySelector('#sleepFade');if(fade){fade.classList.add('active');setTimeout(()=>fade.classList.remove('active'),900)}this.audio.play('menu');this.ui.chat('Slept until morning. Respawn point set.');this.save()};

/* Enchanting table inventory and enchanted-item presentation. */
const UIP=V.UI.prototype,oldBind=UIP.bind,oldRender=UIP.renderInventory,oldTooltip=UIP.showTooltip,oldSlotHTML=UIP.slotHTML,oldHUD=UIP.refreshHUD;
UIP.bind=function(){oldBind.call(this);const body=this.q('#inventoryBody');if(body)body.addEventListener('click',e=>{const b=e.target.closest('[data-enchant-level]');if(!b||!this.app.game)return;const g=this.app.game,inv=g.inventory,options=inv.enchantOptions(g.player),o=options[Number(b.dataset.enchantLevel)-1],res=inv.applyEnchant(o,g.player,g.mode==='creative');this.toast(res.message);if(res.ok)g.audio.play('level');this.renderInventory();this.refreshHUD()})};
UIP.slotHTML=function(stack,group,index,extra=''){let h=oldSlotHTML.call(this,stack,group,index,extra);if(stack&&stack.enchants&&stack.enchants.length)h=h.replace('class="slot"','class="slot enchanted"');return h};
UIP.renderInventory=function(){const g=this.app.game;if(!g||g.inventory.openType!=='enchanting')return oldRender.call(this);const inv=g.inventory,e=inv.enchant,options=inv.enchantOptions(g.player);this.q('#inventoryTitle').textContent='Enchanting Table';this.q('#creativeSearch').classList.add('hidden');let buttons='';for(let i=0;i<3;i++){const o=options[i],can=o&&(g.mode==='creative'||(e.lapis&&e.lapis.count>=o.lapis&&g.player.level>=o.cost));buttons+=o?`<button class="enchant-option ${can?'ready':'locked'}" data-enchant-level="${i+1}" ${can?'':'disabled'}><span>${V.escapeHtml(ENCHANT_NAMES[o.id])} ${roman(o.level)}</span><small>${g.mode==='creative'?'Free in Creative':`${o.cost} level · ${o.lapis} lapis`}</small></button>`:`<button class="enchant-option locked" disabled><span>Place an enchantable item</span></button>`}let h='<div class="inventory-layout"><div><div class="equipment">'+['head','chest','legs','feet'].map((k,i)=>this.slotHTML(inv.armor[k],'armor',i)).join('')+'<div class="player-preview"></div>'+this.slotHTML(inv.offhand,'offhand',0)+'</div></div><div><div class="enchanting-ui"><div class="enchant-slots"><label>Item'+this.slotHTML(e.item,'enchant',0)+'</label><label>Lapis'+this.slotHTML(e.lapis,'enchant',1)+'</label></div><div class="enchant-book">✦</div><div class="enchant-options">'+buttons+'</div></div><div class="inv-title">Inventory</div><div class="slot-grid">';for(let i=9;i<36;i++)h+=this.slotHTML(inv.slots[i],'inv',i);h+='</div><div class="inv-title">Hotbar</div><div class="slot-grid">';for(let i=0;i<9;i++)h+=this.slotHTML(inv.slots[i],'inv',i);h+='</div></div></div><div class="close-hint">Press E or Escape to close</div>';this.q('#inventoryBody').innerHTML=h;const c=this.q('#cursorStack');c.innerHTML=inv.cursor?this.slotHTML(inv.cursor,'cursor',0):'';c.classList.toggle('hidden',!inv.cursor)};
UIP.showTooltip=function(s){oldTooltip.call(this,s);if(this.tooltip&&s&&s.enchants&&s.enchants.length)this.tooltip.innerHTML+=s.enchants.map(e=>`<br><span class="enchant-name">${V.escapeHtml(V.enchantDisplay(e))}</span>`).join('')};
UIP.refreshHUD=function(){oldHUD.call(this);const g=this.app.game;if(!g)return;const need=10+g.player.level*2,pct=V.clamp(g.player.xp/need*100,0,100),bar=this.q('#xpBar div');if(bar)bar.style.width=pct+'%';const hot=this.q('#hotbar');if(hot)for(let i=0;i<9;i++)if(g.inventory.slots[i]?.enchants?.length&&hot.children[i])hot.children[i].classList.add('enchanted')};

})();
