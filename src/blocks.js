(function(){
  'use strict';
  const V=window.Voidlands;
  const B={AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,GRAVEL:5,LOG:6,PLANKS:7,LEAVES:8,GLASS:9,WATER:10,LAVA:11,COAL_ORE:12,IRON_ORE:13,GOLD_ORE:14,LUMEN_ORE:15,BEDROCK:16,SNOW:17,CRAFTING_TABLE:18,FURNACE:19,CHEST:20,TORCH:21,DOOR:22,STAIRS:23,SLAB:24,COBBLE:25,RED_FLOWER:26,GOLD_FLOWER:27,TALL_GRASS:28,CACTUS:29,ICE:30,OBSIDIAN:31,CLAY:32,BRICKS:33,BED:34,WOOL:35,EMBERSTONE:36,ASH:37,GLOWROCK:38,EMBER_ORE:39,SKY_STONE:40,SKY_GRASS:41,STAR_CRYSTAL_ORE:42,RIFT_FRAME:43,EMBER_PORTAL:44,STAR_PORTAL:45};
  V.B=B;
  const defs=[];
  function block(id,key,name,opts){defs[id]=Object.assign({id,key,name,solid:true,opaque:true,transparent:false,fluid:false,cutout:false,hardness:1,tool:'any',requiresTool:false,minTier:0,drop:key,maxStack:64,sound:'stone',textures:[key,key,key,key,key,key],placeable:true},opts||{});}
  block(B.AIR,'air','Air',{solid:false,opaque:false,placeable:false,drop:null});
  block(B.GRASS,'grass','Grass Block',{hardness:.7,sound:'grass',textures:['grass_side','grass_side','grass_top','dirt','grass_side','grass_side']});
  block(B.DIRT,'dirt','Dirt',{hardness:.55,sound:'dirt'});
  block(B.STONE,'stone','Stone',{hardness:1.8,tool:'pickaxe',requiresTool:true,minTier:1,drop:'cobble'});
  block(B.SAND,'sand','Sand',{hardness:.5,sound:'sand'});
  block(B.GRAVEL,'gravel','Gravel',{hardness:.65,sound:'gravel'});
  block(B.LOG,'log','Windwood Log',{hardness:1.2,tool:'axe',sound:'wood',textures:['log_side','log_side','log_top','log_top','log_side','log_side']});
  block(B.PLANKS,'planks','Windwood Planks',{hardness:1.1,tool:'axe',sound:'wood'});
  block(B.LEAVES,'leaves','Windwood Leaves',{solid:true,opaque:false,transparent:true,cutout:true,hardness:.25,sound:'grass'});
  block(B.GLASS,'glass','Clear Glass',{opaque:false,transparent:true,cutout:true,hardness:.3,sound:'glass',drop:null});
  block(B.WATER,'water','Water',{solid:false,opaque:false,transparent:true,fluid:true,hardness:999,placeable:true,drop:'water_bucket',maxStack:1,sound:'water'});
  block(B.LAVA,'lava','Lava',{solid:false,opaque:false,transparent:true,fluid:true,hardness:999,placeable:true,drop:'lava_bucket',maxStack:1,sound:'lava'});
  block(B.COAL_ORE,'coal_ore','Coal Ore',{hardness:2.1,tool:'pickaxe',requiresTool:true,minTier:1,drop:'coal'});
  block(B.IRON_ORE,'iron_ore','Iron Ore',{hardness:2.4,tool:'pickaxe',requiresTool:true,minTier:2,drop:'raw_iron'});
  block(B.GOLD_ORE,'gold_ore','Gold Ore',{hardness:2.7,tool:'pickaxe',requiresTool:true,minTier:2,drop:'raw_gold'});
  block(B.LUMEN_ORE,'lumen_ore','Lumen Crystal Ore',{hardness:3.2,tool:'pickaxe',requiresTool:true,minTier:3,drop:'lumen_crystal'});
  block(B.BEDROCK,'bedrock','Bedrock',{hardness:999999,drop:null});
  block(B.SNOW,'snow','Snow Block',{hardness:.3,sound:'snow'});
  block(B.CRAFTING_TABLE,'crafting_table','Crafting Table',{hardness:1.4,tool:'axe',sound:'wood',textures:['craft_side','craft_side','craft_top','planks','craft_side','craft_side'],interact:'crafting'});
  block(B.FURNACE,'furnace','Stone Furnace',{hardness:2.4,tool:'pickaxe',requiresTool:true,minTier:1,textures:['furnace_side','furnace_side','furnace_top','furnace_top','furnace_front','furnace_side'],interact:'furnace'});
  block(B.CHEST,'chest','Windwood Chest',{hardness:1.5,tool:'axe',sound:'wood',textures:['chest_side','chest_side','chest_top','chest_top','chest_front','chest_side'],interact:'chest'});
  block(B.TORCH,'torch','Ember Torch',{solid:false,opaque:false,transparent:true,cutout:true,hardness:.05,sound:'wood',emission:1,maxStack:64});
  block(B.DOOR,'door','Windwood Door',{solid:true,opaque:false,transparent:true,cutout:true,hardness:1.1,tool:'axe',sound:'wood'});
  block(B.STAIRS,'stairs','Windwood Stairs',{hardness:1.1,tool:'axe',sound:'wood'});
  block(B.SLAB,'slab','Windwood Slab',{hardness:1.1,tool:'axe',sound:'wood'});
  block(B.COBBLE,'cobble','Cobblestone',{hardness:1.6,tool:'pickaxe',requiresTool:true,minTier:1});
  block(B.RED_FLOWER,'red_flower','Ember Bloom',{solid:false,opaque:false,transparent:true,cutout:true,hardness:.05,sound:'grass'});
  block(B.GOLD_FLOWER,'gold_flower','Sunbell',{solid:false,opaque:false,transparent:true,cutout:true,hardness:.05,sound:'grass'});
  block(B.TALL_GRASS,'tall_grass','Tall Grass',{solid:false,opaque:false,transparent:true,cutout:true,hardness:.02,sound:'grass',drop:null});
  block(B.CACTUS,'cactus','Dune Cactus',{hardness:.5,sound:'grass'});
  block(B.ICE,'ice','Frosted Ice',{opaque:false,transparent:true,cutout:true,hardness:.5,sound:'glass'});
  block(B.OBSIDIAN,'obsidian','Nightglass',{hardness:7,tool:'pickaxe',requiresTool:true,minTier:4});
  block(B.CLAY,'clay','Clay',{hardness:.7,sound:'dirt'});
  block(B.BRICKS,'bricks','Clay Bricks',{hardness:1.8,tool:'pickaxe',requiresTool:true,minTier:1});
  block(B.BED,'bed','Cloudrest Bed',{opaque:false,transparent:true,cutout:true,hardness:.55,tool:'axe',sound:'wool',textures:['bed_side','bed_side','bed_top','planks','bed_side','bed_side'],interact:'bed',maxStack:1});
  block(B.WOOL,'wool','Cloud Wool',{hardness:.45,sound:'wool',textures:['wool','wool','wool','wool','wool','wool']});
  block(B.EMBERSTONE,'emberstone','Emberstone',{hardness:1.7,tool:'pickaxe',requiresTool:true,minTier:1,sound:'stone'});
  block(B.ASH,'ash','Ashen Soil',{hardness:.55,sound:'sand'});
  block(B.GLOWROCK,'glowrock','Glowrock',{hardness:.4,sound:'glass',emission:1});
  block(B.EMBER_ORE,'ember_ore','Cinder Ore',{hardness:2.8,tool:'pickaxe',requiresTool:true,minTier:2,drop:'cinder_shard'});
  block(B.SKY_STONE,'sky_stone','Starreach Stone',{hardness:2.2,tool:'pickaxe',requiresTool:true,minTier:1,sound:'stone'});
  block(B.SKY_GRASS,'sky_grass','Starreach Turf',{hardness:.7,sound:'grass',textures:['sky_grass_side','sky_grass_side','sky_grass_top','sky_stone','sky_grass_side','sky_grass_side']});
  block(B.STAR_CRYSTAL_ORE,'star_crystal_ore','Astral Crystal Ore',{hardness:3.4,tool:'pickaxe',requiresTool:true,minTier:3,drop:'astral_crystal'});
  block(B.RIFT_FRAME,'rift_frame','Rift Frame',{hardness:6,tool:'pickaxe',requiresTool:true,minTier:4,sound:'stone',textures:['rift_frame','rift_frame','rift_frame','rift_frame','rift_frame','rift_frame']});
  block(B.EMBER_PORTAL,'ember_portal','Emberdeep Gateway',{solid:false,opaque:false,transparent:true,cutout:true,hardness:999999,drop:null,placeable:false,textures:['ember_portal','ember_portal','ember_portal','ember_portal','ember_portal','ember_portal']});
  block(B.STAR_PORTAL,'star_portal','Starreach Gateway',{solid:false,opaque:false,transparent:true,cutout:true,hardness:999999,drop:null,placeable:false,textures:['star_portal','star_portal','star_portal','star_portal','star_portal','star_portal']});
  V.Blocks=defs;
  V.BlockByKey={};defs.forEach(d=>{if(d)V.BlockByKey[d.key]=d});

  const items={};
  function item(key,name,opts){items[key]=Object.assign({key,name,maxStack:64,category:'materials',icon:key},opts||{});}
  defs.forEach(d=>{if(d&&d.placeable&&d.id!==0)item(d.key,d.name,{blockId:d.id,maxStack:d.maxStack,category:d.fluid?'utility':'blocks',icon:d.textures[2]||d.key})});
  item('coal','Coal Chunk',{fuel:80});item('raw_iron','Raw Iron');item('iron_ingot','Iron Ingot');item('raw_gold','Raw Gold');item('gold_ingot','Gold Ingot');item('lumen_crystal','Lumen Crystal');item('stick','Windwood Stick');item('hide','Tanned Hide');item('brick_item','Clay Brick');item('cinder_shard','Cinder Shard',{category:'materials',fuel:140});item('astral_crystal','Astral Crystal',{category:'materials'});
  item('wood_pickaxe','Windwood Pickaxe',{category:'tools',tool:'pickaxe',tier:1,speed:2,durability:60,maxStack:1,damage:2});
  item('stone_pickaxe','Stone Pickaxe',{category:'tools',tool:'pickaxe',tier:2,speed:4,durability:132,maxStack:1,damage:3});
  item('iron_pickaxe','Iron Pickaxe',{category:'tools',tool:'pickaxe',tier:3,speed:6,durability:251,maxStack:1,damage:4});
  item('wood_axe','Windwood Axe',{category:'tools',tool:'axe',tier:1,speed:3,durability:60,maxStack:1,damage:4});
  item('stone_axe','Stone Axe',{category:'tools',tool:'axe',tier:2,speed:5,durability:132,maxStack:1,damage:5});
  item('iron_axe','Iron Axe',{category:'tools',tool:'axe',tier:3,speed:7,durability:251,maxStack:1,damage:7});
  item('gold_axe','Gilded Axe',{category:'tools',tool:'axe',tier:2,speed:8,durability:48,maxStack:1,damage:5});
  item('lumen_axe','Lumen Axe',{category:'tools',tool:'axe',tier:4,speed:9,durability:640,maxStack:1,damage:8});
  item('wood_shovel','Windwood Shovel',{category:'tools',tool:'shovel',tier:1,speed:3,durability:60,maxStack:1,damage:2});
  item('stone_shovel','Stone Shovel',{category:'tools',tool:'shovel',tier:2,speed:5,durability:132,maxStack:1,damage:3});
  item('iron_shovel','Iron Shovel',{category:'tools',tool:'shovel',tier:3,speed:7,durability:251,maxStack:1,damage:4});
  item('gold_shovel','Gilded Shovel',{category:'tools',tool:'shovel',tier:2,speed:8,durability:48,maxStack:1,damage:3});
  item('lumen_shovel','Lumen Shovel',{category:'tools',tool:'shovel',tier:4,speed:9,durability:640,maxStack:1,damage:5});
  item('gold_pickaxe','Gilded Pickaxe',{category:'tools',tool:'pickaxe',tier:2,speed:8,durability:48,maxStack:1,damage:3});
  item('lumen_pickaxe','Lumen Pickaxe',{category:'tools',tool:'pickaxe',tier:4,speed:9,durability:640,maxStack:1,damage:5});
  item('wood_sword','Windwood Sabre',{category:'combat',tool:'sword',tier:1,speed:1,durability:60,maxStack:1,damage:4});
  item('stone_sword','Stone Sabre',{category:'combat',tool:'sword',tier:2,speed:1,durability:132,maxStack:1,damage:6});
  item('iron_sword','Iron Sabre',{category:'combat',tool:'sword',tier:3,speed:1,durability:251,maxStack:1,damage:8});
  item('gold_sword','Gilded Sabre',{category:'combat',tool:'sword',tier:2,speed:1,durability:48,maxStack:1,damage:6});
  item('lumen_sword','Lumen Sabre',{category:'combat',tool:'sword',tier:4,speed:1,durability:640,maxStack:1,damage:10});
  item('leather_cap','Hide Cap',{category:'combat',armourSlot:'head',armour:1,durability:80,maxStack:1});
  item('leather_tunic','Hide Tunic',{category:'combat',armourSlot:'chest',armour:3,durability:120,maxStack:1});
  item('leather_leggings','Hide Leggings',{category:'combat',armourSlot:'legs',armour:2,durability:110,maxStack:1});
  item('leather_boots','Hide Boots',{category:'combat',armourSlot:'feet',armour:1,durability:70,maxStack:1});
  item('iron_helmet','Iron Helmet',{category:'combat',armourSlot:'head',armour:2,durability:165,maxStack:1});
  item('iron_chestplate','Iron Chestplate',{category:'combat',armourSlot:'chest',armour:6,durability:240,maxStack:1});
  item('iron_leggings','Iron Leggings',{category:'combat',armourSlot:'legs',armour:5,durability:225,maxStack:1});
  item('iron_boots','Iron Boots',{category:'combat',armourSlot:'feet',armour:2,durability:195,maxStack:1});
  item('raw_meat','Raw Grazer Meat',{category:'food',food:3,saturation:1});item('cooked_meat','Cooked Grazer Meat',{category:'food',food:8,saturation:6});item('sun_berry','Sun Berry',{category:'food',food:2,saturation:1});item('bread','Windloaf',{category:'food',food:5,saturation:4});
  item('water_bucket','Water Pail',{category:'utility',blockId:B.WATER,maxStack:1});item('lava_bucket','Lava Pail',{category:'utility',blockId:B.LAVA,maxStack:1});
  V.Items=items;
  V.ITEM_CATEGORIES=['all','blocks','materials','tools','combat','food','utility'];

  V.makeStack=function(key,count=1,extra){if(!key||!items[key])return null;return Object.assign({key,count,damage:0},extra||{})};
  V.stackClone=s=>s?Object.assign({},s):null;
  V.itemMax=s=>s&&items[s.key]?items[s.key].maxStack:64;
  V.canMerge=(a,b)=>!!a&&!!b&&a.key===b.key&&(a.damage||0)===(b.damage||0);

  const TILE=16,COLS=8;
  const tileNames=[];defs.forEach(d=>{if(d)d.textures.forEach(t=>{if(!tileNames.includes(t))tileNames.push(t)})});
  Object.keys(items).forEach(k=>{if(!tileNames.includes(items[k].icon))tileNames.push(items[k].icon)});
  const rows=Math.ceil(tileNames.length/COLS);
  V.TextureIndex={};tileNames.forEach((n,i)=>V.TextureIndex[n]=i);

  const PAL={
    grass:['#3f8f45','#4fa653','#62b85c','#2f7338','#79c86b'],dirt:['#6f4930','#80563a','#936544','#5c3c29','#a6754d'],
    stone:['#6f767b','#7d858a','#90979a','#5e656a','#a4aaac'],sand:['#d2bd78','#e3d18d','#c5ac67','#f0dfa0','#bca15d'],
    gravel:['#6d6d6e','#858180','#9b9691','#5b5c60','#b0aaa4'],wood:['#704624','#87572d','#9f6b37','#5b371e','#b98145'],
    leaves:['#2b7438','#368b43','#45a34f','#235f31','#5bb45c'],snow:['#e8f2f4','#f6fbfb','#d5e6ea','#c4dce2','#ffffff'],
    clay:['#8799a3','#95a8b2','#778a95','#aab8bf','#6d7e88'],wool:['#d7ddd8','#e9eee9','#c5cec7','#f4f7f4','#b8c2ba']
  };
  function fill(ctx,color){ctx.fillStyle=color;ctx.fillRect(0,0,TILE,TILE)}
  function dot(ctx,x,y,color,w=1,h=1){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
  function seeded(name,i){return V.Noise.hash3(i%16,Math.floor(i/16),0,V.hashString(name))}
  function scatter(ctx,name,palette,count=34){for(let i=0;i<count;i++){const r=seeded(name,i),x=Math.floor((r*997+i*7)%16),y=Math.floor((r*613+i*11)%16),c=palette[Math.floor(r*palette.length)%palette.length];dot(ctx,x,y,c,r>.82?2:1,1)}}
  function clustered(ctx,name,palette,count=15){for(let i=0;i<count;i++){const r=seeded(name+'c',i),x=Math.floor((r*811+i*5)%15),y=Math.floor((r*521+i*9)%15),c=palette[Math.floor(r*palette.length)%palette.length];dot(ctx,x,y,c,2,2);if(r>.55)dot(ctx,(x+2)%16,y,c)}}
  function line(ctx,x0,y0,x1,y1,color,width=1){let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;while(true){dot(ctx,x0,y0,color,width,width);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}}
  function baseStone(ctx,name='stone'){fill(ctx,PAL.stone[1]);clustered(ctx,name,[PAL.stone[0],PAL.stone[2],PAL.stone[3],PAL.stone[4]],13);scatter(ctx,name+'s',[PAL.stone[0],PAL.stone[3]],16)}
  function ore(ctx,name,color,shine){baseStone(ctx,name);const pts=[[2,3],[3,4],[10,2],[11,3],[7,8],[8,8],[4,12],[12,11],[9,14]];pts.forEach((p,i)=>{dot(ctx,p[0],p[1],i%3?color:shine,2,2);if(i%2===0)dot(ctx,p[0]+2,p[1]+1,color)})}
  function paintBlock(ctx,name){
    if(name==='grass_top'){fill(ctx,PAL.grass[1]);clustered(ctx,name,[PAL.grass[0],PAL.grass[2],PAL.grass[3],PAL.grass[4]],18);scatter(ctx,name+'s',[PAL.grass[0],PAL.grass[3]],20);return}
    if(name==='grass_side'){fill(ctx,PAL.dirt[1]);clustered(ctx,'grassdirt',[PAL.dirt[0],PAL.dirt[2],PAL.dirt[3]],12);dot(ctx,0,0,PAL.grass[1],16,4);for(let x=0;x<16;x++){const h=1+Math.floor(seeded('grasshang',x)*3);dot(ctx,x,4,PAL.grass[x%3],1,h)}scatter(ctx,'grassside',[PAL.grass[2],PAL.grass[3]],12);return}
    if(name==='dirt'){fill(ctx,PAL.dirt[1]);clustered(ctx,name,[PAL.dirt[0],PAL.dirt[2],PAL.dirt[3],PAL.dirt[4]],16);scatter(ctx,name+'s',[PAL.dirt[0],PAL.dirt[3]],18);return}
    if(name==='stone'){baseStone(ctx);return}
    if(name==='sand'){fill(ctx,PAL.sand[1]);scatter(ctx,name,[PAL.sand[0],PAL.sand[2],PAL.sand[3],PAL.sand[4]],32);dot(ctx,2,5,PAL.sand[2],4,1);dot(ctx,10,12,PAL.sand[3],3,1);return}
    if(name==='gravel'){fill(ctx,PAL.gravel[1]);clustered(ctx,name,[PAL.gravel[0],PAL.gravel[2],PAL.gravel[3],PAL.gravel[4]],22);return}
    if(name==='log_side'){fill(ctx,PAL.wood[1]);for(let x=0;x<16;x+=4){dot(ctx,x,0,PAL.wood[0],2,16);dot(ctx,x+2,0,PAL.wood[2],1,16)}for(let i=0;i<10;i++){const y=(i*7+3)%16;dot(ctx,(i*5+1)%16,y,PAL.wood[3],2,2)}return}
    if(name==='log_top'){fill(ctx,PAL.wood[2]);for(let r=1;r<8;r+=2){ctx.strokeStyle=r%4===1?PAL.wood[0]:PAL.wood[1];ctx.strokeRect(r,r,15-r*2,15-r*2)}dot(ctx,7,7,PAL.wood[3],2,2);return}
    if(name==='planks'||name==='stairs'||name==='slab'){fill(ctx,PAL.wood[2]);for(let y=0;y<16;y+=4){dot(ctx,0,y,PAL.wood[3],16,1);dot(ctx,0,y+1,PAL.wood[4],16,1)}dot(ctx,5,1,PAL.wood[0],1,3);dot(ctx,11,5,PAL.wood[0],1,3);dot(ctx,3,9,PAL.wood[0],1,3);dot(ctx,13,13,PAL.wood[0],1,3);dot(ctx,7,6,PAL.wood[3],2,1);return}
    if(name==='leaves'){ctx.clearRect(0,0,16,16);fill(ctx,PAL.leaves[1]);clustered(ctx,name,[PAL.leaves[0],PAL.leaves[2],PAL.leaves[3],PAL.leaves[4]],20);for(let i=0;i<16;i++)if(seeded('leafholes',i)>.58)ctx.clearRect((i*5+2)%15,(i*9+1)%15,1+(i%3===0),1+(i%4===0));return}
    if(name==='glass'){ctx.clearRect(0,0,16,16);dot(ctx,0,0,'rgba(190,235,245,.72)',16,1);dot(ctx,0,15,'rgba(190,235,245,.72)',16,1);dot(ctx,0,0,'rgba(190,235,245,.72)',1,16);dot(ctx,15,0,'rgba(190,235,245,.72)',1,16);line(ctx,3,3,8,3,'rgba(245,255,255,.78)');line(ctx,3,4,3,8,'rgba(245,255,255,.62)');dot(ctx,12,11,'rgba(155,218,235,.55)',2,2);return}
    if(name==='water'){fill(ctx,'rgba(34,112,194,.82)');for(let y=1;y<16;y+=4){dot(ctx,(y*3)%6,y,'rgba(102,189,244,.76)',9,1);dot(ctx,((y*5)+7)%9,y+1,'rgba(25,80,167,.58)',7,1)}dot(ctx,2,3,'rgba(191,231,255,.7)',4,1);return}
    if(name==='lava'){fill(ctx,'#e64b14');clustered(ctx,name,['#ff7a18','#ffb51b','#c9330e','#ffd84a'],18);line(ctx,1,10,7,7,'#ffe45b',2);line(ctx,9,3,14,5,'#ffcb32',2);return}
    if(name==='coal_ore'){ore(ctx,name,'#292d31','#4b5054');return}
    if(name==='iron_ore'){ore(ctx,name,'#b77c58','#e0a77f');return}
    if(name==='gold_ore'){ore(ctx,name,'#e7b62c','#ffe16a');return}
    if(name==='lumen_ore'){ore(ctx,name,'#27cfc8','#9bfff1');dot(ctx,7,7,'#e1fffb',2,2);return}
    if(name==='bedrock'){fill(ctx,'#303136');clustered(ctx,name,['#17181b','#44464c','#5a5c62','#25262a'],22);return}
    if(name==='snow'){fill(ctx,PAL.snow[1]);scatter(ctx,name,[PAL.snow[0],PAL.snow[2],PAL.snow[3],PAL.snow[4]],24);dot(ctx,0,13,PAL.snow[2],16,3);return}
    if(name==='cobble'){fill(ctx,'#777d80');const stones=[[0,0,7,5],[8,0,8,4],[0,6,5,5],[6,5,10,6],[0,12,8,4],[9,12,7,4]];stones.forEach((s,i)=>{dot(ctx,s[0],s[1],i%2?'#858c90':'#6d7377',s[2],s[3]);dot(ctx,s[0],s[1],'#4e5458',s[2],1);dot(ctx,s[0],s[1],'#4e5458',1,s[3])});return}
    if(name==='craft_top'){paintBlock(ctx,'planks');dot(ctx,1,1,'#3f2817',14,2);dot(ctx,1,13,'#3f2817',14,2);dot(ctx,1,1,'#3f2817',2,14);dot(ctx,13,1,'#3f2817',2,14);line(ctx,4,4,11,11,'#6a4021');line(ctx,11,4,4,11,'#6a4021');dot(ctx,7,3,'#d2a15d',2,10);return}
    if(name==='craft_side'){paintBlock(ctx,'planks');dot(ctx,2,2,'#4a2d19',12,3);dot(ctx,3,7,'#d5a15d',10,6);dot(ctx,5,8,'#704624',1,4);dot(ctx,10,8,'#704624',1,4);return}
    if(name==='furnace_side'||name==='furnace_top'){paintBlock(ctx,'cobble');return}
    if(name==='furnace_front'){paintBlock(ctx,'cobble');dot(ctx,3,6,'#27292b',10,7);dot(ctx,4,7,'#111214',8,5);dot(ctx,5,10,'#d85e1c',6,2);dot(ctx,7,9,'#ffb52a',2,2);return}
    if(name==='chest_side'||name==='chest_top'){fill(ctx,'#9b632f');for(let y=1;y<16;y+=5)dot(ctx,0,y,'#6d3f21',16,1);dot(ctx,1,1,'#bd8241',14,1);dot(ctx,1,14,'#59341f',14,1);return}
    if(name==='chest_front'){paintBlock(ctx,'chest_side');dot(ctx,0,7,'#4d2b18',16,2);dot(ctx,6,6,'#e0b44c',4,5);dot(ctx,7,7,'#fff09b',2,2);return}
    if(name==='torch'){ctx.clearRect(0,0,16,16);dot(ctx,7,5,'#744421',2,11);dot(ctx,6,2,'#ff7b18',4,5);dot(ctx,7,0,'#ffe667',2,4);dot(ctx,5,3,'#ffc02e',6,2);return}
    if(name==='door'){ctx.clearRect(0,0,16,16);dot(ctx,1,0,'#6b3e22',14,16);dot(ctx,3,1,'#a86f38',10,6);dot(ctx,3,9,'#9c6332',10,5);dot(ctx,4,2,'#c18a4b',8,1);dot(ctx,4,10,'#ba8144',8,1);dot(ctx,11,7,'#e9ca64',2,2);return}
    if(name==='red_flower'||name==='gold_flower'){ctx.clearRect(0,0,16,16);line(ctx,8,15,8,7,'#347a3b',2);line(ctx,8,11,4,9,'#3e9145',1);const c=name==='red_flower'?'#e5484f':'#f2bf31',h=name==='red_flower'?'#ff8a78':'#ffe06a';dot(ctx,5,2,c,3,3);dot(ctx,9,2,c,3,3);dot(ctx,7,0,h,3,3);dot(ctx,7,4,c,3,3);dot(ctx,7,2,'#ffdf55',2,2);return}
    if(name==='tall_grass'){ctx.clearRect(0,0,16,16);for(let i=0;i<7;i++)line(ctx,8,15,2+i*2,3+(i%3),'#3e9346',1);line(ctx,7,15,5,6,'#6ab85c',1);return}
    if(name==='cactus'){fill(ctx,'#2e8a45');for(let x=2;x<16;x+=5){dot(ctx,x,0,'#226d39',1,16);dot(ctx,x+1,0,'#56ad5b',1,16)}for(let y=2;y<16;y+=5){dot(ctx,6,y,'#d7e487');dot(ctx,12,y+2,'#d7e487')}return}
    if(name==='ice'){fill(ctx,'rgba(133,211,232,.78)');dot(ctx,0,0,'rgba(226,252,255,.75)',16,2);line(ctx,2,13,7,7,'#e4fbff');line(ctx,7,7,5,3,'#e4fbff');line(ctx,7,7,13,4,'#b9eff8');line(ctx,9,15,13,10,'#8bcddd');return}
    if(name==='obsidian'){fill(ctx,'#1d1b2d');clustered(ctx,name,['#28223f','#35294f','#161522','#4b3563'],14);line(ctx,2,13,7,8,'#6e4b8c');line(ctx,10,6,14,2,'#3e3157');return}
    if(name==='clay'){fill(ctx,PAL.clay[1]);clustered(ctx,name,[PAL.clay[0],PAL.clay[2],PAL.clay[3],PAL.clay[4]],15);return}
    if(name==='bricks'){fill(ctx,'#985344');for(let y=0;y<16;y+=5){dot(ctx,0,y,'#513932',16,1);const off=(y/5)%2?4:0;for(let x=off;x<16;x+=8)dot(ctx,x,y,'#513932',1,5)}scatter(ctx,name,['#b86652','#7f4439','#c47760'],18);return}
    if(name==='bed_top'){fill(ctx,'#c14f58');dot(ctx,0,0,'#f2eee5',5,16);dot(ctx,5,0,'#923944',1,16);dot(ctx,7,2,'#df7276',7,2);dot(ctx,8,11,'#a63e4a',6,2);return}
    if(name==='bed_side'){dot(ctx,0,0,'#b84d56',16,10);dot(ctx,0,10,'#754826',16,6);dot(ctx,0,0,'#eee9df',5,10);dot(ctx,0,9,'#813944',16,1);dot(ctx,2,13,'#4c2d1a',2,3);dot(ctx,12,13,'#4c2d1a',2,3);return}
    if(name==='emberstone'){fill(ctx,'#5b211d');clustered(ctx,name,['#3a1718','#7d2d22','#9c3e25','#281216'],22);line(ctx,2,13,8,8,'#c8572b');return}
    if(name==='ash'){fill(ctx,'#5e5654');clustered(ctx,name,['#403b3b','#77706d','#8f8580','#2f2c2d'],24);return}
    if(name==='glowrock'){fill(ctx,'#b86824');clustered(ctx,name,['#ffca55','#f08a2c','#7d371d','#ffe791'],22);dot(ctx,5,4,'#fff4aa',3,3);dot(ctx,11,10,'#ffd45e',2,3);return}
    if(name==='ember_ore'){paintBlock(ctx,'emberstone');dot(ctx,3,3,'#ff9b32',3,3);dot(ctx,10,5,'#ffcf58',2,4);dot(ctx,6,11,'#e76827',4,2);return}
    if(name==='sky_stone'){fill(ctx,'#6e6b83');clustered(ctx,name,['#514f65','#8f8aa3','#aaa5bb','#403e52'],20);return}
    if(name==='sky_grass_top'){fill(ctx,'#7675b8');clustered(ctx,name,['#565a99','#9894d6','#b6b3e8','#45487f'],24);dot(ctx,3,4,'#d8d6ff',2,1);return}
    if(name==='sky_grass_side'){paintBlock(ctx,'sky_stone');dot(ctx,0,0,'#807fc2',16,5);dot(ctx,0,4,'#595b98',16,2);return}
    if(name==='star_crystal_ore'){paintBlock(ctx,'sky_stone');dot(ctx,3,4,'#72f2ef',3,3);dot(ctx,10,3,'#d8ffff',2,4);dot(ctx,7,11,'#55bbb8',4,2);return}
    if(name==='rift_frame'){fill(ctx,'#171321');clustered(ctx,name,['#2b203b','#3b2850','#0d0b14','#684277'],18);line(ctx,2,13,8,7,'#8e5fa2');return}
    if(name==='ember_portal'){fill(ctx,'#7f241f');for(let y=0;y<16;y+=4){dot(ctx,(y*3)%13,y,'#ff8c35',4,2);dot(ctx,(y*5+6)%14,y+2,'#ffc85a',2,2)}return}
    if(name==='star_portal'){fill(ctx,'#101426');for(let i=0;i<18;i++){const x=(i*7+3)%16,y=(i*11+2)%16;dot(ctx,x,y,i%3?'#70e8e6':'#e6ffff',i%4?1:2,i%4?1:2)}return}
    if(name==='wool'){fill(ctx,PAL.wool[1]);clustered(ctx,name,[PAL.wool[0],PAL.wool[2],PAL.wool[3],PAL.wool[4]],18);return}
    return false;
  }
  function paintItemTile(ctx,name){ctx.clearRect(0,0,16,16);
    const center=(color,dark,light)=>{dot(ctx,4,4,dark,8,8);dot(ctx,5,3,color,6,10);dot(ctx,3,6,color,10,6);dot(ctx,6,4,light,3,2)};
    if(name==='coal'){center('#272a2d','#111315','#555b60');return}
    if(name==='raw_iron'){center('#b97752','#6b4938','#e4a47a');return}
    if(name==='raw_gold'){center('#d3a128','#755817','#ffe078');return}
    if(name==='iron_ingot'||name==='gold_ingot'){const gold=name==='gold_ingot',c=gold?'#e8bd39':'#bdc8ce',d=gold?'#8d6718':'#667279',l=gold?'#ffeb7b':'#eef7fa';dot(ctx,2,6,d,12,6);dot(ctx,3,5,c,10,6);dot(ctx,5,5,l,6,2);dot(ctx,11,8,d,2,2);return}
    if(name==='lumen_crystal'){dot(ctx,7,1,'#d5fffb',2,2);dot(ctx,5,3,'#4ce3d8',6,8);dot(ctx,7,11,'#1a9998',2,4);dot(ctx,6,5,'#b7fff6',2,4);return}
    if(name==='cinder_shard'){dot(ctx,6,2,'#ffdb70',4,3);dot(ctx,4,5,'#e75c24',8,7);dot(ctx,6,11,'#7e251d',4,3);dot(ctx,7,5,'#fff0a0',2,4);return}
    if(name==='astral_crystal'){dot(ctx,7,1,'#f1ffff',2,2);dot(ctx,5,3,'#70e6e4',6,8);dot(ctx,7,11,'#327f91',2,4);dot(ctx,6,5,'#d4ffff',2,4);return}
    if(name==='stick'){line(ctx,4,14,12,4,'#5a351e',2);line(ctx,5,13,13,3,'#a06b35',1);return}
    if(name==='hide'){dot(ctx,3,3,'#8f5b36',10,10);dot(ctx,2,5,'#8f5b36',12,6);dot(ctx,5,2,'#b67b4b',6,12);dot(ctx,6,4,'#d19a63',4,3);return}
    if(name==='brick_item'){dot(ctx,2,5,'#6f392f',12,7);dot(ctx,3,4,'#b86652',10,7);dot(ctx,4,5,'#d08168',6,2);return}
    if(name==='raw_meat'||name==='cooked_meat'){const cooked=name==='cooked_meat';dot(ctx,3,5,cooked?'#6c3422':'#a73e48',10,7);dot(ctx,5,3,cooked?'#a45b35':'#d86670',7,9);dot(ctx,7,5,cooked?'#d48a51':'#f49aa1',3,3);dot(ctx,2,10,'#e6d7c6',4,3);return}
    if(name==='sun_berry'){dot(ctx,5,4,'#e58b25',7,7);dot(ctx,7,2,'#f7c348',4,7);dot(ctx,7,1,'#3b8d42',2,3);dot(ctx,9,2,'#4da34b',3,2);return}
    if(name==='bread'){dot(ctx,3,5,'#8f5528',10,8);dot(ctx,4,4,'#c8863f',8,8);dot(ctx,6,5,'#e6ae5a',5,2);dot(ctx,5,8,'#8f5528',2,1);dot(ctx,9,8,'#8f5528',2,1);return}
    if(name==='water_bucket'||name==='lava_bucket'){dot(ctx,3,4,'#5c666c',10,10);dot(ctx,4,5,'#c5d0d5',8,7);dot(ctx,5,8,name==='water_bucket'?'#3288d3':'#ee5b18',6,4);line(ctx,4,5,5,2,'#8e999e');line(ctx,11,5,10,2,'#8e999e');line(ctx,5,2,10,2,'#8e999e');return}
    if(name.includes('helmet')||name.includes('cap')){const iron=name.includes('iron'),c=iron?'#aebbc1':'#8c5a39',d=iron?'#5f6d74':'#50331f',l=iron?'#e2ecef':'#c88a57';dot(ctx,3,4,d,10,8);dot(ctx,4,3,c,8,7);dot(ctx,5,4,l,4,2);dot(ctx,5,8,'rgba(0,0,0,0)',6,4);ctx.clearRect(5,8,6,4);return}
    if(name.includes('chestplate')||name.includes('tunic')){const iron=name.includes('iron'),c=iron?'#9eabb1':'#8c5a39',d=iron?'#59666c':'#50331f',l=iron?'#e2ecef':'#c88a57';dot(ctx,3,3,d,10,12);dot(ctx,5,2,c,6,13);dot(ctx,2,5,c,12,5);dot(ctx,6,4,l,4,3);ctx.clearRect(7,2,2,3);return}
    if(name.includes('leggings')){const iron=name.includes('iron'),c=iron?'#9eabb1':'#8c5a39',d=iron?'#59666c':'#50331f';dot(ctx,4,3,c,8,7);dot(ctx,4,9,d,3,6);dot(ctx,9,9,d,3,6);dot(ctx,6,4,'#d6e1e5',4,2);return}
    if(name.includes('boots')){const iron=name.includes('iron'),c=iron?'#9eabb1':'#8c5a39',d=iron?'#59666c':'#50331f';dot(ctx,3,6,c,4,7);dot(ctx,9,6,c,4,7);dot(ctx,2,11,d,6,3);dot(ctx,8,11,d,6,3);return}
    fill(ctx,'#8a4fa3');dot(ctx,4,4,'#c28cdb',8,8);dot(ctx,6,6,'#f2dcff',4,4);
  }
  function paintTile(ctx,name,ox,oy){ctx.save();ctx.translate(ox,oy);ctx.imageSmoothingEnabled=false;if(paintBlock(ctx,name)===false)paintItemTile(ctx,name);ctx.restore()}
  V.createTextureAtlas=function(){const c=document.createElement('canvas');c.width=COLS*TILE;c.height=rows*TILE;const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;tileNames.forEach((n,i)=>paintTile(ctx,n,(i%COLS)*TILE,Math.floor(i/COLS)*TILE));const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;if('encoding' in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;return{texture:tex,canvas:c,cols:COLS,rows,tile:TILE}};
  V.getUV=function(name){const i=V.TextureIndex[name]||0,x=i%COLS,y=Math.floor(i/COLS);const pad=.0015;return{u0:x/COLS+pad,u1:(x+1)/COLS-pad,v0:1-(y+1)/rows+pad,v1:1-y/rows-pad}};
  V.iconCache={};
  V.createTileCanvas=function(name,size=64){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;const idx=V.TextureIndex[name]||0,x=(idx%COLS)*TILE,y=Math.floor(idx/COLS)*TILE;if(V.atlasCanvas)ctx.drawImage(V.atlasCanvas,x,y,TILE,TILE,0,0,size,size);else{const small=document.createElement('canvas');small.width=small.height=TILE;paintTile(small.getContext('2d',{alpha:true}),name,0,0);ctx.drawImage(small,0,0,TILE,TILE,0,0,size,size)}return c};
  V.createTileTexture=function(name,size=64){const tex=new THREE.CanvasTexture(V.createTileCanvas(name,size));tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;if('encoding' in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;return tex};
  function toolPalette(it){if(it.tier>=4)return{head:'#42dfd5',edge:'#cafff8',dark:'#167e80'};if(it.key.startsWith('gold_'))return{head:'#e8bd39',edge:'#fff08a',dark:'#886617'};if(it.tier>=3)return{head:'#aebbc1',edge:'#edf7fa',dark:'#5e6b72'};if(it.tier===2)return{head:'#777e83',edge:'#b9c0c4',dark:'#454b50'};return{head:'#8b5a31',edge:'#c58a4f',dark:'#4c301b'}}
  function paintTool(ctx,it){ctx.clearRect(0,0,16,16);const p=toolPalette(it),handle='#7b4c28',handleHi='#b0783f';line(ctx,3,14,11,6,handle,2);line(ctx,4,13,12,5,handleHi,1);if(it.tool==='pickaxe'){line(ctx,5,4,13,4,p.dark,2);line(ctx,4,3,13,3,p.head,2);dot(ctx,3,4,p.edge,2,1);dot(ctx,12,4,p.edge,2,1)}else if(it.tool==='axe'){dot(ctx,8,2,p.dark,6,6);dot(ctx,7,2,p.head,5,5);dot(ctx,8,2,p.edge,3,1);dot(ctx,12,4,p.dark,2,3)}else if(it.tool==='shovel'){dot(ctx,8,1,p.dark,5,6);dot(ctx,7,1,p.head,5,5);dot(ctx,8,1,p.edge,3,1);dot(ctx,8,5,p.dark,4,2)}else if(it.tool==='sword'){line(ctx,4,12,12,2,p.dark,3);line(ctx,5,11,12,2,p.head,2);line(ctx,6,10,12,2,p.edge,1);line(ctx,3,10,7,14,handle,2);dot(ctx,2,12,p.dark,3,3)}}
  V.createItemCanvas=function(key,size=32){const it=items[key],name=(it&&it.icon)||key,small=document.createElement('canvas');small.width=small.height=16;const sctx=small.getContext('2d',{alpha:true});sctx.imageSmoothingEnabled=false;if(it&&it.tool)paintTool(sctx,it);else{const idx=V.TextureIndex[name]||0,x=(idx%COLS)*TILE,y=Math.floor(idx/COLS)*TILE;if(V.atlasCanvas)sctx.drawImage(V.atlasCanvas,x,y,TILE,TILE,0,0,16,16);else paintTile(sctx,name,0,0)}const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,16,16,0,0,size,size);return c};
  V.createItemTexture=function(key,size=64){const tex=new THREE.CanvasTexture(V.createItemCanvas(key,size));tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;if('encoding' in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;return tex};
  V.itemIcon=function(key){if(V.iconCache[key])return V.iconCache[key];V.iconCache[key]=`url(${V.createItemCanvas(key,32).toDataURL()})`;return V.iconCache[key]};
})();
