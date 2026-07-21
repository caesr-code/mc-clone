(function(){
  'use strict';
  const V=window.Voidlands;
  const Recipes=[
    {type:'shapeless',in:{log:1},out:['planks',4]},
    {type:'shaped',shape:['P','P'],map:{P:'planks'},out:['stick',4]},
    {type:'shaped',shape:['PP','PP'],map:{P:'planks'},out:['crafting_table',1]},
    {type:'shaped',shape:['PPP','P P','PPP'],map:{P:'planks'},out:['chest',1]},
    {type:'shaped',shape:['CCC','C C','CCC'],map:{C:'cobble'},out:['furnace',1]},
    {type:'shaped',shape:['C','S'],map:{C:'coal',S:'stick'},out:['torch',4]},
    {type:'shaped',shape:['WWW','PPP'],map:{W:'wool',P:'planks'},out:['bed',1]},
    {type:'shaped',shape:['PP','PP','PP'],map:{P:'planks'},out:['door',3]},
    {type:'shaped',shape:['P  ','PP ','PPP'],map:{P:'planks'},out:['stairs',4]},
    {type:'shaped',shape:['PPP'],map:{P:'planks'},out:['slab',6]},
    {type:'shaped',shape:['BB','BB'],map:{B:'brick_item'},out:['bricks',1]},
    {type:'shaped',shape:['PPP',' S ',' S '],map:{P:'planks',S:'stick'},out:['wood_pickaxe',1]},
    {type:'shaped',shape:['CCC',' S ',' S '],map:{C:'cobble',S:'stick'},out:['stone_pickaxe',1]},
    {type:'shaped',shape:['III',' S ',' S '],map:{I:'iron_ingot',S:'stick'},out:['iron_pickaxe',1]},
    {type:'shaped',shape:['GGG',' S ',' S '],map:{G:'gold_ingot',S:'stick'},out:['gold_pickaxe',1]},
    {type:'shaped',shape:['LLL',' S ',' S '],map:{L:'lumen_crystal',S:'stick'},out:['lumen_pickaxe',1]},
    {type:'shaped',shape:['PP','PS',' S'],map:{P:'planks',S:'stick'},out:['wood_axe',1]},
    {type:'shaped',shape:['CC','CS',' S'],map:{C:'cobble',S:'stick'},out:['stone_axe',1]},
    {type:'shaped',shape:['II','IS',' S'],map:{I:'iron_ingot',S:'stick'},out:['iron_axe',1]},
    {type:'shaped',shape:['GG','GS',' S'],map:{G:'gold_ingot',S:'stick'},out:['gold_axe',1]},
    {type:'shaped',shape:['LL','LS',' S'],map:{L:'lumen_crystal',S:'stick'},out:['lumen_axe',1]},
    {type:'shaped',shape:['P','S','S'],map:{P:'planks',S:'stick'},out:['wood_shovel',1]},
    {type:'shaped',shape:['C','S','S'],map:{C:'cobble',S:'stick'},out:['stone_shovel',1]},
    {type:'shaped',shape:['I','S','S'],map:{I:'iron_ingot',S:'stick'},out:['iron_shovel',1]},
    {type:'shaped',shape:['G','S','S'],map:{G:'gold_ingot',S:'stick'},out:['gold_shovel',1]},
    {type:'shaped',shape:['L','S','S'],map:{L:'lumen_crystal',S:'stick'},out:['lumen_shovel',1]},
    {type:'shaped',shape:['P','P','S'],map:{P:'planks',S:'stick'},out:['wood_sword',1]},
    {type:'shaped',shape:['C','C','S'],map:{C:'cobble',S:'stick'},out:['stone_sword',1]},
    {type:'shaped',shape:['I','I','S'],map:{I:'iron_ingot',S:'stick'},out:['iron_sword',1]},
    {type:'shaped',shape:['G','G','S'],map:{G:'gold_ingot',S:'stick'},out:['gold_sword',1]},
    {type:'shaped',shape:['L','L','S'],map:{L:'lumen_crystal',S:'stick'},out:['lumen_sword',1]},
    {type:'shaped',shape:['HHH','H H'],map:{H:'hide'},out:['leather_cap',1]},
    {type:'shaped',shape:['H H','HHH','HHH'],map:{H:'hide'},out:['leather_tunic',1]},
    {type:'shaped',shape:['HHH','H H','H H'],map:{H:'hide'},out:['leather_leggings',1]},
    {type:'shaped',shape:['H H','H H'],map:{H:'hide'},out:['leather_boots',1]},
    {type:'shaped',shape:['III','I I'],map:{I:'iron_ingot'},out:['iron_helmet',1]},
    {type:'shaped',shape:['I I','III','III'],map:{I:'iron_ingot'},out:['iron_chestplate',1]},
    {type:'shaped',shape:['III','I I','I I'],map:{I:'iron_ingot'},out:['iron_leggings',1]},
    {type:'shaped',shape:['I I','I I'],map:{I:'iron_ingot'},out:['iron_boots',1]},
    {type:'shaped',shape:['BBB'],map:{B:'sun_berry'},out:['bread',1]},
    {type:'shapeless',in:{snow:1},out:['water_bucket',1]},
    {type:'shapeless',in:{gravel:4},out:['cobble',1]},
    {type:'shapeless',in:{cobble:1},out:['gravel',1]},
    {type:'shaped',shape:['OOO','OCO','OOO'],map:{O:'obsidian',C:'lumen_crystal'},out:['rift_frame',4]},
    {type:'shaped',shape:['EEE','EEE'],map:{E:'emberstone'},out:['bricks',2]},
    {type:'shapeless',in:{cinder_shard:1,stick:1},out:['torch',4]},
    {type:'shapeless',in:{sky_stone:4},out:['cobble',4]},
    {type:'shaped',shape:['AAA',' A ','AAA'],map:{A:'astral_crystal'},out:['glowrock',4]}
  ];
  const Smelts={raw_iron:['iron_ingot',1],raw_gold:['gold_ingot',1],sand:['glass',1],cobble:['stone',1],raw_meat:['cooked_meat',1],clay:['brick_item',1],log:['coal',1]};
  V.Recipes=Recipes;V.Smelts=Smelts;

  V.recipeIngredients=function(r){const out={};if(r.type==='shapeless'){for(const [k,n] of Object.entries(r.in))out[k]=(out[k]||0)+n}else{for(const row of r.shape)for(const ch of row){if(ch===' ')continue;const k=r.map[ch];out[k]=(out[k]||0)+1}}return out};

  function emptyArray(n){return Array.from({length:n},()=>null)}
  function trimPattern(grid,size){let minX=size,minY=size,maxX=-1,maxY=-1;for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(grid[y*size+x]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}if(maxX<0)return{w:0,h:0,cells:[]};const cells=[];for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)cells.push(grid[y*size+x]?grid[y*size+x].key:null);return{w:maxX-minX+1,h:maxY-minY+1,cells}}
  function recipePattern(r){const rows=r.shape,w=Math.max(...rows.map(s=>s.length)),h=rows.length,cells=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=(rows[y]||'')[x]||' ';cells.push(ch===' '?null:r.map[ch])}return{w,h,cells}}
  function matchRecipe(grid,size){const non=grid.filter(Boolean);if(!non.length)return null;for(const r of Recipes){if(r.type==='shapeless'){const counts={};non.forEach(s=>counts[s.key]=(counts[s.key]||0)+1);const keys=Object.keys(counts),req=Object.keys(r.in);if(keys.length===req.length&&req.every(k=>counts[k]===r.in[k]))return r;}else{const a=trimPattern(grid,size),b=recipePattern(r);if(a.w===b.w&&a.h===b.h&&a.cells.every((v,i)=>v===b.cells[i]))return r;const mirrored=[];for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++)mirrored.push(b.cells[y*b.w+(b.w-1-x)]);if(a.w===b.w&&a.h===b.h&&a.cells.every((v,i)=>v===mirrored[i]))return r;}}
    return null;
  }

  class Inventory{
    constructor(data,mode='survival'){
      this.mode=mode;this.slots=emptyArray(36);this.armor={head:null,chest:null,legs:null,feet:null};this.offhand=null;this.craft=emptyArray(4);this.tableCraft=emptyArray(9);this.cursor=null;this.selected=0;this.openType='player';this.openData=null;this.furnace=null;this.chestSlots=null;
      if(data)this.load(data);else this.seedStarter();
    }
    seedStarter(){if(this.mode==='creative'){this.slots[0]=V.makeStack('stone',64);this.slots[1]=V.makeStack('grass',64);this.slots[2]=V.makeStack('planks',64);this.slots[3]=V.makeStack('glass',64);this.slots[4]=V.makeStack('torch',64);this.slots[5]=V.makeStack('water_bucket',1);this.slots[6]=V.makeStack('stone_pickaxe',1);this.slots[7]=V.makeStack('stone_sword',1);this.slots[8]=V.makeStack('cooked_meat',32)}else{this.slots[0]=V.makeStack('sun_berry',4)}}
    load(d){this.slots=(d.slots||emptyArray(36)).map(V.stackClone);while(this.slots.length<36)this.slots.push(null);this.armor=Object.assign({head:null,chest:null,legs:null,feet:null},d.armor||{});for(const k in this.armor)this.armor[k]=V.stackClone(this.armor[k]);this.offhand=V.stackClone(d.offhand);this.selected=d.selected||0;}
    serialize(){return{slots:this.slots.map(V.stackClone),armor:Object.fromEntries(Object.entries(this.armor).map(([k,v])=>[k,V.stackClone(v)])),offhand:V.stackClone(this.offhand),selected:this.selected}}
    hotbar(i){return this.slots[i]}
    selectedStack(){return this.slots[this.selected]}
    setSelected(i){this.selected=V.mod(i,9)}
    count(key){return this.slots.reduce((n,s)=>n+(s&&s.key===key?s.count:0),0)}
    insert(stack){if(!stack)return{inserted:0,remaining:null};const original=Math.max(0,stack.count||0),remain=V.stackClone(stack);for(let i=0;i<this.slots.length&&remain.count>0;i++){const s=this.slots[i];if(V.canMerge(s,remain)&&s.count<V.itemMax(s)){const n=Math.min(remain.count,V.itemMax(s)-s.count);s.count+=n;remain.count-=n}}for(let i=0;i<this.slots.length&&remain.count>0;i++)if(!this.slots[i]){const n=Math.min(remain.count,V.itemMax(remain));this.slots[i]=V.stackClone(remain);this.slots[i].count=n;remain.count-=n}return{inserted:original-remain.count,remaining:remain.count>0?remain:null}}
    add(stack){return !this.insert(stack).remaining}
    remove(key,count){for(let i=0;i<this.slots.length&&count>0;i++){const s=this.slots[i];if(s&&s.key===key){const n=Math.min(count,s.count);s.count-=n;count-=n;if(s.count<=0)this.slots[i]=null}}return count<=0}
    damageSelected(amount=1){const s=this.selectedStack(),it=s&&V.Items[s.key];if(!s||!it||!it.durability)return false;s.damage=(s.damage||0)+amount;if(s.damage>=it.durability){this.slots[this.selected]=null;return true}return false}
    armourPoints(){let n=0;for(const s of Object.values(this.armor)){const it=s&&V.Items[s.key];if(it)n+=it.armour||0}return n}
    open(type,data){this.openType=type;this.openData=data||null;if(type==='crafting')this.tableCraft=emptyArray(9);if(type==='chest')this.chestSlots=data.slots;if(type==='furnace')this.furnace=data;}
    close(){this.returnCraftItems();if(this.cursor)this.add(this.cursor);this.cursor=null;this.openType='player';this.openData=null;this.chestSlots=null;this.furnace=null;}
    returnCraftItems(){for(const arr of [this.craft,this.tableCraft])for(let i=0;i<arr.length;i++)if(arr[i]){this.add(arr[i]);arr[i]=null}}
    craftGrid(){return this.openType==='crafting'?this.tableCraft:this.craft}
    craftSize(){return this.openType==='crafting'?3:2}
    output(){const r=matchRecipe(this.craftGrid(),this.craftSize());return r?V.makeStack(r.out[0],r.out[1]):null}
    consumeRecipe(){const r=matchRecipe(this.craftGrid(),this.craftSize());if(!r)return null;if(this.game&&this.game.data&&this.game.data.stats)this.game.data.stats.itemsCrafted=(this.game.data.stats.itemsCrafted||0)+r.out[1];const g=this.craftGrid();for(let i=0;i<g.length;i++)if(g[i]){g[i].count--;if(g[i].count<=0)g[i]=null}return V.makeStack(r.out[0],r.out[1])}
    slotRef(group,index){if(group==='inv')return{get:()=>this.slots[index],set:v=>this.slots[index]=v};if(group==='craft')return{get:()=>this.craft[index],set:v=>this.craft[index]=v};if(group==='table')return{get:()=>this.tableCraft[index],set:v=>this.tableCraft[index]=v};if(group==='chest')return{get:()=>this.chestSlots[index],set:v=>this.chestSlots[index]=v};if(group==='furnace'){const key=['input','fuel','output'][index];return{get:()=>this.furnace[key],set:v=>this.furnace[key]=v}}if(group==='armor'){const key=['head','chest','legs','feet'][index];return{get:()=>this.armor[key],set:v=>this.armor[key]=v,accept:s=>s&&V.Items[s.key].armourSlot===key}}if(group==='offhand')return{get:()=>this.offhand,set:v=>this.offhand=v};return null}
    click(group,index,button=0,shift=false){
      if(group==='output'){const out=this.output();if(!out)return;if(shift){let loops=0;while(this.output()&&loops++<64){const made=this.consumeRecipe();if(!this.add(made))break}}else{if(this.cursor&&!V.canMerge(this.cursor,out))return;if(this.cursor&&this.cursor.count+out.count>V.itemMax(out))return;const made=this.consumeRecipe();if(this.cursor)this.cursor.count+=made.count;else this.cursor=made}return;}
      const ref=this.slotRef(group,index);if(!ref)return;let slot=ref.get();
      if(shift&&slot){if(group==='inv'){const it=V.Items[slot.key];if(it.armourSlot&&!this.armor[it.armourSlot]){this.armor[it.armourSlot]=slot;ref.set(null);return}const target=index<9?Array.from({length:27},(_,i)=>i+9):Array.from({length:9},(_,i)=>i);this.transferTo(slot,ref,target.map(i=>this.slotRef('inv',i)));}else{this.transferTo(slot,ref,this.slots.map((_,i)=>this.slotRef('inv',i)));}return;}
      if(button===2){if(!this.cursor&&slot){const n=Math.ceil(slot.count/2);this.cursor=V.stackClone(slot);this.cursor.count=n;slot.count-=n;if(slot.count<=0)ref.set(null);return}if(this.cursor){if(ref.accept&&!ref.accept(this.cursor))return;if(!slot){const one=V.stackClone(this.cursor);one.count=1;ref.set(one);this.cursor.count--;}else if(V.canMerge(slot,this.cursor)&&slot.count<V.itemMax(slot)){slot.count++;this.cursor.count--;}if(this.cursor.count<=0)this.cursor=null;}return;}
      if(!this.cursor&&slot){this.cursor=slot;ref.set(null);return}if(this.cursor){if(ref.accept&&!ref.accept(this.cursor))return;if(!slot){ref.set(this.cursor);this.cursor=null;return}if(V.canMerge(slot,this.cursor)&&slot.count<V.itemMax(slot)){const n=Math.min(this.cursor.count,V.itemMax(slot)-slot.count);slot.count+=n;this.cursor.count-=n;if(this.cursor.count<=0)this.cursor=null;return}ref.set(this.cursor);this.cursor=slot;}
    }
    transferTo(slot,from,targets){for(const ref of targets){const t=ref.get();if(V.canMerge(t,slot)&&t.count<V.itemMax(t)){const n=Math.min(slot.count,V.itemMax(t)-t.count);t.count+=n;slot.count-=n;if(slot.count<=0){from.set(null);return}}}for(const ref of targets)if(!ref.get()){ref.set(slot);from.set(null);return}}
    canCraftRecipe(r){const need=V.recipeIngredients(r);return Object.entries(need).every(([k,n])=>this.count(k)>=n)}
    fillRecipe(r){const size=this.craftSize(),grid=this.craftGrid();this.returnCraftItems();const pat=r.type==='shaped'?recipePattern(r):null;if(r.type==='shaped'&&(pat.w>size||pat.h>size))return{ok:false,message:'Use a crafting table for this recipe.'};const need=V.recipeIngredients(r);if(!Object.entries(need).every(([k,n])=>this.count(k)>=n))return{ok:false,message:'You do not have all required ingredients.'};for(const [k,n] of Object.entries(need))this.remove(k,n);if(r.type==='shapeless'){let i=0;for(const [k,n] of Object.entries(r.in))for(let j=0;j<n;j++)grid[i++]=V.makeStack(k,1)}else{for(let y=0;y<pat.h;y++)for(let x=0;x<pat.w;x++){const k=pat.cells[y*pat.w+x];if(k)grid[y*size+x]=V.makeStack(k,1)}}return{ok:true}}
    canPlaceCursorAt(group,index){const ref=this.slotRef(group,index);if(!ref||!this.cursor||group==='output'||group==='creative')return false;const slot=ref.get();if(ref.accept&&!ref.accept(this.cursor))return false;return !slot||(V.canMerge(slot,this.cursor)&&slot.count<V.itemMax(slot))}
    beginCursorDrag(group,index,button=0,creativeKey=null){if(this.cursor)return{ready:true,fromCursor:true};if(creativeKey){this.creativeTake(creativeKey,button);return{ready:!!this.cursor,fromCursor:false}}const ref=this.slotRef(group,index);if(!ref||!ref.get()||group==='output')return{ready:false,fromCursor:false};this.click(group,index,button,false);return{ready:!!this.cursor,fromCursor:false}}
    placeCursorOne(group,index){const ref=this.slotRef(group,index);if(!ref||!this.cursor||group==='output')return false;let slot=ref.get();if(ref.accept&&!ref.accept(this.cursor))return false;if(!slot){const one=V.stackClone(this.cursor);one.count=1;ref.set(one);this.cursor.count--;if(this.cursor.count<=0)this.cursor=null;return true}if(V.canMerge(slot,this.cursor)&&slot.count<V.itemMax(slot)){slot.count++;this.cursor.count--;if(this.cursor.count<=0)this.cursor=null;return true}return false}
    distributeCursor(targets){if(!this.cursor||!targets.length)return 0;const unique=[],seen=new Set();for(const t of targets){const k=t.group+':'+t.index;if(!seen.has(k)&&t.group!=='output'&&t.group!=='creative'){seen.add(k);unique.push(t)}}const valid=unique.filter(t=>{const ref=this.slotRef(t.group,t.index);if(!ref)return false;const slot=ref.get();return(!ref.accept||ref.accept(this.cursor))&&(!slot||V.canMerge(slot,this.cursor)&&slot.count<V.itemMax(slot))});if(!valid.length)return 0;let placed=0,remaining=this.cursor.count;while(remaining>0){let progress=false;for(const t of valid){if(remaining<=0)break;const ref=this.slotRef(t.group,t.index),slot=ref.get();if(slot&&slot.count>=V.itemMax(slot))continue;if(!slot){const one=V.stackClone(this.cursor);one.count=1;ref.set(one)}else slot.count++;remaining--;placed++;progress=true}if(!progress)break}this.cursor.count=remaining;if(this.cursor.count<=0)this.cursor=null;return placed}
    creativeTake(key,button){const s=V.makeStack(key,button===2?1:V.Items[key].maxStack);if(!this.cursor)this.cursor=s;else if(V.canMerge(this.cursor,s))this.cursor.count=Math.min(V.itemMax(s),this.cursor.count+s.count);else this.cursor=s;}
  }
  V.Inventory=Inventory;
})();
