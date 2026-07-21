(function(){
'use strict';
const V=window.Voidlands=window.Voidlands||{};
const listeners=new Map(),commands=new Map(),mods=[],texturePainters=new Map();
function emit(name,payload){let cancelled=false;for(const fn of listeners.get(name)||[]){try{if(fn(payload)===false)cancelled=true}catch(err){console.error('[Voidlands mod event]',name,err)}}return !cancelled}
function paintTexture(ctx,name,ox,oy,size){const fn=texturePainters.get(name);if(!fn)return false;ctx.save&&ctx.save();try{fn({ctx,x:ox,y:oy,size,fill(color,x=0,y=0,w=size,h=size){ctx.fillStyle=color;ctx.fillRect(ox+x,oy+y,w,h)}})}finally{ctx.restore&&ctx.restore()}return true}
const API=V.ModAPI={
  apiVersion:'1.1',mods,commands,
  register(meta){const m=Object.assign({id:'mod-'+(mods.length+1),name:'Unnamed Mod',version:'1.0.0',author:'Unknown'},meta||{});if(mods.some(x=>x.id===m.id))throw new Error(`Duplicate mod id: ${m.id}`);mods.push(m);console.info(`[Voidlands] Loaded mod: ${m.name} ${m.version}`);return m},
  on(name,fn){if(typeof fn!=='function')return()=>{};if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return()=>listeners.get(name).delete(fn)},
  emit,
  command(name,fn){const key=String(name).replace(/^\//,'').toLowerCase();if(!key||typeof fn!=='function')throw new Error('command(name, handler) requires a command name and function');commands.set(key,fn);return fn},
  addCommand(name,fn){return API.command(name,fn)},
  addTexture(name,painter){if(!name||typeof painter!=='function')throw new Error('addTexture(name, painter) requires a painter function');texturePainters.set(String(name),painter);return String(name)},
  addItem(key,def){V.Items[key]=Object.assign({key,name:key,maxStack:64,category:'materials',icon:key},def||{});V.iconCache={};return V.Items[key]},
  addBlock(key,def={}){let id=def.id;if(id==null){id=Math.max(1,V.Blocks.length);while(V.Blocks[id])id++}if(id>254)throw new Error('Voidlands block IDs must be below 255');const texture=def.texture||key,block=Object.assign({id,key,name:key,solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:1,tool:'any',requiresTool:false,minTier:0,drop:key,maxStack:64,sound:'stone',textures:[texture,texture,texture,texture,texture,texture],placeable:true},def);V.Blocks[id]=block;V.BlockByKey[key]=block;if(block.placeable&&!V.Items[key])API.addItem(key,{name:block.name,category:'blocks',blockId:id,maxStack:block.maxStack,icon:block.textures[2]||key});return block},
  addRecipe(recipe){V.Recipes.push(recipe);return recipe},
  getGame(){return window.voidlandsApp&&window.voidlandsApp.game||null},
  toast(text){const g=API.getGame();if(g&&g.ui)g.ui.toast(String(text))},
  chat(text){const g=API.getGame();if(g&&g.ui)g.ui.chat(String(text))},
  isMultiplayer(){const g=API.getGame();return !!(g&&g.multiplayer&&g.multiplayer.connected)}
};

/* Add custom 16x16 textures before a world atlas is built. */
const previousAtlas=V.createTextureAtlas,previousTileCanvas=V.createTileCanvas;
if(previousAtlas){V.createTextureAtlas=function(){const base=previousAtlas.call(this);if(!texturePainters.size)return base;const cols=base.cols||8,tile=base.tile||16;let next=Object.keys(V.TextureIndex).length;for(const name of texturePainters.keys())if(V.TextureIndex[name]==null)V.TextureIndex[name]=next++;const rows=Math.ceil(next/cols),canvas=document.createElement('canvas');canvas.width=cols*tile;canvas.height=rows*tile;const ctx=canvas.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(base.canvas,0,0);for(const name of texturePainters.keys()){const i=V.TextureIndex[name];paintTexture(ctx,name,(i%cols)*tile,Math.floor(i/cols)*tile,tile)}const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;if('encoding'in texture&&THREE.sRGBEncoding)texture.encoding=THREE.sRGBEncoding;const oldGet=V.getUV;V.getUV=function(name){if(texturePainters.has(name)){const i=V.TextureIndex[name],x=i%cols,y=Math.floor(i/cols),pad=.0015;return{u0:x/cols+pad,u1:(x+1)/cols-pad,v0:1-(y+1)/rows+pad,v1:1-y/rows-pad}}return oldGet(name)};return{texture,canvas,cols,rows,tile}}}
if(previousTileCanvas){V.createTileCanvas=function(name,size=64){if(!texturePainters.has(name))return previousTileCanvas.call(this,name,size);const small=document.createElement('canvas');small.width=small.height=16;paintTexture(small.getContext('2d',{alpha:true}),name,0,0,16);const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,16,16,0,0,size,size);return canvas}}

if(V.Game){
  const oldChat=V.Game.prototype.handleChat;V.Game.prototype.handleChat=function(text){if(text&&text[0]==='/'){const parts=text.slice(1).trim().split(/\s+/),name=(parts.shift()||'').toLowerCase(),fn=commands.get(name);if(fn){try{const result=fn({game:this,args:parts,api:API});if(result!=null)this.ui.chat(String(result))}catch(err){this.ui.chat(`Mod command error: ${err.message||err}`)}return}}return oldChat.call(this,text)};
  const oldInit=V.Game.prototype.initialize;V.Game.prototype.initialize=async function(){const r=await oldInit.call(this);emit('gameStart',{game:this});return r};
  const oldTick=V.Game.prototype.fixedUpdate;V.Game.prototype.fixedUpdate=function(dt){const r=oldTick.call(this,dt);emit('tick',{game:this,dt});return r};
  const oldUse=V.Game.prototype.useOrPlace;V.Game.prototype.useOrPlace=function(){const stack=this.inventory&&this.inventory.selectedStack&&this.inventory.selectedStack(),payload={game:this,stack,item:stack&&V.Items[stack.key],handled:false};if(!emit('beforeUseItem',payload)||payload.handled)return payload.result;const result=oldUse.call(this);emit('afterUseItem',{...payload,result});return result}
}
if(V.Player){const oldDamage=V.Player.prototype.damage;V.Player.prototype.damage=function(amount,source){const event={player:this,game:this.game,amount,source,cancelled:false};if(!emit('beforePlayerDamage',event)||event.cancelled)return false;const result=oldDamage.call(this,event.amount,event.source);emit('afterPlayerDamage',{...event,result});return result}}
if(V.World){const oldSet=V.World.prototype.setBlock;V.World.prototype.setBlock=function(x,y,z,id,playerChange){const before=this.getBlock(x,y,z),event={world:this,x,y,z,before,after:id,playerChange:playerChange!==false,cancelled:false};if(!emit('beforeBlockChange',event)||event.cancelled)return false;const ok=oldSet.call(this,x,y,z,event.after,playerChange);if(ok&&before!==event.after)emit('blockChange',{...event});return ok}}
if(V.EntityManager){const oldSpawn=V.EntityManager.prototype.spawn;V.EntityManager.prototype.spawn=function(type,x,y,z){const event={manager:this,type,x,y,z,cancelled:false};if(!emit('beforeMobSpawn',event)||event.cancelled)return null;const mob=oldSpawn.call(this,event.type,event.x,event.y,event.z);emit('mobSpawn',{...event,mob});return mob}}

function addModsCard(){const panel=document.querySelector('.mods-panel');if(!panel||panel.querySelector('.external-mod-card'))return;const card=document.createElement('div');card.className='mod-card external-mod-card';const list=mods.length?mods.map(m=>`${V.escapeHtml(m.name)} ${V.escapeHtml(m.version)}`).join(' · '):'No external mods enabled';card.innerHTML=`<div class="external-mod-icon">JS</div><div class="mod-copy"><div class="mod-title-row"><h2>External Mods</h2><b>${mods.length} LOADED</b></div><p>${list}</p><small>Add JavaScript files to <code>mods/</code> and list them in <code>mods/manifest.js</code>. Every multiplayer participant should run the same mod list. Only install code from people you trust.</small></div>`;panel.appendChild(card)}
const list=Array.isArray(window.VOIDLANDS_EXTERNAL_MODS)?window.VOIDLANDS_EXTERNAL_MODS:[];
if(document.readyState==='loading')for(const path of list){const safe=String(path).replace(/["'<>]/g,'');document.write(`<script src="${safe}"><\/script>`)}else for(const path of list){const script=document.createElement('script');script.src=path;script.async=false;document.head.appendChild(script)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addModsCard);else setTimeout(addModsCard,0);
})();
