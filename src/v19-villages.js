(function(){
'use strict';
const V=window.Voidlands,B=V.B,CS=V.CHUNK_SIZE,H=V.WORLD_HEIGHT;
V.VERSION='1.9.0';

/* -------------------------------------------------------------------------
   Pick Block: Minecraft-style middle click in Creative and Survival.
------------------------------------------------------------------------- */
const GP=V.Game.prototype;
GP.pickBlock=function(){
  if(!this.target)return false;
  const def=V.Blocks[this.target.id],key=def&&def.key,item=key&&V.Items[key];
  if(!item){this.ui.toast('That block cannot be picked.');return false}
  let slot=this.inventory.slots.findIndex((s,i)=>i<9&&s&&s.key===key);
  if(slot<0&&this.mode!=='creative'){
    const inventorySlot=this.inventory.slots.findIndex((s,i)=>i>=9&&s&&s.key===key);
    if(inventorySlot>=0){
      slot=this.inventory.selected;
      const held=this.inventory.slots[slot];
      this.inventory.slots[slot]=this.inventory.slots[inventorySlot];
      this.inventory.slots[inventorySlot]=held;
    }
  }
  if(slot<0&&this.mode==='creative'){
    slot=this.inventory.selected;
    this.inventory.slots[slot]=V.makeStack(key,item.maxStack||64);
  }
  if(slot<0){this.ui.toast(`${item.name} is not in your inventory.`);return false}
  this.inventory.setSelected(slot);this.ui.refreshHUD();this.ui.selectedName();this.audio.play('menu');return true;
};
if(typeof document!=='undefined')document.addEventListener('auxclick',e=>{if(e.button===1&&e.target&&e.target.id==='gameCanvas')e.preventDefault()},true);

/* -------------------------------------------------------------------------
   Emeralds and village trades.
------------------------------------------------------------------------- */
if(!V.Items.emerald)V.Items.emerald={key:'emerald',name:'Emerald',maxStack:64,category:'materials',icon:'emerald'};
const oldItemCanvas=V.createItemCanvas;
V.createItemCanvas=function(key,size=32){
  if(key!=='emerald')return oldItemCanvas(key,size);
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{alpha:true});x.imageSmoothingEnabled=false;
  x.clearRect(0,0,16,16);x.fillStyle='#143d2c';x.fillRect(6,1,4,2);x.fillRect(4,3,8,10);x.fillRect(6,13,4,2);x.fillStyle='#1da860';x.fillRect(5,4,6,8);x.fillStyle='#58e891';x.fillRect(6,3,4,8);x.fillStyle='#b3ffd0';x.fillRect(7,4,2,5);x.fillStyle='#0a6b43';x.fillRect(5,10,6,2);
  const out=document.createElement('canvas');out.width=out.height=size;const o=out.getContext('2d',{alpha:true});o.imageSmoothingEnabled=false;o.drawImage(c,0,0,16,16,0,0,size,size);return out;
};
V.iconCache={};

const VILLAGER_TRADES={
  farmer:[
    {give:['sun_berry',12],get:['emerald',1]},
    {give:['emerald',1],get:['bread',4]},
    {give:['emerald',3],get:['cooked_meat',5]}
  ],
  blacksmith:[
    {give:['coal',12],get:['emerald',1]},
    {give:['emerald',4],get:['iron_pickaxe',1]},
    {give:['emerald',7],get:['iron_sword',1]},
    {give:['emerald',10],extra:['diamond',2],get:['diamond_sword',1]}
  ]
};
function itemLabel(pair){const it=V.Items[pair[0]];return `${pair[1]} × ${it?it.name:pair[0]}`}
function ensureTradeUI(){
  if(typeof document==='undefined'||document.querySelector('#villagerTradeScreen'))return;
  const host=document.querySelector('#uiRoot')||document.body,section=document.createElement('section');
  section.id='villagerTradeScreen';section.className='screen overlay-screen villager-trade-screen';
  section.innerHTML='<div class="villager-trade-window"><header><div><small id="villagerProfession">VILLAGER</small><h2 id="villagerTradeTitle">Village Trading</h2></div><button id="villagerTradeClose" aria-label="Close">×</button></header><p id="villagerTradeHint">Choose a trade.</p><div id="villagerTradeList"></div><div class="trade-inventory-summary" id="villagerTradeInventory"></div></div>';
  host.appendChild(section);
  section.querySelector('#villagerTradeClose').addEventListener('click',()=>{const g=window.voidlandsApp&&window.voidlandsApp.game;if(g&&g.closeVillagerTrade)g.closeVillagerTrade()});
  section.querySelector('#villagerTradeList').addEventListener('click',e=>{const b=e.target.closest('[data-villager-trade]'),g=window.voidlandsApp&&window.voidlandsApp.game;if(b&&g)g.performVillagerTrade(Number(b.dataset.villagerTrade))});
  const style=document.createElement('style');style.textContent=`
  .villager-trade-screen{background:rgba(5,8,12,.76);align-items:center;justify-content:center}.villager-trade-window{width:min(680px,92vw);max-height:82vh;overflow:auto;background:#c9b995;color:#241d14;border:4px solid #3b2e20;box-shadow:0 0 0 4px #8c7956,0 20px 60px #000;padding:18px}.villager-trade-window header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #746343;margin-bottom:14px}.villager-trade-window h2{margin:2px 0 12px}.villager-trade-window small{font-weight:900;color:#5c3f22;letter-spacing:.16em}.villager-trade-window #villagerTradeClose{width:42px;height:42px;font-size:28px}.villager-trade-list{display:grid;gap:10px}.villager-trade{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding:12px;background:#7d6c4d;border:3px solid #3c3021;color:#fff;text-align:left}.villager-trade:hover,.villager-trade:focus{background:#96815b}.villager-trade:disabled{filter:grayscale(.8);opacity:.55}.villager-trade .trade-arrow{font-size:24px}.villager-trade .trade-item{display:flex;align-items:center;gap:9px;font-weight:800}.villager-trade .trade-icon{width:36px;height:36px;background-size:100% 100%;image-rendering:pixelated}.trade-inventory-summary{margin-top:12px;padding-top:10px;border-top:2px solid #746343;font-size:13px;font-weight:700}`;document.head.appendChild(style);
}
GP.openVillagerTrade=function(mob){
  ensureTradeUI();this.clearInput(true);this.paused=true;this.state='villager_trade';this.activeVillager=mob;if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();
  this.ui.qa('.screen').forEach(x=>x.classList.remove('active'));const screen=document.querySelector('#villagerTradeScreen');if(screen)screen.classList.add('active');this.renderVillagerTrade();
};
GP.closeVillagerTrade=function(){this.activeVillager=null;this.resume()};
GP.renderVillagerTrade=function(){
  const mob=this.activeVillager;if(!mob)return;const profession=mob.profession==='blacksmith'?'blacksmith':'farmer',trades=VILLAGER_TRADES[profession];
  const title=document.querySelector('#villagerTradeTitle'),label=document.querySelector('#villagerProfession'),list=document.querySelector('#villagerTradeList'),summary=document.querySelector('#villagerTradeInventory');
  if(title)title.textContent=profession==='blacksmith'?'Blacksmith Trading':'Village Trading';if(label)label.textContent=profession.toUpperCase();
  if(list){list.className='villager-trade-list';list.innerHTML=trades.map((t,i)=>{const requirements=[t.give].concat(t.extra?[t.extra]:[]),ready=requirements.every(p=>this.inventory.count(p[0])>=p[1]);const give=requirements.map(p=>`<span class="trade-item"><i class="trade-icon" style="background-image:${V.itemIcon(p[0])}"></i>${V.escapeHtml(itemLabel(p))}</span>`).join('<b> + </b>');return `<button class="villager-trade" data-villager-trade="${i}" ${ready?'':'disabled'}><span>${give}</span><span class="trade-arrow">➜</span><span class="trade-item"><i class="trade-icon" style="background-image:${V.itemIcon(t.get[0])}"></i>${V.escapeHtml(itemLabel(t.get))}</span></button>`}).join('')}
  if(summary)summary.textContent=`Emeralds: ${this.inventory.count('emerald')} · Coal: ${this.inventory.count('coal')} · Iron: ${this.inventory.count('iron_ingot')} · Diamonds: ${this.inventory.count('diamond')}`;
};
GP.performVillagerTrade=function(index){
  const mob=this.activeVillager;if(!mob)return;const profession=mob.profession==='blacksmith'?'blacksmith':'farmer',trade=VILLAGER_TRADES[profession][index];if(!trade)return;
  const req=[trade.give].concat(trade.extra?[trade.extra]:[]);if(!req.every(p=>this.inventory.count(p[0])>=p[1])){this.ui.toast('You do not have the required items.');this.renderVillagerTrade();return}
  req.forEach(p=>this.inventory.remove(p[0],p[1]));const result=this.inventory.insert(V.makeStack(trade.get[0],trade.get[1]));if(result.remaining){const inserted=trade.get[1]-result.remaining.count;if(inserted>0)this.inventory.remove(trade.get[0],inserted);req.forEach(p=>this.inventory.insert(V.makeStack(p[0],p[1])));this.ui.toast('Make room in your inventory first.')}else{this.audio.play('level');this.ui.toast(`Traded for ${itemLabel(trade.get)}`)}this.ui.refreshHUD();this.renderVillagerTrade();
};
const oldKeyDown=GP.keyDown;
GP.keyDown=function(e){if(this.state==='villager_trade'){e.preventDefault();if(e.code==='Escape'||this.matchesBinding(e.code,this.settings.keybinds.inventory))this.closeVillagerTrade();return}return oldKeyDown.call(this,e)};

/* -------------------------------------------------------------------------
   Deterministic multi-chunk villages and blacksmith forges.
------------------------------------------------------------------------- */
const idx=(x,y,z)=>y*CS*CS+z*CS+x;
function setInChunk(a,cx,cz,wx,y,wz,id){if(y<=0||y>=H)return;const lx=wx-cx*CS,lz=wz-cz*CS;if(lx>=0&&lx<CS&&lz>=0&&lz<CS)a[idx(lx,y,lz)]=id}
function getInChunk(a,cx,cz,wx,y,wz){const lx=wx-cx*CS,lz=wz-cz*CS;if(lx<0||lx>=CS||lz<0||lz>=CS||y<0||y>=H)return B.AIR;return a[idx(lx,y,lz)]}
function clearColumn(a,cx,cz,wx,wz,y,height=6){for(let yy=y;yy<Math.min(H,y+height);yy++)setInChunk(a,cx,cz,wx,yy,wz,B.AIR)}
function levelGround(a,cx,cz,wx,wz,y,top=B.GRASS){for(let yy=1;yy<y-1;yy++){const cur=getInChunk(a,cx,cz,wx,yy,wz);if(cur===B.AIR||cur===B.WATER)setInChunk(a,cx,cz,wx,yy,wz,yy<y-4?B.STONE:B.DIRT)}setInChunk(a,cx,cz,wx,y-1,wz,top);clearColumn(a,cx,cz,wx,wz,y,8)}
function boxShell(a,cx,cz,x0,y0,z0,x1,y1,z1,wall,air=true){for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const shell=x===x0||x===x1||z===z0||z===z1||y===y0||y===y1;setInChunk(a,cx,cz,x,y,z,shell?wall:(air?B.AIR:getInChunk(a,cx,cz,x,y,z)))}}
function pitchedRoof(a,cx,cz,x,z,y,w,d,roof=B.PLANKS){
  const layers=Math.ceil((w+2)/2);
  for(let layer=0;layer<layers;layer++){
    const left=x-1+layer,right=x+w-layer,yy=y+4+layer;
    if(left>right)break;
    for(let zz=z-1;zz<=z+d;zz++){
      setInChunk(a,cx,cz,left,yy,zz,roof);
      if(right!==left)setInChunk(a,cx,cz,right,yy,zz,roof);
      if(right-left<=2)for(let xx=left;xx<=right;xx++)setInChunk(a,cx,cz,xx,yy,zz,layer===layers-1?B.SLAB:roof);
    }
    // Filled triangular gables prevent the front and rear from looking sliced off.
    for(let xx=left+1;xx<right;xx++){
      setInChunk(a,cx,cz,xx,yy,z,roof);
      setInChunk(a,cx,cz,xx,yy,z+d-1,roof);
    }
  }
}
function house(a,world,cx,cz,x,z,y,w=7,d=6,villageId=''){
  for(let zz=z;zz<z+d;zz++)for(let xx=x;xx<x+w;xx++)levelGround(a,cx,cz,xx,zz,y,B.COBBLE);
  for(let yy=y;yy<=y+3;yy++)for(let zz=z;zz<z+d;zz++)for(let xx=x;xx<x+w;xx++){const edge=xx===x||xx===x+w-1||zz===z||zz===z+d-1;if(edge)setInChunk(a,cx,cz,xx,yy,zz,(xx===x||xx===x+w-1)&&(zz===z||zz===z+d-1)?B.LOG:B.PLANKS)}
  for(let xx=x+1;xx<x+w-1;xx++){setInChunk(a,cx,cz,xx,y+2,z,B.GLASS);setInChunk(a,cx,cz,xx,y+2,z+d-1,B.GLASS)}
  const doorX=x+Math.floor(w/2);setInChunk(a,cx,cz,doorX,y,z,B.DOOR);setInChunk(a,cx,cz,doorX,y+1,z,B.AIR);
  pitchedRoof(a,cx,cz,x,z,y,w,d,B.PLANKS);
  setInChunk(a,cx,cz,x+1,y+2,z+1,B.TORCH);
  // Every village home has a small, deterministic supply chest instead of empty decoration.
  const chestX=x+w-2,chestZ=z+d-2;setInChunk(a,cx,cz,chestX,y,chestZ,B.CHEST);
  const roll=V.Noise.hash3(chestX,y,chestZ,world.seed+1931),chestKey=V.blockKey(chestX,y,chestZ);
  if(!world.blockEntities[chestKey])world.blockEntities[chestKey]={type:'chest',villageId,homeLoot:true,slots:Array.from({length:27},(_,i)=>i===0?V.makeStack('bread',2+Math.floor(roll*4)):i===1?V.makeStack('sun_berry',4+Math.floor(roll*5)):i===2&&roll>.35?V.makeStack('coal',2+Math.floor(roll*4)):i===3&&roll>.68?V.makeStack('emerald',1):null)};
}

function blacksmith(a,world,cx,cz,x,z,y,villageId){
  const w=10,d=7;for(let zz=z;zz<z+d;zz++)for(let xx=x;xx<x+w;xx++)levelGround(a,cx,cz,xx,zz,y,B.COBBLE);
  for(let yy=y;yy<=y+3;yy++)for(let zz=z;zz<z+d;zz++)for(let xx=x;xx<x+w;xx++){const edge=xx===x||xx===x+w-1||zz===z||zz===z+d-1;if(edge)setInChunk(a,cx,cz,xx,yy,zz,(yy===y||yy===y+1)?B.COBBLE:B.PLANKS)}
  // A complete shallow workshop roof with overhang and raised ridge replaces the old clipped slab cap.
  for(let zz=z-1;zz<=z+d;zz++)for(let xx=x-1;xx<=x+w;xx++)setInChunk(a,cx,cz,xx,y+4,zz,B.SLAB);
  for(let zz=z;zz<z+d;zz++)for(let xx=x+2;xx<=x+w-3;xx++)setInChunk(a,cx,cz,xx,y+5,zz,B.PLANKS);
  for(let zz=z-1;zz<=z+d;zz++)setInChunk(a,cx,cz,x+Math.floor(w/2),y+6,zz,B.SLAB);
  setInChunk(a,cx,cz,x+4,y,z,B.DOOR);setInChunk(a,cx,cz,x+4,y+1,z,B.AIR);setInChunk(a,cx,cz,x+2,y,z+2,B.FURNACE);setInChunk(a,cx,cz,x+7,y,z+4,B.CHEST);setInChunk(a,cx,cz,x+2,y+2,z,B.GLASS);setInChunk(a,cx,cz,x+7,y+2,z+d-1,B.GLASS);
  const chestKey=V.blockKey(x+7,y,z+4);if(!world.blockEntities[chestKey])world.blockEntities[chestKey]={type:'chest',villageId,slots:Array.from({length:27},(_,i)=>i===0?V.makeStack('iron_ingot',3):i===1?V.makeStack('bread',4):i===2?V.makeStack('obsidian',2):i===3&&V.Noise.hash3(x,y,z,world.seed+1919)>.72?V.makeStack('diamond',1):null)};
  const forgeX=x+w+1,forgeZ=z+2;for(let zz=forgeZ-1;zz<=forgeZ+2;zz++)for(let xx=forgeX-1;xx<=forgeX+2;xx++)levelGround(a,cx,cz,xx,zz,y,B.COBBLE);
  for(let zz=forgeZ-1;zz<=forgeZ+2;zz++)for(let xx=forgeX-1;xx<=forgeX+2;xx++)if(xx===forgeX-1||xx===forgeX+2||zz===forgeZ-1||zz===forgeZ+2)setInChunk(a,cx,cz,xx,y,zz,B.COBBLE);
  for(let zz=forgeZ;zz<=forgeZ+1;zz++)for(let xx=forgeX;xx<=forgeX+1;xx++){setInChunk(a,cx,cz,xx,y,zz,B.LAVA);world.blockEntities[V.blockKey(xx,y,zz)]={type:'fluid',fluid:'lava',source:true,level:0,villageForge:true}}
  setInChunk(a,cx,cz,forgeX-1,y+1,forgeZ-1,B.TORCH);setInChunk(a,cx,cz,forgeX+2,y+1,forgeZ+2,B.TORCH);
}
function well(a,world,cx,cz,x,z,y,villageId){
  for(let zz=z-2;zz<=z+2;zz++)for(let xx=x-2;xx<=x+2;xx++)levelGround(a,cx,cz,xx,zz,y,B.COBBLE);
  for(let zz=z-1;zz<=z+1;zz++)for(let xx=x-1;xx<=x+1;xx++){const edge=xx===x-1||xx===x+1||zz===z-1||zz===z+1;setInChunk(a,cx,cz,xx,y,zz,edge?B.COBBLE:B.WATER);if(!edge)world.blockEntities[V.blockKey(xx,y,zz)]={type:'fluid',fluid:'water',source:true,level:0}}
  for(const [px,pz] of [[x-2,z-2],[x+2,z-2],[x-2,z+2],[x+2,z+2]])for(let yy=y;yy<=y+3;yy++)setInChunk(a,cx,cz,px,yy,pz,B.LOG);
  for(let zz=z-3;zz<=z+3;zz++)for(let xx=x-3;xx<=x+3;xx++)setInChunk(a,cx,cz,xx,y+4,zz,B.SLAB);
  const marker=V.blockKey(x,y+1,z);if(!world.blockEntities[marker])world.blockEntities[marker]={type:'village_marker',id:villageId,x,y:y+1,z,residents:[{dx:-7,dz:-6,profession:'farmer'},{dx:7,dz:7,profession:'librarian'},{dx:-10,dz:8,profession:'cleric'},{dx:13,dz:-8,profession:'blacksmith'},{dx:4,dz:13,profession:'butcher'},{dx:-14,dz:-2,profession:'cartographer'}],golem:{dx:2,dz:-4}};
}
function farm(a,cx,cz,x,z,y){for(let zz=z;zz<z+8;zz++)for(let xx=x;xx<x+10;xx++){levelGround(a,cx,cz,xx,zz,y,B.DIRT);if(xx===x+4||xx===x+5){setInChunk(a,cx,cz,xx,y-1,zz,B.WATER)}else if((xx+zz)%2===0)setInChunk(a,cx,cz,xx,y,zz,B.GOLD_FLOWER)}}
function findPrimaryVillage(world){
  if(world._primaryVillage)return world._primaryVillage;
  const angle=(world.seed%360)*Math.PI/180;for(let r=4;r<=10;r++)for(let step=0;step<12;step++){const a=angle+step/12*Math.PI*2,cx=Math.round(Math.cos(a)*r),cz=Math.round(Math.sin(a)*r),wx=cx*CS+8,wz=cz*CS+8,biome=world.terrainInfo(wx,wz).biome;if(['plains','scrub','forest'].includes(biome))return world._primaryVillage={cx,cz,x:wx,z:wz}}
  return world._primaryVillage={cx:6,cz:6,x:6*CS+8,z:6*CS+8};
}
function regionVillage(world,rx,rz){const h=V.Noise.hash3(rx,193,rz,world.seed+1901);if(h<.76)return null;const cx=rx*14+2+Math.floor(h*9),cz=rz*14+2+Math.floor(V.Noise.hash3(rx,197,rz,world.seed+1907)*9),x=cx*CS+8,z=cz*CS+8;if(!['plains','scrub'].includes(world.terrainInfo(x,z).biome))return null;return{cx,cz,x,z}}
function centersNear(world,cx,cz){const result=[findPrimaryVillage(world)],seen=new Set();for(let rz=Math.floor((cz-3)/14);rz<=Math.floor((cz+3)/14);rz++)for(let rx=Math.floor((cx-3)/14);rx<=Math.floor((cx+3)/14);rx++){const c=regionVillage(world,rx,rz);if(c)result.push(c)}return result.filter(c=>{const k=c.cx+','+c.cz;if(seen.has(k))return false;seen.add(k);return Math.abs(cx-c.cx)<=2&&Math.abs(cz-c.cz)<=2})}
function buildVillage(world,a,cx,cz,c){
  const y=V.clamp(world.terrainInfo(c.x,c.z).height+1,V.SEA_LEVEL+2,H-12),id=`village:${c.cx},${c.cz}`;
  for(let d=-24;d<=24;d++)for(let w=-1;w<=1;w++){levelGround(a,cx,cz,c.x+d,c.z+w,y,B.GRAVEL);levelGround(a,cx,cz,c.x+w,c.z+d,y,B.GRAVEL)}
  well(a,world,cx,cz,c.x,c.z,y,id);house(a,world,cx,cz,c.x-18,c.z-15,y,8,7,id);house(a,world,cx,cz,c.x+8,c.z+9,y,8,7,id);house(a,world,cx,cz,c.x-17,c.z+9,y,7,6,id);blacksmith(a,world,cx,cz,c.x+8,c.z-15,y,id);farm(a,cx,cz,c.x-5,c.z+12,y);
}
const WP=V.World.prototype,oldGenerate=WP.generateChunkData;
WP.getPrimaryVillageLocation=function(){const c=findPrimaryVillage(this);return{x:c.x,y:this.terrainInfo(c.x,c.z).height+1,z:c.z,cx:c.cx,cz:c.cz}};
WP.generateChunkData=function(cx,cz){const a=oldGenerate.call(this,cx,cz);if(this.dimension==='overworld'&&this.data.structures&&a&&!a.__v19Villages){for(const c of centersNear(this,cx,cz))buildVillage(this,a,cx,cz,c);a.__v19Villages=true}return a};

/* -------------------------------------------------------------------------
   Villager entities: original pixel textures, professions and persistence.
------------------------------------------------------------------------- */
function texture(colors,apron){const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d',{alpha:true});x.fillStyle=colors[0];x.fillRect(0,0,16,16);for(let i=0;i<28;i++){const h=V.Noise.hash3(i,17,31,V.hashString(colors.join(','))),px=Math.floor(h*233)%16,py=Math.floor(h*719)%16;x.fillStyle=colors[1+Math.floor(h*3)%3];x.fillRect(px,py,1+(h>.86),1)}if(apron){x.fillStyle=apron;x.fillRect(3,6,10,8);x.fillStyle='rgba(255,255,255,.22)';x.fillRect(4,7,2,6)}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t}
const villagerTex={skin:texture(['#b77e58','#d49b72','#8e5b42','#efbd90']),robe:texture(['#6f4c35','#8d6448','#4d3427','#b07d56']),smith:texture(['#312d2c','#4d4745','#1e1b1a','#706763'],'#33251d')};
function mat(tex){return new THREE.MeshLambertMaterial({map:tex,color:0xffffff})}
function vbox(w,h,d,tex){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(tex));m.castShadow=true;m.receiveShadow=true;return m}
function villagerMesh(profession){const g=new THREE.Group(),parts={};parts.body=vbox(.55,.78,.34,profession==='blacksmith'?villagerTex.smith:villagerTex.robe);parts.body.position.y=1.05;g.add(parts.body);parts.head=vbox(.52,.52,.52,villagerTex.skin);parts.head.position.y=1.68;g.add(parts.head);const nose=vbox(.16,.22,.16,villagerTex.skin);nose.position.set(0,1.61,-.34);g.add(nose);const brow=vbox(.34,.06,.04,villagerTex.robe);brow.position.set(0,1.79,-.268);g.add(brow);parts.legs=[];for(const s of [-1,1]){const leg=vbox(.2,.72,.22,villagerTex.robe);leg.position.set(s*.13,.36,0);g.add(leg);parts.legs.push(leg)}const arms=vbox(.68,.2,.22,profession==='blacksmith'?villagerTex.smith:villagerTex.robe);arms.position.set(0,1.05,-.28);arms.rotation.x=-.35;g.add(arms);if(profession==='blacksmith'){const apron=vbox(.46,.48,.04,villagerTex.smith);apron.position.set(0,.94,-.195);g.add(apron)}g.userData.parts=parts;return g}
function disposeMesh(mesh){if(!mesh)return;mesh.traverse(o=>{if(o.geometry&&o.geometry.dispose)o.geometry.dispose();if(o.material&&o.material.dispose)o.material.dispose()})}
function convertVillager(manager,m,profession,villageId){
  manager.group.remove(m.mesh);disposeMesh(m.mesh);m.type=profession==='blacksmith'?'blacksmith_villager':'villager';m.profession=profession;m.villageId=villageId||null;m.cfg={width:.58,height:1.95,health:20,speed:.9,xp:0,passive:true};m.width=.58;m.height=1.95;m.health=m.maxHealth=20;m.speed=.9;m.attackDamage=0;m.aggro=false;m.mesh=villagerMesh(profession);m.parts=m.mesh.userData.parts;m.mesh.userData.entity=m;m.mesh.position.copy(m.position);manager.group.add(m.mesh);m.die=function(){if(this.dead)return;this.dead=true;this.game.world.data.stats.mobsDefeated++;this.game.ui.toast('The village has lost a resident.');this.remove()};return m;
}
const CurrentManager=V.EntityManager;
class VillageEntityManager extends CurrentManager{
  constructor(game){super(game);this.villageScanTimer=.3}
  spawn(type,x,y,z){if(type==='villager'||type==='blacksmith_villager'){const m=super.spawn('pig',x,y,z);return convertVillager(this,m,type==='blacksmith_villager'?'blacksmith':'farmer',null)}return super.spawn(type,x,y,z)}
  spawnVillageResident(marker,resident,index){const x=marker.x+resident.dx+.5,z=marker.z+resident.dz+.5,y=this.game.world.getSurfaceY(x,z),type=resident.profession==='blacksmith'?'blacksmith_villager':'villager',m=this.spawn(type,x,y,z);m.villageId=marker.id;m.villageResidentIndex=index;m.profession=resident.profession;return m}
  ensureVillageResidents(){if(this.game.world.dimension!=='overworld')return;const p=this.game.player.position;for(const e of Object.values(this.game.world.blockEntities)){if(!e||e.type!=='village_marker')continue;const dist=Math.hypot(e.x-p.x,e.z-p.z);if(dist>64)continue;(e.residents||[]).forEach((r,i)=>{if(!this.mobs.some(m=>!m.dead&&m.villageId===e.id&&m.villageResidentIndex===i))this.spawnVillageResident(e,r,i)})}}
  update(dt){super.update(dt);this.villageScanTimer-=dt;if(this.villageScanTimer<=0){this.villageScanTimer=1.5;this.ensureVillageResidents()}}
  findVillagerRay(origin,dir,maxDist=4.8){let best=null,bestT=maxDist;for(const m of this.mobs){if(m.dead||!['villager','blacksmith_villager'].includes(m.type))continue;const a=m.aabb(),t=this.rayAABB(origin,dir,{minX:a.minX-.12,maxX:a.maxX+.12,minY:a.minY,maxY:a.maxY+.15,minZ:a.minZ-.12,maxZ:a.maxZ+.12},bestT);if(t!=null){best=m;bestT=t}}return best?{mob:best,distance:bestT}:null}
  serialize(){return super.serialize().map(e=>{const m=this.mobs.find(q=>!q.dead&&q.type===e.type&&Math.abs(q.position.x-e.x)<.01&&Math.abs(q.position.z-e.z)<.01);if(m&&m.villageId){e.villageId=m.villageId;e.villageResidentIndex=m.villageResidentIndex;e.profession=m.profession}return e})}
  load(list){for(const e of list||[]){const m=this.spawn(e.type,e.x,e.y,e.z);m.health=e.health||m.maxHealth;if(e.villageId){m.villageId=e.villageId;m.villageResidentIndex=e.villageResidentIndex;m.profession=e.profession||m.profession}}}
}
V.EntityManager=VillageEntityManager;

const oldUseOrPlace=GP.useOrPlace;
GP.useOrPlace=function(){const origin=this.player.eyePosition(),dir=this.player.viewDirection(),villager=this.entities.findVillagerRay&&this.entities.findVillagerRay(origin,dir,4.8),block=this.world.raycast(origin,dir,4.8);if(villager&&(!block||villager.distance<block.distance)){this.visuals.swing('use');this.audio.play('passive');this.openVillagerTrade(villager.mob);return}return oldUseOrPlace.call(this)};

/* Keep old saves compatible and make the new village location discoverable. */
const oldDebug=GP.debugUpdate;
GP.debugUpdate=function(fps){oldDebug.call(this,fps);if(!this.debug||this.world.dimension!=='overworld')return;const el=document.querySelector('#debugOverlay'),v=this.world.getPrimaryVillageLocation();if(el&&!el.textContent.includes('Nearest village'))el.textContent+=`\nNearest village ${v.x}, ${v.z}`};

ensureTradeUI();
})();
