(function(){
'use strict';
const V=window.Voidlands,B=V.B,CS=V.CHUNK_SIZE,H=V.WORLD_HEIGHT;
V.VERSION='1.6.0';

/* -------------------------------------------------------------------------
   Blocks, items and recipes
------------------------------------------------------------------------- */
function addBlock(id,key,name,opts={}){
  const d=Object.assign({id,key,name,solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:1,tool:'any',requiresTool:false,minTier:0,drop:key,maxStack:64,sound:'stone',textures:[key,key,key,key,key,key],placeable:true},opts);
  V.Blocks[id]=d;V.BlockByKey[key]=d;
  if(d.placeable)V.Items[key]={key,name,maxStack:d.maxStack,category:'blocks',icon:d.textures[2]||key,blockId:id};
  return d;
}
function addItem(key,name,opts={}){V.Items[key]=Object.assign({key,name,maxStack:64,category:'materials',icon:key},opts);return V.Items[key]}
function addRecipe(r){if(!V.Recipes.some(x=>x.out[0]===r.out[0]&&JSON.stringify(x.shape||x.in)===JSON.stringify(r.shape||r.in)))V.Recipes.push(r)}

B.DEEPSLATE=48;B.NETHER_BRICKS=49;B.SPAWNER=50;B.END_PORTAL_FRAME=51;B.WITHER_SKULL=52;B.END_CRYSTAL=53;B.END_GATEWAY=54;
B.NETHER_PORTAL=B.EMBER_PORTAL;B.END_PORTAL=B.STAR_PORTAL;B.SOUL_SAND=B.ASH;B.END_STONE=B.SKY_STONE;
addBlock(B.DEEPSLATE,'deepslate','Deepslate',{hardness:2.5,tool:'pickaxe',requiresTool:true,minTier:1,drop:'cobbled_deepslate',textures:['bedrock','bedrock','bedrock','bedrock','bedrock','bedrock']});
addItem('cobbled_deepslate','Cobbled Deepslate',{category:'blocks',blockId:B.DEEPSLATE,icon:'bedrock'});
addBlock(B.NETHER_BRICKS,'nether_bricks','Nether Bricks',{hardness:2,tool:'pickaxe',requiresTool:true,minTier:1,textures:['bricks','bricks','bricks','bricks','bricks','bricks']});
addBlock(B.SPAWNER,'spawner','Monster Spawner',{hardness:5,tool:'pickaxe',requiresTool:true,minTier:2,drop:null,placeable:false,textures:['rift_frame','rift_frame','rift_frame','rift_frame','rift_frame','rift_frame'],emission:.25});
addBlock(B.END_PORTAL_FRAME,'end_portal_frame','End Portal Frame',{hardness:999999,drop:null,placeable:false,textures:['rift_frame','rift_frame','star_portal','rift_frame','rift_frame','rift_frame']});
addBlock(B.WITHER_SKULL,'wither_skeleton_skull','Wither Skeleton Skull',{solid:false,opaque:false,transparent:true,hardness:1,drop:'wither_skeleton_skull',textures:['bedrock','bedrock','bedrock','bedrock','bedrock','bedrock'],maxStack:64});
addBlock(B.END_CRYSTAL,'end_crystal','End Crystal',{solid:false,opaque:false,transparent:true,cutout:true,hardness:.1,drop:null,textures:['glowrock','glowrock','glowrock','glowrock','glowrock','glowrock'],maxStack:64,emission:1});
addBlock(B.END_GATEWAY,'end_gateway','End Gateway',{solid:false,opaque:false,transparent:true,cutout:true,hardness:999999,drop:null,placeable:false,textures:['star_portal','star_portal','star_portal','star_portal','star_portal','star_portal'],emission:1});

const DIMENSION_ALIASES={emberstone:'netherrack',ash:'soul_sand',glowrock:'glowstone',sky_stone:'end_stone'};
function renameDimensionBlock(id,newKey,newName){
  const block=V.Blocks[id],oldKey=block.key,oldItem=V.Items[oldKey];
  delete V.BlockByKey[oldKey];
  Object.assign(block,{key:newKey,name:newName,drop:newKey});
  V.BlockByKey[newKey]=block;
  V.Items[newKey]=Object.assign({},oldItem||{category:'blocks',maxStack:64},{key:newKey,name:newName,blockId:id,icon:(oldItem&&oldItem.icon)||block.textures[2]||oldKey});
  delete V.Items[oldKey];
}
renameDimensionBlock(B.EMBERSTONE,'netherrack','Netherrack');
renameDimensionBlock(B.ASH,'soul_sand','Soul Sand');
renameDimensionBlock(B.GLOWROCK,'glowstone','Glowstone');
renameDimensionBlock(B.SKY_STONE,'end_stone','End Stone');
Object.assign(V.Blocks[B.OBSIDIAN],{name:'Obsidian'});if(V.Items.obsidian)V.Items.obsidian.name='Obsidian';
Object.assign(V.Blocks[B.EMBER_PORTAL],{name:'Nether Portal'});Object.assign(V.Blocks[B.STAR_PORTAL],{name:'End Portal'});
const preProgressionMake=V.makeStack,preProgressionClone=V.stackClone,preProgressionLoad=V.Inventory.prototype.load;
V.makeStack=function(key,count=1,extra){return preProgressionMake(DIMENSION_ALIASES[key]||key,count,extra)};
V.stackClone=function(stack){const c=preProgressionClone(stack);if(c)c.key=DIMENSION_ALIASES[c.key]||c.key;return c};
V.Inventory.prototype.load=function(data){preProgressionLoad.call(this,data);const migrate=s=>{if(s)s.key=DIMENSION_ALIASES[s.key]||s.key};this.slots.forEach(migrate);Object.values(this.armor).forEach(migrate);migrate(this.offhand)};
for(const recipe of V.Recipes){if(recipe.map)for(const key of Object.keys(recipe.map))recipe.map[key]=DIMENSION_ALIASES[recipe.map[key]]||recipe.map[key];if(recipe.in){const next={};for(const [key,count] of Object.entries(recipe.in))next[DIMENSION_ALIASES[key]||key]=(next[DIMENSION_ALIASES[key]||key]||0)+count;recipe.in=next}recipe.out[0]=DIMENSION_ALIASES[recipe.out[0]]||recipe.out[0]}

// Buckets are utility items, not pre-filled blocks.
if(V.Items.water_bucket){delete V.Items.water_bucket.blockId;V.Items.water_bucket.name='Water Bucket'}
if(V.Items.lava_bucket){delete V.Items.lava_bucket.blockId;V.Items.lava_bucket.name='Lava Bucket'}
addItem('bucket','Bucket',{category:'utility',maxStack:16});
addItem('flint','Flint');
addItem('flint_and_steel','Flint and Steel',{category:'tools',maxStack:1,durability:64});
addItem('shield','Shield',{category:'combat',maxStack:1,durability:336,shield:true});
addItem('blaze_rod','Blaze Rod');
addItem('blaze_powder','Blaze Powder');
addItem('eye_of_ender','Eye of Ender',{category:'utility',maxStack:64,projectile:'eye'});
addItem('ghast_tear','Ghast Tear');
addItem('wither_skeleton_skull','Wither Skeleton Skull',{category:'combat',blockId:B.WITHER_SKULL,maxStack:64,icon:'wither_skeleton_skull'});
addItem('end_crystal','End Crystal',{category:'utility',blockId:B.END_CRYSTAL,maxStack:64,icon:'end_crystal'});
addItem('nether_star','Nether Star');
addItem('bow','Bow',{category:'combat',tool:'bow',maxStack:1,durability:384,damage:2});
addItem('crossbow','Crossbow',{category:'combat',tool:'crossbow',maxStack:1,durability:465,damage:3});
addItem('trident','Trident',{category:'combat',tool:'trident',maxStack:1,durability:250,damage:9});
addItem('fishing_rod','Fishing Rod',{category:'tools',tool:'fishing_rod',maxStack:1,durability:64});
addItem('shears','Shears',{category:'tools',tool:'shears',maxStack:1,durability:238});

// Remove the old free-water recipe and make a real empty bucket from three iron.
V.Recipes.splice(0,V.Recipes.length,...V.Recipes.filter(r=>r.out[0]!=='water_bucket'&&r.out[0]!=='lava_bucket'));
addRecipe({type:'shaped',shape:['I I',' I '],map:{I:'iron_ingot'},out:['bucket',1]});
addRecipe({type:'shapeless',in:{iron_ingot:1,flint:1},out:['flint_and_steel',1]});
addRecipe({type:'shaped',shape:['PPP','PIP',' P '],map:{P:'planks',I:'iron_ingot'},out:['shield',1]});
addRecipe({type:'shapeless',in:{blaze_rod:1},out:['blaze_powder',2]});
addRecipe({type:'shapeless',in:{ender_pearl:1,blaze_powder:1},out:['eye_of_ender',1]});
addRecipe({type:'shaped',shape:['GGG','GEG','GTG'],map:{G:'glass',E:'eye_of_ender',T:'ghast_tear'},out:['end_crystal',1]});
addRecipe({type:'shaped',shape:['SSS',' S ',' S '],map:{S:'stick'},out:['bow',1]});
addRecipe({type:'shaped',shape:['SIS','STS',' S '],map:{S:'stick',I:'iron_ingot',T:'string'},out:['crossbow',1]});
addRecipe({type:'shaped',shape:[' I ','I I'],map:{I:'iron_ingot'},out:['shears',1]});

/* Item art for new items. */
const previousCanvas=V.createItemCanvas;
V.createItemCanvas=function(key,size=32){
  const custom=['bucket','water_bucket','lava_bucket','flint','flint_and_steel','shield','blaze_rod','blaze_powder','eye_of_ender','ghast_tear','wither_skeleton_skull','end_crystal','nether_star','bow','crossbow','trident','fishing_rod','shears','cobbled_deepslate'];
  if(!custom.includes(key))return previousCanvas(key,size);
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{alpha:true});x.imageSmoothingEnabled=false;const r=(a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};const line=(a,b,c1,d,col,w=1)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();x.moveTo(a+.5,b+.5);x.lineTo(c1+.5,d+.5);x.stroke()};
  if(key==='bucket'||key==='water_bucket'||key==='lava_bucket'){r(3,4,10,10,'#59646c');r(4,5,8,7,'#c4d0d5');r(5,8,6,4,key==='water_bucket'?'#2e8dd8':key==='lava_bucket'?'#f0641e':'#65727a');line(4,5,5,2,'#8d999f');line(11,5,10,2,'#8d999f');line(5,2,10,2,'#8d999f')}
  if(key==='flint'){r(4,4,8,8,'#343a3e');r(6,2,5,12,'#59636a');r(3,7,10,4,'#252a2d');r(7,4,3,3,'#8a969c')}
  if(key==='flint_and_steel'){r(3,3,8,3,'#bec8cc');r(3,5,3,8,'#777f84');r(5,10,7,3,'#42494d');r(9,6,4,4,'#ef9d2f')}
  if(key==='shield'){r(3,2,10,11,'#754824');r(4,3,8,9,'#a36b35');r(6,4,4,7,'#d2a04f');r(5,12,6,3,'#4d301d')}
  if(key==='blaze_rod'){line(5,14,10,2,'#d67626',3);line(6,13,11,1,'#ffc24a',1);r(4,6,4,2,'#ff9b32');r(9,9,4,2,'#ffdc62')}
  if(key==='blaze_powder'){for(const p of [[4,4],[8,3],[11,6],[6,8],[9,11],[4,12]])r(p[0],p[1],3,3,p[0]%2?'#ffb63d':'#d86b22')}
  if(key==='eye_of_ender'){r(3,5,10,6,'#1c7b66');r(5,3,6,10,'#3ecf9b');r(6,5,4,6,'#101822');r(7,6,2,4,'#ac55d7')}
  if(key==='ghast_tear'){r(7,1,2,4,'#effcff');r(5,4,6,6,'#bde4ed');r(6,10,4,4,'#79b9ca');r(7,5,2,4,'#ffffff')}
  if(key==='wither_skeleton_skull'){r(3,3,10,9,'#222428');r(4,2,8,10,'#4d5156');r(5,6,2,2,'#111');r(9,6,2,2,'#111');r(6,10,4,3,'#161719')}
  if(key==='end_crystal'){r(7,1,2,14,'#e8ffff');r(3,5,10,6,'#b26cff');r(5,3,6,10,'#76e5f0');r(6,5,4,6,'#fff');r(7,6,2,4,'#e14dff')}
  if(key==='nether_star'){for(let i=0;i<8;i++){const a=i*Math.PI/4;r(Math.round(7+Math.cos(a)*5),Math.round(7+Math.sin(a)*5),2,2,'#eaffff')}r(5,5,6,6,'#84dff1');r(7,7,2,2,'#fff')}
  if(key==='bow'){line(4,2,4,13,'#5d351e',2);line(4,2,11,7,'#c69355');line(11,7,4,13,'#c69355');line(4,2,4,13,'#e8e5d4')}
  if(key==='crossbow'){r(3,6,10,3,'#70431f');line(2,4,13,10,'#b47d42',2);line(2,10,13,4,'#b47d42',2);r(7,8,2,7,'#4a2d1b')}
  if(key==='trident'){line(8,14,8,3,'#4e9da1',2);line(5,4,11,4,'#9ce9e3');line(5,4,5,1,'#9ce9e3');line(8,4,8,1,'#9ce9e3');line(11,4,11,1,'#9ce9e3')}
  if(key==='fishing_rod'){line(4,14,10,2,'#6c4125',2);line(10,2,13,8,'#ddd',1);r(12,8,2,2,'#cf4545')}
  if(key==='shears'){line(4,13,11,3,'#b8c3c8',2);line(11,13,4,3,'#b8c3c8',2);r(2,11,5,4,'#6c7478');r(9,11,5,4,'#6c7478')}
  if(key==='cobbled_deepslate'){r(0,0,16,16,'#33363a');for(const p of [[1,1,6,4],[8,0,8,5],[0,6,5,5],[6,6,10,5],[0,12,8,4],[9,12,7,4]]){r(p[0],p[1],p[2],p[3],'#474b50');r(p[0],p[1],p[2],1,'#202326')}}
  const o=document.createElement('canvas');o.width=o.height=size;const oc=o.getContext('2d',{alpha:true});oc.imageSmoothingEnabled=false;oc.drawImage(c,0,0,16,16,0,0,size,size);return o;
};
V.iconCache={};V.itemIcon=function(key){if(V.iconCache[key])return V.iconCache[key];return V.iconCache[key]=`url(${V.createItemCanvas(key,32).toDataURL()})`};

/* -------------------------------------------------------------------------
   Expanded enchanting. Every enchant listed here is obtainable, compatible
   items receive suitable choices, and high-tier rolls can apply bundles.
------------------------------------------------------------------------- */
const ENCHANTS={
 efficiency:['Efficiency',5],unbreaking:['Unbreaking',3],fortune:['Fortune',3],silk_touch:['Silk Touch',1],mending:['Mending',1],
 sharpness:['Sharpness',5],smite:['Smite',5],bane_of_arthropods:['Bane of Arthropods',5],knockback:['Knockback',2],fire_aspect:['Fire Aspect',2],looting:['Looting',3],sweeping_edge:['Sweeping Edge',3],
 power:['Power',5],punch:['Punch',2],flame:['Flame',1],infinity:['Infinity',1],quick_charge:['Quick Charge',3],multishot:['Multishot',1],piercing:['Piercing',4],
 protection:['Protection',4],fire_protection:['Fire Protection',4],blast_protection:['Blast Protection',4],projectile_protection:['Projectile Protection',4],thorns:['Thorns',3],respiration:['Respiration',3],aqua_affinity:['Aqua Affinity',1],feather_falling:['Feather Falling',4],depth_strider:['Depth Strider',3],frost_walker:['Frost Walker',2],soul_speed:['Soul Speed',3],swift_sneak:['Swift Sneak',3],
 loyalty:['Loyalty',3],impaling:['Impaling',5],riptide:['Riptide',3],channeling:['Channeling',1],luck_of_the_sea:['Luck of the Sea',3],lure:['Lure',3],
 density:['Density',5],breach:['Breach',4],wind_burst:['Wind Burst',3]
};
const roman=n=>['','I','II','III','IV','V'][n]||String(n);
V.ENCHANTS=ENCHANTS;V.enchantDisplay=e=>`${ENCHANTS[e.id]?.[0]||e.id} ${roman(e.level)}`;
function pool(stack){const it=stack&&V.Items[stack.key];if(!it)return[];const p=[];const add=(...ids)=>ids.forEach(id=>p.push([id,ENCHANTS[id][1]]));
  if(['pickaxe','axe','shovel','shears'].includes(it.tool))add('efficiency','unbreaking','fortune','silk_touch','mending');
  if(['sword','axe'].includes(it.tool))add('sharpness','smite','bane_of_arthropods','knockback','fire_aspect','looting','sweeping_edge','unbreaking','mending');
  if(it.tool==='mace')add('density','breach','wind_burst','smite','bane_of_arthropods','fire_aspect','unbreaking','mending');
  if(it.tool==='bow')add('power','punch','flame','infinity','unbreaking','mending');
  if(it.tool==='crossbow')add('quick_charge','multishot','piercing','unbreaking','mending');
  if(it.tool==='trident')add('loyalty','impaling','riptide','channeling','unbreaking','mending');
  if(it.tool==='fishing_rod')add('luck_of_the_sea','lure','unbreaking','mending');
  if(it.shield)add('unbreaking','mending');
  if(it.armourSlot){add('protection','fire_protection','blast_protection','projectile_protection','thorns','unbreaking','mending');if(it.armourSlot==='head')add('respiration','aqua_affinity');if(it.armourSlot==='legs')add('swift_sneak');if(it.armourSlot==='feet')add('feather_falling','depth_strider','frost_walker','soul_speed')}
  return p;
}
function conflicts(a,b){const groups=[['fortune','silk_touch'],['sharpness','smite','bane_of_arthropods'],['protection','fire_protection','blast_protection','projectile_protection'],['depth_strider','frost_walker'],['infinity','mending'],['multishot','piercing'],['riptide','loyalty','channeling'],['density','breach']];return groups.some(g=>g.includes(a)&&g.includes(b))}
const IP=V.Inventory.prototype;
IP.enchantOptions=function(player){const stack=this.enchant&&this.enchant.item,p=pool(stack);if(!p.length)return[];const seed=V.hashString(`${stack.key}:${player.level||0}:${stack.damage||0}:${JSON.stringify(stack.enchants||[])}`);return [1,2,3].map((tier,i)=>{const rng=V.rng(seed+i*1907),entry=p[Math.floor(rng()*p.length)],max=entry[1],level=Math.max(1,Math.min(max,tier===1?1+Math.floor(rng()*2):tier===2?1+Math.floor(rng()*Math.min(3,max)):1+Math.floor(rng()*max)));return{id:entry[0],level,cost:tier*3,lapis:tier,bundle:tier===3?2+Math.floor(rng()*3):tier===2&&rng()>.55?2:1}})};
IP.applyEnchant=function(option,player,creative){const e=this.enchant,stack=e&&e.item;if(!stack||!option)return{ok:false,message:'Place an enchantable item in the table.'};if(!creative){if(!e.lapis||e.lapis.count<option.lapis)return{ok:false,message:`Requires ${option.lapis} Lapis Lazuli.`};if((player.level||0)<option.cost)return{ok:false,message:`Requires level ${option.cost}.`};e.lapis.count-=option.lapis;if(e.lapis.count<=0)e.lapis=null;player.level-=option.cost}
  stack.enchants=stack.enchants||[];const choices=pool(stack),rng=V.rng(V.hashString(stack.key+':'+Date.now()+':'+option.id));const selected=[{id:option.id,level:option.level}];for(let n=1;n<(option.bundle||1);n++){const valid=choices.filter(c=>!selected.some(s=>s.id===c[0]||conflicts(s.id,c[0]))&&!stack.enchants.some(s=>conflicts(s.id,c[0])));if(!valid.length)break;const c=valid[Math.floor(rng()*valid.length)],level=Math.max(1,Math.min(c[1],1+Math.floor(rng()*Math.min(c[1],option.cost/3+1))));selected.push({id:c[0],level})}
  for(const en of selected){for(const old of [...stack.enchants])if(conflicts(old.id,en.id))stack.enchants.splice(stack.enchants.indexOf(old),1);const cur=stack.enchants.find(x=>x.id===en.id);if(cur)cur.level=Math.max(cur.level,en.level);else stack.enchants.push(en)}
  return{ok:true,message:`Enchanted: ${selected.map(V.enchantDisplay).join(', ')}.`};
};

/* -------------------------------------------------------------------------
   World generation: deepslate, dungeons, strongholds, faithful portals.
------------------------------------------------------------------------- */
const WP=V.World.prototype,baseGenerate=WP.generateChunkData,baseNether=WP.generateEmberChunk,baseEnd=WP.generateStarChunk,wi=(x,y,z)=>y*CS*CS+z*CS+x;
WP.getStrongholdLocation=function(){const cx=7+(this.seed%7),cz=-7-((this.seed>>>5)%7);return{cx,cz,x:cx*CS+8,y:13,z:cz*CS+8}};
function removeFreeGateway(a,cx,cz,dim){if(cx!==0||cz!==0)return;for(let y=0;y<H;y++)for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const i=wi(x,y,z),id=a[i];if(id===B.EMBER_PORTAL||id===B.STAR_PORTAL||id===B.END_GATEWAY)a[i]=B.AIR;else if(id===B.RIFT_FRAME&&((dim==='overworld'&&x>=4&&z>=4)||(dim!=='overworld'&&x>=5&&x<=11&&z>=5&&z<=11)))a[i]=B.AIR}}
function setLocal(a,x,y,z,id){if(x>=0&&x<CS&&z>=0&&z<CS&&y>0&&y<H)a[wi(x,y,z)]=id}
function stronghold(world,a,cx,cz){const loc=world.getStrongholdLocation();if(cx!==loc.cx||cz!==loc.cz)return;const y=loc.y;for(let yy=y-2;yy<=y+4;yy++)for(let z=2;z<=14;z++)for(let x=2;x<=14;x++){const shell=yy===y-2||yy===y+4||x===2||x===14||z===2||z===14;setLocal(a,x,yy,z,shell?((x+z+yy)%5?B.BRICKS:B.COBBLE):B.AIR)}for(let z=5;z<=11;z++)for(let x=5;x<=11;x++)setLocal(a,x,y-1,z,B.COBBLE);const frames=[];for(let x=6;x<=10;x++){if(x!==6&&x!==10)continue;for(let z=7;z<=9;z++)frames.push([x,z])}for(let z=6;z<=10;z++){if(z!==6&&z!==10)continue;for(let x=7;x<=9;x++)frames.push([x,z])}for(const [x,z] of frames){setLocal(a,x,y,z,B.END_PORTAL_FRAME);world.blockEntities[V.blockKey(cx*CS+x,y,cz*CS+z)]={type:'end_portal_frame',eye:false,centerX:cx*CS+8,centerZ:cz*CS+8}}setLocal(a,4,y,4,B.SPAWNER);world.blockEntities[V.blockKey(cx*CS+4,y,cz*CS+4)]={type:'spawner',mob:'skeleton',delay:2};setLocal(a,12,y,12,B.CHEST);world.blockEntities[V.blockKey(cx*CS+12,y,cz*CS+12)]={type:'chest',slots:Array.from({length:27},(_,i)=>i===0?V.makeStack('eye_of_ender',2):i===1?V.makeStack('iron_ingot',4):null)};}
function dungeon(world,a,cx,cz){if(!world.data.structures)return;const forcedX=-3-((world.seed>>>3)%4),forcedZ=3+(world.seed%4),r=V.Noise.hash3(cx,91,cz,world.seed+7401);if(!(cx===forcedX&&cz===forcedZ)&&r>.006)return;const y=9+Math.floor(V.Noise.hash3(cx,92,cz,world.seed+7403)*14);for(let yy=y-1;yy<=y+4;yy++)for(let z=3;z<=12;z++)for(let x=3;x<=12;x++){const shell=yy===y-1||yy===y+4||x===3||x===12||z===3||z===12;setLocal(a,x,yy,z,shell?((x+z)%4?B.COBBLE:B.STONE):B.AIR)}setLocal(a,8,y,8,B.SPAWNER);const mob=V.Noise.hash3(cx,93,cz,world.seed)>.5?'zombie':'skeleton';world.blockEntities[V.blockKey(cx*CS+8,y,cz*CS+8)]={type:'spawner',mob,delay:2};setLocal(a,5,y,5,B.CHEST);world.blockEntities[V.blockKey(cx*CS+5,y,cz*CS+5)]={type:'chest',slots:Array.from({length:27},(_,i)=>i===0?V.makeStack('bread',3):i===1?V.makeStack('iron_ingot',2):i===2?V.makeStack('bucket',1):null)}}
WP.generateChunkData=function(cx,cz){const existed=this.chunkData.has(V.chunkKey(cx,cz)),a=baseGenerate.call(this,cx,cz);if(!existed&&this.dimension==='overworld'){removeFreeGateway(a,cx,cz,'overworld');for(let z=0;z<CS;z++)for(let x=0;x<CS;x++)for(let y=1;y<20;y++){const i=wi(x,y,z),id=a[i],fade=y<12?1:(20-y)/8;if(id===B.STONE&&V.Noise.hash3(cx*CS+x,y,cz*CS+z,this.seed+8801)<fade)a[i]=B.DEEPSLATE}stronghold(this,a,cx,cz);dungeon(this,a,cx,cz)}return a};
WP.generateEmberChunk=function(cx,cz){const existed=this.chunkData.has(V.chunkKey(cx,cz)),a=baseNether.call(this,cx,cz);if(!existed){removeFreeGateway(a,cx,cz,'emberdeep');if((cx===2&&cz===0)||a.some(v=>v===B.BRICKS)){for(let i=0;i<a.length;i++)if(a[i]===B.BRICKS)a[i]=B.NETHER_BRICKS;setLocal(a,8,28,8,B.SPAWNER);this.blockEntities[V.blockKey(cx*CS+8,28,cz*CS+8)]={type:'spawner',mob:'blaze',delay:1.5}}}return a};
WP.generateStarChunk=function(cx,cz){const existed=this.chunkData.has(V.chunkKey(cx,cz)),a=baseEnd.call(this,cx,cz);if(!existed){removeFreeGateway(a,cx,cz,'starreach');for(let z=0;z<CS;z++)for(let x=0;x<CS;x++)for(let y=H-2;y>1;y--){const i=wi(x,y,z);if(a[i]===B.GLOWROCK&&a[wi(x,y-1,z)]===B.OBSIDIAN){a[i]=B.END_CRYSTAL;this.blockEntities[V.blockKey(cx*CS+x,y,cz*CS+z)]={type:'end_crystal'};break}}}return a};

/* Fluid queue: source blocks flow down, then out, and recede when unsupported. */
const baseSetBlock=WP.setBlock;
WP.queueFluid=function(x,y,z){this.fluidQueue=this.fluidQueue||new Set();for(const d of [[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])this.fluidQueue.add(V.blockKey(x+d[0],y+d[1],z+d[2]))};
WP.setBlock=function(x,y,z,id,playerChange=true){const old=this.getBlock(x,y,z),ok=baseSetBlock.call(this,x,y,z,id,playerChange);if(!ok)return false;if(id===B.WATER||id===B.LAVA){const k=V.blockKey(Math.floor(x),Math.floor(y),Math.floor(z));if(!this.blockEntities[k]||this.blockEntities[k].type!=='fluid')this.blockEntities[k]={type:'fluid',fluid:id===B.WATER?'water':'lava',source:true,level:0};this.queueFluid(Math.floor(x),Math.floor(y),Math.floor(z))}else if(old===B.WATER||old===B.LAVA||id===B.AIR)this.queueFluid(Math.floor(x),Math.floor(y),Math.floor(z));if(old===B.OBSIDIAN&&id===B.AIR)this.breakNearbyPortal(x,y,z);return true};
WP.breakNearbyPortal=function(x,y,z){for(let yy=y-4;yy<=y+4;yy++)for(let zz=z-4;zz<=z+4;zz++)for(let xx=x-4;xx<=x+4;xx++)if(this.getBlock(xx,yy,zz)===B.EMBER_PORTAL)baseSetBlock.call(this,xx,yy,zz,B.AIR,false)};
WP.tickFluids=function(dt){this.fluidTimer=(this.fluidTimer||0)-dt;if(this.fluidTimer>0)return;this.fluidTimer=.18;this.fluidQueue=this.fluidQueue||new Set();let count=0;for(const key of [...this.fluidQueue]){this.fluidQueue.delete(key);if(count++>72)break;const [x,y,z]=key.split(',').map(Number),id=this.getBlock(x,y,z);if(id!==B.WATER&&id!==B.LAVA)continue;const k=V.blockKey(x,y,z),e=this.blockEntities[k],source=!e||e.source,level=source?0:Math.max(1,e.level||1),speed=id===B.LAVA?2:1;if(id===B.LAVA&&Math.random()>.45)continue;const replaceable=(xx,yy,zz)=>{const q=this.getBlock(xx,yy,zz);return q===B.AIR||q===B.TALL_GRASS||q===B.RED_FLOWER||q===B.GOLD_FLOWER};const place=(xx,yy,zz,l,falling)=>{if(!replaceable(xx,yy,zz))return false;baseSetBlock.call(this,xx,yy,zz,id,false);this.blockEntities[V.blockKey(xx,yy,zz)]={type:'fluid',fluid:id===B.WATER?'water':'lava',source:false,level:l,falling:!!falling};this.queueFluid(xx,yy,zz);return true};
    if(replaceable(x,y-1,z)){place(x,y-1,z,Math.min(7,level+speed),true);continue}
    if(level<7){for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])place(x+dx,y,z+dz,Math.min(7,level+speed),false)}
    if(!source){let min=99;const above=this.getBlock(x,y+1,z);if(above===id)min=0;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(this.getBlock(x+dx,y,z+dz)===id){const ne=this.blockEntities[V.blockKey(x+dx,y,z+dz)],nl=!ne||ne.source?0:ne.level||7;min=Math.min(min,nl)}if(min>=level||min===99){baseSetBlock.call(this,x,y,z,B.AIR,false);delete this.blockEntities[k];this.queueFluid(x,y,z)}}
  }};
WP.raycastFluid=function(origin,dir,maxDist=5,sourceOnly=false){let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z),dist=0;const step=.08;for(let i=0;i<Math.ceil(maxDist/step);i++){const id=this.getBlock(x,y,z);if(id===B.WATER||id===B.LAVA){const ent=this.blockEntities[V.blockKey(x,y,z)],source=!ent||ent.source;if(!sourceOnly||source)return{x,y,z,id,distance:dist,source}}dist+=step;x=Math.floor(origin.x+dir.x*dist);y=Math.floor(origin.y+dir.y*dist);z=Math.floor(origin.z+dir.z*dist)}return null};

/* -------------------------------------------------------------------------
   Portals, eyes, buckets, shield and crystal interactions.
------------------------------------------------------------------------- */
function consumeSelected(game,replacement=null){if(game.mode==='creative')return;const s=game.inventory.selectedStack();if(!s)return;s.count--;if(s.count<=0)game.inventory.slots[game.inventory.selected]=replacement?V.makeStack(replacement,1):null;else if(replacement)game.inventory.insert(V.makeStack(replacement,1))}
function checkFrame(world,x0,y0,z0,axis){for(let w=0;w<4;w++)for(let h=0;h<5;h++){const border=w===0||w===3||h===0||h===4,xx=x0+(axis==='x'?w:0),zz=z0+(axis==='z'?w:0),id=world.getBlock(xx,y0+h,zz);if(border&&id!==B.OBSIDIAN)return false;if(!border&&![B.AIR,B.EMBER_PORTAL].includes(id))return false}return true}
function igniteNetherPortal(world,x,y,z){for(const axis of ['x','z'])for(let o=-3;o<=0;o++)for(let oy=-4;oy<=0;oy++){const x0=x+(axis==='x'?o:0),z0=z+(axis==='z'?o:0),y0=y+oy;if(!checkFrame(world,x0,y0,z0,axis))continue;for(let w=1;w<=2;w++)for(let h=1;h<=3;h++){const xx=x0+(axis==='x'?w:0),zz=z0+(axis==='z'?w:0);baseSetBlock.call(world,xx,y0+h,zz,B.EMBER_PORTAL,false)}return true}return false}
function createDestinationPortal(world){const x0=6,z0=8,y0=19;for(let w=0;w<4;w++)for(let h=0;h<5;h++){const border=w===0||w===3||h===0||h===4;baseSetBlock.call(world,x0+w,y0+h,z0,border?B.OBSIDIAN:B.EMBER_PORTAL,false)}world.markDirty(0,0)}
function portalFrames(world,cx,cz,y){const pts=[];for(let x=cx-2;x<=cx+2;x++)if(x===cx-2||x===cx+2)for(let z=cz-1;z<=cz+1;z++)pts.push([x,y,z]);for(let z=cz-2;z<=cz+2;z++)if(z===cz-2||z===cz+2)for(let x=cx-1;x<=cx+1;x++)pts.push([x,y,z]);return pts}
function activateEndPortal(world,cx,cy,cz){const pts=portalFrames(world,cx,cz,cy);if(!pts.every(p=>world.getBlock(...p)===B.END_PORTAL_FRAME&&world.blockEntities[V.blockKey(...p)]?.eye))return false;for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++)baseSetBlock.call(world,x,cy,z,B.STAR_PORTAL,false);return true}

const GP=V.Game.prototype,
  oldUse=GP.useOrPlace,
  oldFixed=GP.fixedUpdate,
  oldSwitch=GP.switchDimension,
  oldFinish=GP.finishBreak,
  oldBegin=GP.beginBreak,
  oldUpdateTorches=GP.updateTorches;

GP.useOrPlace=function(){
  const s=this.inventory.selectedStack();
  const it=s&&V.Items[s.key];
  const off=this.inventory.offhand;

  // Functional ranged weapons. Bows and crossbows consume arrows unless
  // Creative or Infinity is active. Tridents remain in hand and use durability.
  if(s&&it&&['bow','crossbow','trident'].includes(it.tool)){
    const infinity=V.enchantLevel(s,'infinity');
    const arrowSlot=this.inventory.slots.findIndex(q=>q&&q.key==='arrow'&&q.count>0);
    const needsArrow=it.tool!=='trident';
    if(needsArrow&&this.mode!=='creative'&&!infinity&&arrowSlot<0){this.ui.toast('You need arrows.');return}
    if((this.projectileCooldown||0)>0)return;
    const power=V.enchantLevel(s,'power'),punch=V.enchantLevel(s,'punch'),flame=V.enchantLevel(s,'flame');
    const quick=V.enchantLevel(s,'quick_charge'),multi=V.enchantLevel(s,'multishot'),piercing=V.enchantLevel(s,'piercing');
    const impaling=V.enchantLevel(s,'impaling'),riptide=V.enchantLevel(s,'riptide'),channeling=V.enchantLevel(s,'channeling');
    if(it.tool==='trident'&&riptide&&(this.player.inWater||this.weather==='rain')){
      const launch=this.player.viewDirection().multiplyScalar(7+riptide*2.2);
      this.player.velocity.add(launch);this.player.grounded=false;this.player.fallStart=null;
      this.projectileCooldown=.75;this.visuals.swing('use');this.audio.play('splash');
      if(this.mode!=='creative')this.inventory.damageSelected(1);this.ui.refreshHUD();return;
    }
    const origin=this.player.eyePosition(),baseDir=this.player.viewDirection(),count=it.tool==='crossbow'&&multi?3:1;
    const seen=new Set();
    for(let shot=0;shot<count;shot++){
      const angle=count===1?0:(shot-1)*.085,ca=Math.cos(angle),sa=Math.sin(angle);
      const dir=new THREE.Vector3(baseDir.x*ca-baseDir.z*sa,baseDir.y,baseDir.x*sa+baseDir.z*ca).normalize();
      const block=this.world.raycast(origin,dir,42),reach=block?Math.max(0,block.distance-.04):42;
      let damage=it.tool==='trident'?8+impaling*1.35:it.tool==='crossbow'?6+piercing*.55:4+power*1.15;
      const hit=this.entities.attackRay(origin,dir,reach,damage);
      if(hit&&!seen.has(hit.mob)){seen.add(hit.mob);if(punch)hit.mob.velocity.addScaledVector(dir,punch*2.4);if(flame||channeling&&this.weather!=='clear')hit.mob.fireTime=Math.max(hit.mob.fireTime||0,flame?5:4)}
      const end=origin.clone().addScaledVector(dir,Math.min(reach,18));
      for(let i=1;i<=9;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.025,.025,.16),new THREE.MeshBasicMaterial({color:it.tool==='trident'?0x73d9dc:0xd7d0b2,toneMapped:false}));m.position.copy(origin).lerp(end,i/9);m.lookAt(end);this.scene.add(m);this.particles.push({mesh:m,v:new THREE.Vector3(),life:.12+i*.012})}
    }
    if(needsArrow&&this.mode!=='creative'&&!infinity){const a=this.inventory.slots[arrowSlot];a.count--;if(a.count<=0)this.inventory.slots[arrowSlot]=null}
    if(this.mode!=='creative')this.inventory.damageSelected(1);
    this.projectileCooldown=it.tool==='crossbow'?Math.max(.28,.95-quick*.18):it.tool==='trident'?.7:.42;
    this.visuals.swing('attack');this.audio.play('swing');this.ui.refreshHUD();return;
  }

  // Empty buckets can target fluids because the normal block raycast skips them.
  if(s&&s.key==='bucket'){
    const hit=this.world.raycastFluid(this.player.eyePosition(),this.player.viewDirection(),5,true);
    if(hit){
      const key=V.blockKey(hit.x,hit.y,hit.z);
      const ent=this.world.blockEntities[key];
      const source=!ent||ent.source;
      if(source){
        baseSetBlock.call(this.world,hit.x,hit.y,hit.z,B.AIR,false);
        delete this.world.blockEntities[key];
        this.world.queueFluid(hit.x,hit.y,hit.z);
        consumeSelected(this,hit.id===B.WATER?'water_bucket':'lava_bucket');
        this.audio.play('splash');
        this.ui.toast(hit.id===B.WATER?'Filled Water Bucket':'Filled Lava Bucket');
        this.ui.refreshHUD();
        return;
      }
    }
  }

  if(s&&(s.key==='water_bucket'||s.key==='lava_bucket')){
    const target=this.target;
    if(target){
      const p=target.place;
      const id=s.key==='water_bucket'?B.WATER:B.LAVA;
      if(this.world.getBlock(p.x,p.y,p.z)===B.AIR){
        baseSetBlock.call(this.world,p.x,p.y,p.z,id,false);
        this.world.blockEntities[V.blockKey(p.x,p.y,p.z)]={
          type:'fluid',fluid:id===B.WATER?'water':'lava',source:true,level:0
        };
        this.world.queueFluid(p.x,p.y,p.z);
        consumeSelected(this,'bucket');
        this.audio.play('splash');
        this.ui.refreshHUD();
        return;
      }
    }
  }

  if(s&&s.key==='flint_and_steel'&&this.target){
    if(igniteNetherPortal(this.world,this.target.x,this.target.y,this.target.z)){
      if(this.mode!=='creative')this.inventory.damageSelected(1);
      this.audio.play('place');
      this.ui.toast('Nether portal lit');
      this.ui.refreshHUD();
      return;
    }
  }

  if(s&&s.key==='eye_of_ender'){
    if(this.target&&this.world.getBlock(this.target.x,this.target.y,this.target.z)===B.END_PORTAL_FRAME){
      const key=V.blockKey(this.target.x,this.target.y,this.target.z);
      const entity=this.world.blockEntities[key]||(
        this.world.blockEntities[key]={type:'end_portal_frame',eye:false}
      );
      if(!entity.eye){
        entity.eye=true;
        consumeSelected(this);
        this.audio.play('level');
        const cx=entity.centerX??this.target.x;
        const cz=entity.centerZ??this.target.z;
        if(activateEndPortal(this.world,cx,this.target.y,cz))this.ui.toast('The End portal opens');
        else this.ui.toast('Eye of Ender inserted');
        this.world.markDirty(V.floorDiv(this.target.x,CS),V.floorDiv(this.target.z,CS));
        this.ui.refreshHUD();
        return;
      }
    }

    const loc=this.world.getStrongholdLocation();
    const from=this.player.eyePosition();
    const to=new THREE.Vector3(loc.x,from.y+3,loc.z).sub(from).normalize();
    if(this.entities.throwProjectile){
      this.entities.throwProjectile('eye',from.clone().addScaledVector(this.player.viewDirection(),.7),to);
    }
    consumeSelected(this);
    this.ui.toast(`The Eye drifts toward ${loc.x}, ${loc.z}`);
    this.ui.refreshHUD();
    return;
  }

  if(off&&off.key==='shield'&&(!it||(it.food==null&&it.blockId==null))){
    this.player.blocking=true;
    this.visuals.swing('block');
    return;
  }

  return oldUse.call(this);
};
GP.fixedUpdate=function(dt){oldFixed.call(this,dt);this.world.tickFluids(dt);this.player.blocking=!!(this.mouse.right&&this.inventory.offhand&&this.inventory.offhand.key==='shield');this.updateSpawners(dt);this.updateBossProgression(dt)};
GP.updateSpawners=function(dt){this.spawnerTimer=(this.spawnerTimer||0)-dt;if(this.spawnerTimer>0)return;this.spawnerTimer=1;for(const [k,e] of Object.entries(this.world.blockEntities)){if(e.type!=='spawner')continue;const [x,y,z]=k.split(',').map(Number),d=this.player.position.distanceTo(new THREE.Vector3(x+.5,y+.5,z+.5));if(d>16)continue;e.delay=(e.delay||0)-1;if(e.delay>0)continue;e.delay=5+Math.random()*5;const nearby=this.entities.mobs.filter(m=>m.type===e.mob&&m.position.distanceTo(new THREE.Vector3(x,y,z))<14).length;if(nearby<5)this.entities.spawn(e.mob,x+.5,y+1,z+.5)}};
GP.switchDimension=function(target,instant=false){const from=this.world.dimension,r=oldSwitch.call(this,target,instant);if(target==='emberdeep'&&from==='overworld'){createDestinationPortal(this.world);this.world.queueAround(this.player.position.x,this.player.position.z,true)}if(target==='starreach'&&!this.data.bosses?.dragonDefeated){this.data.bosses=this.data.bosses||{};if(!this.entities.mobs.some(m=>m.type==='ender_dragon'))this.entities.spawn('ender_dragon',8.5,52,8.5)}return r};
GP.updateTorches=function(dt){while(this.torchLights.length<16){const l=new THREE.PointLight(0xffa33a,0,12,2);this.scene.add(l);this.torchLights.push(l)}return oldUpdateTorches.call(this,dt)};
GP.finishBreak=function(t){const id=this.world.getBlock(t.x,t.y,t.z),s=this.inventory.selectedStack(),silk=V.enchantLevel(s,'silk_touch');if(id===B.END_CRYSTAL){baseSetBlock.call(this.world,t.x,t.y,t.z,B.AIR,false);delete this.world.blockEntities[V.blockKey(t.x,t.y,t.z)];for(let i=0;i<24;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:0xe6a6ff,toneMapped:false}));m.position.set(t.x+.5,t.y+.6,t.z+.5);this.scene.add(m);this.particles.push({mesh:m,v:new THREE.Vector3((Math.random()-.5)*10,Math.random()*9,(Math.random()-.5)*10),life:.65})}for(const mob of this.entities.mobs)if(mob.position.distanceTo(new THREE.Vector3(t.x+.5,t.y+.5,t.z+.5))<7)mob.takeDamage(12,new THREE.Vector3(0,1,0));this.player.damage(6,'was caught in an End Crystal blast');return}
  if(silk&&id!==B.AIR&&V.Blocks[id]&&id!==B.BEDROCK){const d=V.Blocks[id],oldDrop=d.drop;d.drop=d.key;try{return oldFinish.call(this,t)}finally{d.drop=oldDrop}}
  if(id===B.GRAVEL&&this.mode!=='creative'&&Math.random()<.12){const d=V.Blocks[id],oldDrop=d.drop;d.drop='flint';try{return oldFinish.call(this,t)}finally{d.drop=oldDrop}}
  return oldFinish.call(this,t)};
GP.beginBreak=function(){const s=this.inventory.selectedStack(),it=s&&V.Items[s.key],sharp=V.enchantLevel(s,'sharpness'),smite=V.enchantLevel(s,'smite'),bane=V.enchantLevel(s,'bane_of_arthropods'),fire=V.enchantLevel(s,'fire_aspect'),sweep=V.enchantLevel(s,'sweeping_edge'),loot=V.enchantLevel(s,'looting');if(!s||!(sharp||smite||bane||fire||sweep||loot))return oldBegin.call(this);const original=this.entities.attackRay;this.entities.attackRay=(o,d,r,damage)=>{let best=damage+sharp*1.2;const hit=original.call(this.entities,o,d,r,best);if(hit){const type=hit.mob.type;if(smite&&['zombie','skeleton','wither_skeleton','wither'].includes(type))hit.mob.takeDamage(smite*2.2,d);if(bane&&type==='spider')hit.mob.takeDamage(bane*2.2,d);if(fire)hit.mob.fireTime=Math.max(hit.mob.fireTime||0,fire*4);hit.mob._looting=loot;if(sweep)for(const m of this.entities.mobs)if(m!==hit.mob&&!m.dead&&m.position.distanceTo(hit.mob.position)<2.4)m.takeDamage(sweep*.8,d)}return hit};try{return oldBegin.call(this)}finally{this.entities.attackRay=original}};

GP.updateBossProgression=function(dt){if(this.world.dimension!=='starreach')return;const dragon=this.entities.mobs.find(m=>m.type==='ender_dragon'&&!m.dead);if(dragon){const crystals=Object.entries(this.world.blockEntities).filter(([,e])=>e.type==='end_crystal').map(([k])=>k.split(',').map(Number)).filter(p=>new THREE.Vector3(...p).distanceTo(dragon.position)<45);if(crystals.length&&dragon.health<dragon.maxHealth)dragon.health=Math.min(dragon.maxHealth,dragon.health+dt*.6)}if(this.data.bosses?.dragonDefeated&&!this.data.bosses.endExitBuilt){this.data.bosses.endExitBuilt=true;for(let z=7;z<=9;z++)for(let x=7;x<=9;x++)baseSetBlock.call(this.world,x,40,z,B.STAR_PORTAL,false);baseSetBlock.call(this.world,24,42,8,B.END_GATEWAY,false);this.ui.chat('The End Gateway has opened.')}};

/* -------------------------------------------------------------------------
   Player: water cushioning, shield blocking and enchantment effects.
------------------------------------------------------------------------- */
const PP=V.Player.prototype,oldEnv=PP.updateEnvironment,oldPlayerUpdate=PP.update,oldDamage=PP.damage;
PP.updateEnvironment=function(dt){const beforeAir=this.air;oldEnv.call(this,dt);if(this.inWater){this.fallStart=null;this.velocity.y=Math.max(this.velocity.y,-3.5);const resp=V.enchantLevel(this.game.inventory.armor.head,'respiration');if(resp&&this.headWater)this.air=Math.min(10,this.air+(beforeAir-this.air)*(resp*.24))}};
PP.update=function(dt){const boots=this.game.inventory.armor.feet,legs=this.game.inventory.armor.legs,depth=V.enchantLevel(boots,'depth_strider'),soul=V.enchantLevel(boots,'soul_speed'),swift=V.enchantLevel(legs,'swift_sneak'),oldSneak=this.sneaking;oldPlayerUpdate.call(this,dt);if(this.inWater&&depth){this.velocity.x*=1+depth*.08;this.velocity.z*=1+depth*.08}const below=this.world.getBlock(Math.floor(this.position.x),Math.floor(this.position.y-.1),Math.floor(this.position.z));if(below===B.ASH&&soul){this.velocity.x*=1+soul*.08;this.velocity.z*=1+soul*.08}if(this.sneaking&&swift){this.velocity.x*=1+swift*.12;this.velocity.z*=1+swift*.12}const frost=V.enchantLevel(boots,'frost_walker');if(frost&&this.grounded)for(let z=-frost;z<=frost;z++)for(let x=-frost;x<=frost;x++){const bx=Math.floor(this.position.x)+x,bz=Math.floor(this.position.z)+z,by=Math.floor(this.position.y)-1;if(this.world.getBlock(bx,by,bz)===B.WATER)baseSetBlock.call(this.world,bx,by,bz,B.ICE,false)}};
const progressionBreakSpeed=GP.breakSpeed;GP.breakSpeed=function(d){let speed=progressionBreakSpeed.call(this,d);if(this.player.inWater&&V.enchantLevel(this.inventory.armor.head,'aqua_affinity'))speed*=5;return speed};
PP.damage=function(n,reason='was defeated',continuous=false){const armour=Object.values(this.game.inventory.armor||{}),text=String(reason||'').toLowerCase();let specific=0;if(/lava|burn|fire/.test(text))specific=armour.reduce((a,s)=>a+V.enchantLevel(s,'fire_protection'),0);else if(/blast|explod|crystal|wither/.test(text))specific=armour.reduce((a,s)=>a+V.enchantLevel(s,'blast_protection'),0);else if(/arrow|projectile|fireball|shot/.test(text))specific=armour.reduce((a,s)=>a+V.enchantLevel(s,'projectile_protection'),0);if(specific)n*=Math.max(.2,1-specific*.06);if(this.blocking&&!continuous&&!/fell|drowned|starved|lava|burned|void/i.test(reason)){const nearest=this.game.entities?.mobs?.filter(m=>!m.dead).sort((a,b)=>a.position.distanceTo(this.position)-b.position.distanceTo(this.position))[0];let front=true;if(nearest){const to=nearest.position.clone().sub(this.position).normalize();front=this.viewDirection().dot(to)>.1}if(front){n*=.2;const sh=this.game.inventory.offhand;if(sh&&sh.key==='shield'&&this.game.mode!=='creative'){const un=V.enchantLevel(sh,'unbreaking');if(!un||Math.random()>un/(un+1)){sh.damage=(sh.damage||0)+1;if(sh.damage>=V.Items.shield.durability){this.game.inventory.offhand=null;this.game.ui.toast('Your shield broke')}}}this.game.audio.play('place');this.velocity.multiplyScalar(.55)}}
  const result=oldDamage.call(this,n,reason,continuous);if(!continuous&&n>0){const thorns=Object.values(this.game.inventory.armor).reduce((a,s)=>a+V.enchantLevel(s,'thorns'),0);if(thorns&&this.game.entities){const m=this.game.entities.mobs.filter(x=>!x.dead).sort((a,b)=>a.position.distanceTo(this.position)-b.position.distanceTo(this.position))[0];if(m&&m.position.distanceTo(this.position)<3)m.takeDamage(Math.max(1,Math.floor(thorns*.7)),this.position.clone().sub(m.position).normalize())}}return result};

/* -------------------------------------------------------------------------
   Extra mobs and bosses. Existing textured mobs remain the default.
------------------------------------------------------------------------- */
function mat(color,emissive=0){return new THREE.MeshLambertMaterial({color,emissive,emissiveIntensity:emissive?.7:0})}
function box(w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=true;m.receiveShadow=true;return m}
class SpecialMob{
  constructor(manager,type,x,y,z){this.manager=manager;this.game=manager.game;this.world=this.game.world;this.type=type;this.position=new THREE.Vector3(x,y,z);this.velocity=new THREE.Vector3();this.age=0;this.hurtTime=0;this.attackTime=0;this.dead=false;this.fireTime=0;this.yaw=0;const cfg={ghast:[4,4,20,2],wither_skeleton:[.62,2.3,20,5],wither:[1.5,3.5,300,8],ender_dragon:[5,3,200,10]}[type];this.width=cfg[0];this.height=cfg[1];this.health=this.maxHealth=cfg[2];this.attackDamage=cfg[3];this.mesh=this.build();this.mesh.userData.entity=this;this.mesh.position.copy(this.position);manager.group.add(this.mesh)}
  build(){const g=new THREE.Group();if(this.type==='ghast'){const body=box(3.4,3.4,3.4,0xe9e9e5);body.position.y=2.2;g.add(body);for(let i=0;i<9;i++){const t=box(.28,2+Math.random()*1.5,.28,0xd7d7d3);t.position.set((i%3-1)*.8,.5,((i/3|0)-1)*.8);g.add(t)}for(const sx of [-1,1]){const eye=box(.35,.45,.08,0x22252a);eye.position.set(sx*.65,2.55,-1.73);g.add(eye)}const mouth=box(.65,.22,.08,0x5a3131);mouth.position.set(0,1.65,-1.73);g.add(mouth)}else if(this.type==='wither_skeleton'){const body=box(.34,.9,.25,0x25272a);body.position.y=1.25;g.add(body);const head=box(.55,.55,.55,0x373a3d);head.position.y=2;g.add(head);for(const s of [-1,1]){const arm=box(.15,.9,.15,0x2b2d30);arm.position.set(s*.38,1.25,0);g.add(arm);const leg=box(.16,.9,.16,0x202225);leg.position.set(s*.14,.45,0);g.add(leg)}}else if(this.type==='wither'){const core=box(1.2,.8,.8,0x25262b);core.position.y=2.1;g.add(core);for(const s of [-1,0,1]){const head=box(.72,.72,.72,s===0?0x18191d:0x32343a);head.position.set(s*.85,2.45,-.15);g.add(head)}for(let i=0;i<6;i++){const rib=box(.18,.18,1.5,0x34363b);rib.position.set((i%3-1)*.35,1.55-(i/3|0)*.4,0);g.add(rib)}}else{const body=box(2.4,1.3,4.2,0x24152f);body.position.y=1.8;g.add(body);const head=box(1.3,1,1.8,0x342044);head.position.set(0,2,-2.6);g.add(head);const neck=box(.8,.8,2.1,0x2c1938);neck.position.set(0,1.9,-1.55);g.add(neck);for(const s of [-1,1]){const wing=box(4.8,.16,2.2,0x3b2150);wing.position.set(s*3,2.1,0);wing.rotation.z=s*.15;g.add(wing)}for(let i=0;i<4;i++){const tail=box(.7-i*.1,.65-i*.08,1.3,0x2b1838);tail.position.set(0,1.8,2.7+i*1.05);g.add(tail)}}return g}
  aabb(){return{minX:this.position.x-this.width/2,maxX:this.position.x+this.width/2,minY:this.position.y,maxY:this.position.y+this.height,minZ:this.position.z-this.width/2,maxZ:this.position.z+this.width/2}}
  update(dt){if(this.dead)return;this.age+=dt;this.hurtTime=Math.max(0,this.hurtTime-dt);this.attackTime-=dt;if(this.fireTime>0){this.fireTime-=dt;if(Math.floor(this.fireTime*2)!==Math.floor((this.fireTime+dt)*2))this.takeDamage(1)}const p=this.game.player,dist=this.position.distanceTo(p.position);if(this.type==='ghast'){this.position.y+=Math.sin(this.age*.8)*dt;this.yaw+=dt*.2;if(dist<32&&this.attackTime<=0){this.attackTime=3;p.damage(6,'was fireballed by a Ghast');this.game.ui.damageFlash()}}else if(this.type==='wither_skeleton'){const d=p.position.clone().sub(this.position);this.yaw=Math.atan2(-d.x,-d.z);this.velocity.x=V.lerp(this.velocity.x,d.normalize().x*2,dt*3);this.velocity.z=V.lerp(this.velocity.z,d.z*2,dt*3);this.position.x+=this.velocity.x*dt;this.position.z+=this.velocity.z*dt;this.position.y=this.world.getSurfaceY(this.position.x,this.position.z);if(dist<1.7&&this.attackTime<=0){this.attackTime=1.1;p.damage(7,'was slain by a Wither Skeleton');p.fireTime=Math.max(p.fireTime,2)}}else if(this.type==='wither'){const target=p.eyePosition();const d=target.clone().sub(this.position);this.position.addScaledVector(d.normalize(),dt*2.3);this.position.y+=Math.sin(this.age*1.8)*dt*.4;if(dist<20&&this.attackTime<=0){this.attackTime=1.6;p.damage(9,'was destroyed by the Wither')}}else{const center=new THREE.Vector3(8,48,8),a=this.age*.18;const target=center.clone().add(new THREE.Vector3(Math.cos(a)*18,4+Math.sin(a*.7)*5,Math.sin(a)*18));if(dist<13&&Math.sin(this.age*.35)>.8)target.copy(p.eyePosition());this.position.addScaledVector(target.sub(this.position).normalize(),dt*5.2);if(dist<3.6&&this.attackTime<=0){this.attackTime=1.4;p.damage(10,'was slain by the Ender Dragon');p.velocity.addScaledVector(p.position.clone().sub(this.position).normalize(),9)}}this.mesh.position.copy(this.position);this.mesh.rotation.y=this.yaw;this.mesh.traverse(o=>{if(o.material&&o.material.color){if(!o.userData.baseColor)o.userData.baseColor=o.material.color.clone?o.material.color.clone():new THREE.Color(o.material.color);if(this.hurtTime>0)o.material.color.set(0xff3939);else if(o.userData.baseColor)o.material.color.copy(o.userData.baseColor)}})}
  takeDamage(n,knock){if(this.dead)return false;this.health-=n;this.hurtTime=.28;if(knock)this.velocity.addScaledVector(knock,3);if(this.health<=0)this.die();return true}
  die(){if(this.dead)return;this.dead=true;this.game.world.data.stats.mobsDefeated++;if(this.type==='ghast')this.manager.drop(V.makeStack('ghast_tear',1),this.position.x,this.position.y,this.position.z);if(this.type==='wither_skeleton'){this.manager.drop(V.makeStack('coal',1),this.position.x,this.position.y,this.position.z);if(Math.random()<.18+.08*(this._looting||0))this.manager.drop(V.makeStack('wither_skeleton_skull',1),this.position.x,this.position.y,this.position.z)}if(this.type==='wither')this.manager.drop(V.makeStack('nether_star',1),this.position.x,this.position.y,this.position.z);if(this.type==='ender_dragon'){this.game.data.bosses=this.game.data.bosses||{};this.game.data.bosses.dragonDefeated=true;this.game.player.xp+=60;this.game.ui.chat('The Ender Dragon has been defeated.')}this.remove()}
  remove(){this.dead=true;this.manager.group.remove(this.mesh);this.manager.mobs=this.manager.mobs.filter(m=>m!==this)}
}
const BaseManager=V.EntityManager;
class ProgressionEntityManager extends BaseManager{
  spawn(type,x,y,z){let m;if(['ghast','wither_skeleton','wither','ender_dragon'].includes(type)){m=new SpecialMob(this,type,x,y,z);this.mobs.push(m)}else m=super.spawn(type,x,y,z);this.decorate(m);return m}
  decorate(m){if(!m||m._progressionDecorated)return;m._progressionDecorated=true;const oldUpdate=m.update.bind(m),oldDie=m.die&&m.die.bind(m);m.update=dt=>{if(m.fireTime>0){m.fireTime-=dt;if(Math.floor(m.fireTime*2)!==Math.floor((m.fireTime+dt)*2))m.takeDamage(1)}oldUpdate(dt);m.mesh&&m.mesh.traverse(o=>{if(!o.material||!o.material.color)return;if(!o.userData.baseColor)o.userData.baseColor=o.material.color.clone?o.material.color.clone():new THREE.Color(o.material.color);if(m.hurtTime>0)o.material.color.set(0xff3b3b);else o.material.color.copy(o.userData.baseColor)})};if(oldDie)m.die=()=>{if(m.dead)return;const before=this.drops.length;oldDie();if(m._looting)for(let i=before;i<this.drops.length;i++)this.drops[i].stack.count+=Math.floor(Math.random()*(m._looting+1))};return m}
  trySpawn(){const dim=this.game.world.dimension;if(dim==='emberdeep'&&this.mobs.length<22){const p=this.game.player,a=Math.random()*Math.PI*2,d=16+Math.random()*20,x=p.position.x+Math.cos(a)*d,z=p.position.z+Math.sin(a)*d,y=this.game.world.getSurfaceY(x,z);const r=Math.random();this.spawn(r<.22?'ghast':r<.55?'wither_skeleton':'blaze',x,y,z);return}return super.trySpawn()}
  throwProjectile(type,pos,dir){if(type!=='eye'&&super.throwProjectile)return super.throwProjectile(type,pos,dir);const mesh=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({map:V.createItemTexture('eye_of_ender',32),transparent:true,toneMapped:false}));mesh.position.copy(pos);this.group.add(mesh);const p={type:'eye',mesh,position:pos.clone(),velocity:dir.clone().normalize().multiplyScalar(7),age:0,update:dt=>{p.age+=dt;p.position.addScaledVector(p.velocity,dt);p.position.y+=Math.sin(p.age*5)*dt*.8;mesh.position.copy(p.position);if(p.age>4){this.group.remove(mesh);this.projectiles=this.projectiles.filter(q=>q!==p)}},remove(){}};this.projectiles=this.projectiles||[];this.projectiles.push(p);return p}
}
V.EntityManager=ProgressionEntityManager;

/* Wither summoning after the third skull is placed. */
function trySummonWither(game,x,y,z){for(const axis of ['x','z'])for(let o=-2;o<=0;o++){const sx=x+(axis==='x'?o:0),sz=z+(axis==='z'?o:0),skulls=[];for(let i=0;i<3;i++)skulls.push([sx+(axis==='x'?i:0),y,sz+(axis==='z'?i:0)]);if(!skulls.every(p=>game.world.getBlock(...p)===B.WITHER_SKULL))continue;const rowY=y-1,center=[sx+(axis==='x'?1:0),rowY,sz+(axis==='z'?1:0)],left=[sx,rowY,sz],right=[sx+(axis==='x'?2:0),rowY,sz+(axis==='z'?2:0)],stem=[center[0],rowY-1,center[2]];if([left,center,right,stem].every(p=>game.world.getBlock(...p)===B.ASH)){for(const p of [...skulls,left,center,right,stem])baseSetBlock.call(game.world,...p,B.AIR,false);game.entities.spawn('wither',center[0]+.5,rowY+1,center[2]+.5);game.ui.chat('The Wither awakens.');return true}}return false}
const oldSet=WP.setBlock;WP.setBlock=function(x,y,z,id,playerChange=true){const ok=oldSet.call(this,x,y,z,id,playerChange);if(ok&&id===B.WITHER_SKULL&&this.game)trySummonWither(this.game,Math.floor(x),Math.floor(y),Math.floor(z));return ok};

/* -------------------------------------------------------------------------
   Third-person armour, shield model and enchanted texture-safe visuals.
------------------------------------------------------------------------- */
const PV=V.PlayerVisuals&&V.PlayerVisuals.prototype;
if(PV){const oldCreateThird=PV.createThirdPerson,oldCreateFirst=PV.createFirstPerson,oldVisualUpdate=PV.update;
  PV.createThirdPerson=function(){oldCreateThird.call(this);this.armourGroup=new THREE.Group();this.thirdPerson.add(this.armourGroup);const mk=(w,h,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.94}));m.castShadow=true;return m};this.armourMeshes={head:mk(.56,.56,.56),chest:mk(.64,.77,.36),legsL:mk(.27,.75,.28),legsR:mk(.27,.75,.28),feetL:mk(.28,.3,.3),feetR:mk(.28,.3,.3)};this.armourMeshes.head.position.y=1.66;this.armourMeshes.chest.position.y=1.05;this.armourMeshes.legsL.position.set(-.16,.36,0);this.armourMeshes.legsR.position.set(.16,.36,0);this.armourMeshes.feetL.position.set(-.16,.15,0);this.armourMeshes.feetR.position.set(.16,.15,0);Object.values(this.armourMeshes).forEach(m=>this.armourGroup.add(m));this.tpShield=new THREE.Mesh(new THREE.BoxGeometry(.55,.72,.08),new THREE.MeshLambertMaterial({map:V.createItemTexture('shield',64),color:0xffffff}));this.tpShield.position.set(0,-.45,-.12);this.leftArm.add(this.tpShield)};
  PV.createFirstPerson=function(){oldCreateFirst.call(this);this.fpShield=new THREE.Mesh(new THREE.BoxGeometry(.62,.82,.09),new THREE.MeshBasicMaterial({map:V.createItemTexture('shield',64),color:0xffffff,toneMapped:false,depthTest:true,depthWrite:true}));this.fpShield.position.set(-.62,-.1,-.52);this.fpShield.rotation.set(-.08,.35,.05);this.firstPerson.add(this.fpShield)};
  PV.update=function(dt){oldVisualUpdate.call(this,dt);const inv=this.game.inventory,arm=inv.armor||{},colour=s=>s&&s.key.startsWith('diamond_')?0x43d8e8:s&&s.key.startsWith('iron_')?0xc7cbd0:s?0x8b5b35:0xffffff;for(const [slot,mesh] of Object.entries(this.armourMeshes||{})){const key=slot.startsWith('legs')?'legs':slot.startsWith('feet')?'feet':slot,stack=arm[key];mesh.visible=!!stack;if(stack)mesh.material.color.set(colour(stack))}const shield=inv.offhand&&inv.offhand.key==='shield';if(this.tpShield)this.tpShield.visible=shield;if(this.fpShield){this.fpShield.visible=shield&&this.game.player.perspective===0;this.fpShield.position.y=this.game.player.blocking?.05:-.42;this.fpShield.rotation.y=this.game.player.blocking?.05:.55}}
}

/* Mending repairs held/equipped items as experience is earned. */
const oldFixedMending=GP.fixedUpdate;GP.fixedUpdate=function(dt){const before=this.player.xp;oldFixedMending.call(this,dt);if(this.player.xp>before){const candidates=[this.inventory.selectedStack(),this.inventory.offhand,...Object.values(this.inventory.armor)].filter(s=>s&&V.enchantLevel(s,'mending')&&(s.damage||0)>0);if(candidates.length){const s=candidates[Math.floor(Math.random()*candidates.length)];s.damage=Math.max(0,(s.damage||0)-Math.ceil((this.player.xp-before)*2))}}};

/* UI safety: glint never changes the icon's absolute positioning. */
const UIP=V.UI.prototype,oldTooltip=UIP.showTooltip,oldHUD=UIP.refreshHUD;
UIP.showTooltip=function(s){oldTooltip.call(this,s);if(this.tooltip&&s&&s.enchants&&s.enchants.length&&!this.tooltip.dataset.progressionEnchants){this.tooltip.dataset.progressionEnchants='1';const existing=this.tooltip.querySelectorAll?Array.from(this.tooltip.querySelectorAll('.enchant-name')).map(e=>e.textContent):[];for(const e of s.enchants){const text=V.enchantDisplay(e);if(!existing.includes(text))this.tooltip.innerHTML+=`<br><span class="enchant-name">${V.escapeHtml(text)}</span>`}}};
UIP.refreshHUD=function(){oldHUD.call(this);const h=this.q('#hotbar');if(h)for(let i=0;i<9;i++){const s=this.app.game.inventory.slots[i],slot=h.children[i];if(slot&&s&&s.enchants?.length)slot.classList.add('enchanted')}};

})();
