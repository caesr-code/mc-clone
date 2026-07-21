(function(){
  'use strict';
  const V=window.Voidlands;
  class StorageManager{
    constructor(){this.worlds=this.loadWorlds();this.settings=this.loadSettings();}
    loadSettings(){try{const saved=JSON.parse(localStorage.getItem(V.SETTINGS_KEY)||'{}'),defaults=V.deepClone(V.DEFAULT_SETTINGS);return Object.assign(defaults,saved,{keybinds:Object.assign({},defaults.keybinds,saved.keybinds||{})})}catch(e){return V.deepClone(V.DEFAULT_SETTINGS)}}
    saveSettings(settings){this.settings=settings;localStorage.setItem(V.SETTINGS_KEY,JSON.stringify(settings));}
    loadWorlds(){try{const v=JSON.parse(localStorage.getItem(V.SAVE_KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
    saveWorlds(){try{localStorage.setItem(V.SAVE_KEY,JSON.stringify(this.worlds));return true}catch(e){console.error('Save failed',e);return false}}
    list(){return this.worlds.slice().sort((a,b)=>(b.lastPlayed||b.created)-(a.lastPlayed||a.created));}
    create(opts){const now=Date.now(),seedText=opts.seed&&String(opts.seed).trim()?String(opts.seed).trim():String(Math.floor(Math.random()*2147483647));const id='world_'+now.toString(36)+'_'+Math.floor(Math.random()*1e6).toString(36);const w={id,name:opts.name||'New World',created:now,lastPlayed:now,version:V.VERSION,seed:seedText,seedNumber:V.hashString(seedText),mode:opts.mode||'survival',difficulty:opts.difficulty||'normal',worldType:opts.worldType||'default',structures:!!opts.structures,bonusChest:!!opts.bonusChest,time:1000,weather:'clear',weatherTime:12000,spawn:null,respawnDimension:'overworld',dimension:'overworld',dimensionPositions:{},dimensionStates:{overworld:{modified:{},blockEntities:{},explored:[]},emberdeep:{modified:{},blockEntities:{},explored:[]},starreach:{modified:{},blockEntities:{},explored:[]}},player:null,inventory:null,modified:{},blockEntities:{},explored:[],entities:[],stats:{blocksMined:0,blocksPlaced:0,distanceWalked:0,playTime:0,mobsDefeated:0,deaths:0,itemsCrafted:0},hardcoreDead:false};this.worlds.push(w);this.saveWorlds();return w;}
    get(id){return this.worlds.find(w=>w.id===id)||null}
    update(world){const i=this.worlds.findIndex(w=>w.id===world.id);if(i>=0)this.worlds[i]=world;else this.worlds.push(world);world.lastPlayed=Date.now();this.saveWorlds();}
    delete(id){this.worlds=this.worlds.filter(w=>w.id!==id);this.saveWorlds();}
    rename(id,name){const w=this.get(id);if(w){w.name=name;this.saveWorlds()}}
    recreate(id,newName){const w=this.get(id);if(!w)return null;return this.create({name:newName||w.name+' Copy',seed:w.seed,mode:w.mode,difficulty:w.difficulty,worldType:w.worldType,structures:w.structures,bonusChest:w.bonusChest})}
  }
  V.StorageManager=StorageManager;
})();
