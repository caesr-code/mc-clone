(function(){
  'use strict';
  const V=window.Voidlands,B=V.B,CS=V.CHUNK_SIZE,H=V.WORLD_HEIGHT,SEA=V.SEA_LEVEL;
  const idx=(x,y,z)=>y*CS*CS+z*CS+x;
  class World{
    constructor(game,data){
      this.game=game;this.data=data;this.seed=data.seedNumber>>>0;this.group=new THREE.Group();this.group.name='VoxelWorld';game.scene.add(this.group);
      this.chunkData=new Map();this.chunkMeshes=new Map();this.chunkQueue=[];this.dirtyChunks=new Set();this.dimension=data.dimension||'overworld';data.dimensionStates=data.dimensionStates||{};if(!data.dimensionStates.overworld)data.dimensionStates.overworld={modified:data.modified||{},blockEntities:data.blockEntities||{},explored:data.explored||[]};for(const name of ['emberdeep','starreach'])if(!data.dimensionStates[name])data.dimensionStates[name]={modified:{},blockEntities:{},explored:[]};this.dimensionStates=data.dimensionStates;const active=this.dimensionStates[this.dimension];this.explored=new Set(active.explored||[]);this.modified=active.modified||{};this.blockEntities=active.blockEntities||{};
      const atlas=V.createTextureAtlas();V.atlasCanvas=atlas.canvas;this.atlas=atlas;
      this.materials={
        opaque:new THREE.MeshLambertMaterial({map:atlas.texture,vertexColors:true,emissive:0x000000}),
        cutout:new THREE.MeshLambertMaterial({map:atlas.texture,vertexColors:true,transparent:true,alphaTest:.35,side:THREE.DoubleSide,emissive:0x000000}),
        fluid:new THREE.MeshLambertMaterial({map:atlas.texture,vertexColors:true,transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide,emissive:0x000000})
      };
      this.materials.opaque.map.magFilter=THREE.NearestFilter;
      this.lastPlayerChunk='';this.maxBuildPerFrame=game.settings.graphics==='ultra'?2:1;this.setVibrant(game.settings.vibrantVisuals);
    }
    setVibrant(enabled){const v=!!enabled;this.materials.opaque.color.set(v?0xffffff:0xf7f7f7);this.materials.cutout.color.set(v?0xffffff:0xf7f7f7);this.materials.fluid.color.set(v?0xb8e6ff:0xffffff);this.materials.opaque.emissive.set(v?0x050805:0x000000);this.materials.cutout.emissive.set(v?0x040704:0x000000);this.materials.fluid.emissive.set(v?0x071b2b:0x000000);this.materials.opaque.emissiveIntensity=v?.16:0;this.materials.cutout.emissiveIntensity=v?.14:0;this.materials.fluid.emissiveIntensity=v?.3:0;this.materials.fluid.opacity=v?.76:.72;Object.values(this.materials).forEach(m=>m.needsUpdate=true)}
    destroy(){for(const m of this.chunkMeshes.values())this.disposeChunk(m);this.chunkMeshes.clear();this.chunkData.clear();this.game.scene.remove(this.group);Object.values(this.materials).forEach(m=>m.dispose());}
    terrainInfo(x,z){
      if(this.dimension==='emberdeep')return{height:18+Math.floor(V.Noise.fbm2(x*.02,z*.02,this.seed+1701,4)*3),biome:'ember_wastes',temp:1,moisture:-1,continent:1};
      if(this.dimension==='starreach')return{height:40+Math.floor(V.Noise.fbm2(x*.018,z*.018,this.seed+2701,4)*5),biome:'star_isles',temp:-.2,moisture:0,continent:1};
      const type=this.data.worldType||'default',scale=type==='large'?.45:1;
      const continent=V.Noise.fbm2(x*.0028*scale,z*.0028*scale,this.seed+11,5);
      const temp=V.Noise.fbm2(x*.0022*scale,z*.0022*scale,this.seed+29,4)+(z/12000);
      const moisture=V.Noise.fbm2(x*.0027*scale,z*.0027*scale,this.seed+47,4);
      const hills=V.Noise.fbm2(x*.012*scale,z*.012*scale,this.seed+71,5);
      const ridges=V.Noise.ridged2(x*.006*scale,z*.006*scale,this.seed+89,4);
      let height;
      if(type==='flat')height=18;
      else{
        const land=continent*13;
        const mountain=Math.max(0,ridges-.5)*(type==='amplified'?58:30);
        height=SEA+4+land+hills*7+mountain;
        if(type==='amplified')height+=hills*10;
        const river=Math.abs(V.Noise.fbm2(x*.007*scale,z*.007*scale,this.seed+133,3));
        if(river<.035&&continent>-.25)height=Math.min(height,SEA-1+river*35);
      }
      height=V.clamp(Math.floor(height),5,H-10);
      let biome='plains';
      if(height<SEA-4)biome='ocean';
      else if(height<=SEA+1)biome='beach';
      else if(temp<-.35||height>51)biome='frostlands';
      else if(temp>.28&&moisture<-.08)biome='dunes';
      else if(moisture>.12)biome='forest';
      else if(moisture<-.42)biome='scrub';
      return{height,biome,temp,moisture,continent};
    }
    getBiomeAt(x,z){return this.terrainInfo(x,z).biome}
    generateChunkData(cx,cz){
      const key=V.chunkKey(cx,cz);if(this.chunkData.has(key))return this.chunkData.get(key);if(this.dimension==='emberdeep')return this.generateEmberChunk(cx,cz);if(this.dimension==='starreach')return this.generateStarChunk(cx,cz);
      const a=new Uint8Array(CS*H*CS),tops=new Int16Array(CS*CS),biomes=[];
      for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){
        const wx=cx*CS+x,wz=cz*CS+z,info=this.terrainInfo(wx,wz),top=info.height;tops[z*CS+x]=top;biomes[z*CS+x]=info.biome;
        for(let y=0;y<H;y++){
          let id=B.AIR;
          if(y===0||y<3&&V.Noise.hash3(wx,y,wz,this.seed+3)>.45)id=B.BEDROCK;
          else if(y<=top){
            if(y<top-4)id=B.STONE;
            else if(info.biome==='dunes'||info.biome==='beach')id=B.SAND;
            else if(info.biome==='ocean'&&y>top-3)id=V.Noise.hash3(wx,y,wz,this.seed+9)>.7?B.CLAY:B.SAND;
            else if(y===top&&info.biome==='frostlands')id=B.SNOW;
            else if(y===top)id=B.GRASS;
            else id=B.DIRT;
            if(id===B.STONE&&y>3&&y<top-3){
              const cave=V.Noise.value3(wx*.065,y*.08,wz*.065,this.seed+401)+V.Noise.value3(wx*.12,y*.12,wz*.12,this.seed+409)*.35;
              const ravine=Math.abs(V.Noise.value2(wx*.014,wz*.014,this.seed+433));
              if(cave>.68||(ravine<.018&&y>7&&y<top-6&&Math.abs(y-(14+V.Noise.value2(wx*.02,wz*.02,this.seed+439)*9))<7))id=B.AIR;
              else{
                const r=V.Noise.hash3(wx,y,wz,this.seed+500);
                if(y<14&&r>.994)id=B.LUMEN_ORE;else if(y<22&&r>.988)id=B.GOLD_ORE;else if(y<42&&r>.978)id=B.IRON_ORE;else if(y<55&&r>.965)id=B.COAL_ORE;
              }
            }
          }else if(y<=SEA)id=info.biome==='frostlands'&&y===SEA?B.ICE:B.WATER;
          a[idx(x,y,z)]=id;
        }
      }
      // Vegetation and trees. Edge foliage is intentionally clipped to its owning chunk for deterministic regeneration.
      for(let z=1;z<CS-1;z++)for(let x=1;x<CS-1;x++){
        const wx=cx*CS+x,wz=cz*CS+z,top=tops[z*CS+x],biome=biomes[z*CS+x],r=V.Noise.hash3(wx,0,wz,this.seed+701);
        if(top+7>=H||a[idx(x,top,z)]===B.WATER)continue;
        if((biome==='forest'&&r>.91)||(biome==='plains'&&r>.982)){
          const trunk=4+Math.floor(V.Noise.hash3(wx,2,wz,this.seed+709)*3);for(let y=1;y<=trunk;y++)a[idx(x,top+y,z)]=B.LOG;
          for(let dy=trunk-2;dy<=trunk+1;dy++){const rad=dy===trunk+1?1:2;for(let dz=-rad;dz<=rad;dz++)for(let dx=-rad;dx<=rad;dx++){if(Math.abs(dx)+Math.abs(dz)>rad*1.7)continue;const p=idx(x+dx,top+dy,z+dz);if(a[p]===B.AIR)a[p]=B.LEAVES}}
        }else if(biome==='dunes'&&r>.975){const n=2+Math.floor(r*7)%3;for(let y=1;y<=n;y++)a[idx(x,top+y,z)]=B.CACTUS}
        else if((biome==='plains'||biome==='forest'||biome==='scrub')&&r>.73){a[idx(x,top+1,z)]=r>.985?B.RED_FLOWER:r>.95?B.GOLD_FLOWER:B.TALL_GRASS}
      }
      // Rare small ruins and dune shrines.
      if(this.data.structures){const sr=V.Noise.hash3(cx,0,cz,this.seed+901);if(sr>.994){const bx=5,bz=5,top=tops[bz*CS+bx];for(let z=4;z<12;z++)for(let x=4;x<12;x++)if(x===4||x===11||z===4||z===11||x===7&&z===7)a[idx(x,top+1,z)]=biomes[bz*CS+bx]==='dunes'?B.SAND:B.COBBLE;for(let y=2;y<5;y++)for(const [x,z] of [[4,4],[11,4],[4,11],[11,11]])a[idx(x,top+y,z)]=biomes[bz*CS+bx]==='dunes'?B.SAND:B.COBBLE}
      }
      if(cx===0&&cz===0){this.addGatewayToArray(a,cx,cz,Math.max(34,tops[8*CS+8]+1),B.EMBER_PORTAL);for(let yy=0;yy<5;yy++)for(let xx=0;xx<5;xx++){const sx=10+xx,sz=10,sy=Math.max(34,tops[10*CS+10]+1);if(sx<CS)a[idx(sx,sy+yy,sz)]=yy===0||yy===4||xx===0||xx===4?B.RIFT_FRAME:B.STAR_PORTAL}}
      this.chunkData.set(key,a);return a;
    }
    addGatewayToArray(a,cx,cz,y,portalId){if(cx!==0||cz!==0)return;for(let z=5;z<=11;z++)for(let x=5;x<=11;x++)a[idx(x,y-1,z)]=this.dimension==='emberdeep'?B.EMBERSTONE:this.dimension==='starreach'?B.SKY_STONE:B.COBBLE;for(let yy=y;yy<=y+4;yy++)for(let x=6;x<=10;x++)for(let z=6;z<=10;z++)a[idx(x,yy,z)]=B.AIR;for(let yy=y;yy<=y+3;yy++){a[idx(7,yy,8)]=B.RIFT_FRAME;a[idx(9,yy,8)]=B.RIFT_FRAME}for(let x=7;x<=9;x++){a[idx(x,y-1,8)]=B.RIFT_FRAME;a[idx(x,y+4,8)]=B.RIFT_FRAME}for(let yy=y;yy<=y+3;yy++)a[idx(8,yy,8)]=portalId}
    generateEmberChunk(cx,cz){const key=V.chunkKey(cx,cz),a=new Uint8Array(CS*H*CS);for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const wx=cx*CS+x,wz=cz*CS+z,floor=15+Math.floor(V.Noise.fbm2(wx*.025,wz*.025,this.seed+1703,4)*4),ceil=55+Math.floor(V.Noise.fbm2(wx*.021,wz*.021,this.seed+1711,4)*5);for(let y=0;y<H;y++){let id=B.AIR;if(y===0||y===H-1)id=B.BEDROCK;else if(y<=floor||y>=ceil){id=y===floor&&V.Noise.hash3(wx,y,wz,this.seed+1721)>.82?B.ASH:B.EMBERSTONE;const r=V.Noise.hash3(wx,y,wz,this.seed+1731);if(id===B.EMBERSTONE&&y<30&&r>.989)id=B.EMBER_ORE;if(id===B.EMBERSTONE&&y>49&&r>.982)id=B.GLOWROCK}else if(y<=18&&V.Noise.hash3(wx,0,wz,this.seed+1753)>.48)id=B.LAVA;const pillar=V.Noise.ridged2(wx*.032,wz*.032,this.seed+1741,3);if(y>floor&&y<ceil&&pillar>.89&&Math.abs(V.Noise.value2(wx*.07,wz*.07,this.seed+1749))>.5)id=B.EMBERSTONE;a[idx(x,y,z)]=id}}this.addGatewayToArray(a,cx,cz,20,B.EMBER_PORTAL);this.chunkData.set(key,a);return a}
    generateStarChunk(cx,cz){const key=V.chunkKey(cx,cz),a=new Uint8Array(CS*H*CS);for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const wx=cx*CS+x,wz=cz*CS+z,noise=V.Noise.fbm2(wx*.018,wz*.018,this.seed+2703,5),detail=V.Noise.fbm2(wx*.055,wz*.055,this.seed+2711,3),nearOrigin=Math.hypot(wx-8,wz-8)<13,density=noise+detail*.28+(nearOrigin?.8:0),top=40+Math.floor(noise*8),thick=4+Math.floor((density+.2)*5);if(density>.12)for(let y=Math.max(2,top-thick);y<=top;y++){let id=y===top?B.SKY_GRASS:B.SKY_STONE;const r=V.Noise.hash3(wx,y,wz,this.seed+2721);if(y<top-2&&r>.992)id=B.STAR_CRYSTAL_ORE;a[idx(x,y,z)]=id}if(density>.63&&V.Noise.hash3(wx,0,wz,this.seed+2731)>.975)for(let y=top+1;y<Math.min(H-1,top+7);y++)a[idx(x,y,z)]=B.GLOWROCK}this.addGatewayToArray(a,cx,cz,42,B.STAR_PORTAL);this.chunkData.set(key,a);return a}
    saveDimensionState(){const state=this.dimensionStates[this.dimension]||(this.dimensionStates[this.dimension]={});state.modified=this.modified;state.blockEntities=this.blockEntities;state.explored=Array.from(this.explored)}
    switchDimension(name){if(!this.dimensionStates[name]||name===this.dimension)return;this.saveDimensionState();for(const mesh of this.chunkMeshes.values())this.disposeChunk(mesh);this.chunkMeshes.clear();this.chunkData.clear();this.chunkQueue.length=0;this.dirtyChunks.clear();this.dimension=name;this.data.dimension=name;const state=this.dimensionStates[name];this.modified=state.modified||{};this.blockEntities=state.blockEntities||{};this.explored=new Set(state.explored||[]);this.lastPlayerChunk=''}
    dimensionSpawn(name=this.dimension){if(name==='emberdeep')return{x:8.5,y:20.05,z:6.5};if(name==='starreach')return{x:8.5,y:42.05,z:6.5};return this.data.spawn||{x:.5,y:SEA+20,z:.5}}
    generatedAt(x,y,z){if(y<0||y>=H)return B.AIR;const cx=V.floorDiv(x,CS),cz=V.floorDiv(z,CS),lx=V.mod(x,CS),lz=V.mod(z,CS);return this.generateChunkData(cx,cz)[idx(lx,y,lz)]}
    getBlock(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0||y>=H)return y<0?B.BEDROCK:B.AIR;const k=V.blockKey(x,y,z);if(Object.prototype.hasOwnProperty.call(this.modified,k))return this.modified[k];return this.generatedAt(x,y,z)}
    setBlock(x,y,z,id,playerChange=true){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<=0||y>=H)return false;const current=this.getBlock(x,y,z);if(current===id)return false;const k=V.blockKey(x,y,z),natural=this.generatedAt(x,y,z);if(id===natural)delete this.modified[k];else this.modified[k]=id;if(id===B.AIR)delete this.blockEntities[k];if(playerChange){if(id===B.AIR)this.data.stats.blocksMined++;else this.data.stats.blocksPlaced++;}
      const cx=V.floorDiv(x,CS),cz=V.floorDiv(z,CS),lx=V.mod(x,CS),lz=V.mod(z,CS);this.markDirty(cx,cz);if(lx===0)this.markDirty(cx-1,cz);if(lx===CS-1)this.markDirty(cx+1,cz);if(lz===0)this.markDirty(cx,cz-1);if(lz===CS-1)this.markDirty(cx,cz+1);return true}
    markDirty(cx,cz){const k=V.chunkKey(cx,cz);this.dirtyChunks.add(k);if(!this.chunkQueue.some(q=>q.key===k))this.chunkQueue.unshift({cx,cz,key:k,priority:-1})}
    isSolid(x,y,z){const id=this.getBlock(x,y,z),d=V.Blocks[id];if(!d||!d.solid)return false;const e=this.blockEntities[V.blockKey(Math.floor(x),Math.floor(y),Math.floor(z))];if(id===B.DOOR&&e&&e.open)return false;return true}
    collisionBoxes(x,y,z){const id=this.getBlock(x,y,z),d=V.Blocks[id];if(!d||!d.solid)return[];const ent=this.blockEntities[V.blockKey(x,y,z)];if(id===B.DOOR&&ent&&ent.open)return[];if(id===B.SLAB)return[{minX:x,minY:y,minZ:z,maxX:x+1,maxY:y+.5,maxZ:z+1}];if(id===B.BED)return[{minX:x,minY:y,minZ:z,maxX:x+1,maxY:y+.5625,maxZ:z+1}];if(id===B.STAIRS)return[{minX:x,minY:y,minZ:z,maxX:x+1,maxY:y+.5,maxZ:z+1},{minX:x,minY:y+.5,minZ:z+.5,maxX:x+1,maxY:y+1,maxZ:z+1}];if(id===B.DOOR)return[{minX:x,minY:y,minZ:z+.42,maxX:x+1,maxY:y+1,maxZ:z+.58}];return[{minX:x,minY:y,minZ:z,maxX:x+1,maxY:y+1,maxZ:z+1}]}
    getSurfaceY(x,z){if(this.dimension==='emberdeep'){for(let y=2;y<H-3;y++){const below=V.Blocks[this.getBlock(x,y-1,z)],here=this.getBlock(x,y,z),head=this.getBlock(x,y+1,z);if(below&&below.solid&&here===B.AIR&&head===B.AIR)return y}return 20}for(let y=H-2;y>1;y--){const id=this.getBlock(x,y,z),d=V.Blocks[id];if(d&&d.solid&&id!==B.LEAVES)return y+1}return this.dimension==='starreach'?42:SEA+2}
    canSeeSky(x,y,z){if(this.dimension!=='overworld')return false;x=Math.floor(x);z=Math.floor(z);for(let yy=Math.max(0,Math.floor(y)+1);yy<H;yy++){const d=V.Blocks[this.getBlock(x,yy,z)];if(d&&d.opaque)return false}return true}
    findSpawn(){if(this.data.spawn)return this.data.spawn;for(let r=0;r<80;r+=4)for(let a=0;a<Math.max(8,r*2);a++){const ang=a/Math.max(8,r*2)*Math.PI*2,x=Math.floor(Math.cos(ang)*r),z=Math.floor(Math.sin(ang)*r),biome=this.getBiomeAt(x,z);if(biome==='ocean')continue;const y=this.getSurfaceY(x,z);if(y<H-3&&this.getBlock(x,y,z)===B.AIR&&this.getBlock(x,y+1,z)===B.AIR){this.data.spawn={x:x+.5,y:y+.02,z:z+.5};if(this.data.bonusChest)this.createBonusChest(x+2,y,z);return this.data.spawn}}this.data.spawn={x:.5,y:SEA+20,z:.5};return this.data.spawn}
    createBonusChest(x,y,z){this.setBlock(x,y,z,B.CHEST,false);this.blockEntities[V.blockKey(x,y,z)]={type:'chest',slots:Array.from({length:27},()=>null)};const s=this.blockEntities[V.blockKey(x,y,z)].slots;s[0]=V.makeStack('wood_pickaxe',1);s[1]=V.makeStack('planks',16);s[2]=V.makeStack('torch',8);s[3]=V.makeStack('cooked_meat',4);}
    ensureBlockEntity(x,y,z,type){const k=V.blockKey(x,y,z);if(this.blockEntities[k])return this.blockEntities[k];if(type==='chest')return this.blockEntities[k]={type,slots:Array.from({length:27},()=>null)};if(type==='furnace')return this.blockEntities[k]={type,input:null,fuel:null,output:null,burn:0,burnMax:0,progress:0};if(type==='door')return this.blockEntities[k]={type,open:false};if(type==='bed')return this.blockEntities[k]={type};return this.blockEntities[k]={type}}
    toggleDoor(x,y,z){const e=this.ensureBlockEntity(x,y,z,'door');e.open=!e.open;this.markDirty(V.floorDiv(x,CS),V.floorDiv(z,CS));return e.open}
    queueAround(px,pz,force=false){const pcx=V.floorDiv(px,CS),pcz=V.floorDiv(pz,CS),id=pcx+','+pcz+','+this.game.settings.renderDistance;if(!force&&id===this.lastPlayerChunk)return;this.lastPlayerChunk=id;const radius=this.game.settings.renderDistance,list=[];for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){const dist=dx*dx+dz*dz;if(dist>radius*radius+2)continue;const cx=pcx+dx,cz=pcz+dz,key=V.chunkKey(cx,cz);if(!this.chunkMeshes.has(key))list.push({cx,cz,key,priority:dist})}list.sort((a,b)=>a.priority-b.priority);for(const q of list)if(!this.chunkQueue.some(v=>v.key===q.key))this.chunkQueue.push(q);
      for(const [key,mesh] of this.chunkMeshes){const [cx,cz]=key.split(',').map(Number);if(Math.abs(cx-pcx)>radius+2||Math.abs(cz-pcz)>radius+2){this.disposeChunk(mesh);this.chunkMeshes.delete(key);if(Math.abs(cx-pcx)>radius+4||Math.abs(cz-pcz)>radius+4)this.chunkData.delete(key)}}
    }
    updateBuilds(){let n=this.maxBuildPerFrame;while(n--&&this.chunkQueue.length){const q=this.chunkQueue.shift();const radius=this.game.settings.renderDistance+2,pcx=V.floorDiv(this.game.player.position.x,CS),pcz=V.floorDiv(this.game.player.position.z,CS);if(Math.abs(q.cx-pcx)>radius||Math.abs(q.cz-pcz)>radius)continue;this.buildChunk(q.cx,q.cz);this.explored.add(q.key);this.dirtyChunks.delete(q.key)}}
    geometryBucket(){return{p:[],n:[],uv:[],c:[],i:[],count:0}}
    addQuad(g,corners,n,uv,shade,offset){const base=g.count;for(const c of corners){g.p.push(c[0]+offset[0],c[1]+offset[1],c[2]+offset[2]);g.n.push(n[0],n[1],n[2]);g.c.push(shade,shade,shade);g.count++}g.uv.push(uv.u0,uv.v0,uv.u0,uv.v1,uv.u1,uv.v1,uv.u1,uv.v0);g.i.push(base,base+1,base+2,base,base+2,base+3)}
    addBox(g,x,y,z,id,min=[0,0,0],max=[1,1,1],category='opaque'){
      const d=V.Blocks[id];for(let f=0;f<6;f++){const fd=V.FACE_DEFS[f],nx=x+fd.n[0],ny=y+fd.n[1],nz=z+fd.n[2],neighbor=this.getBlock(nx,ny,nz),nd=V.Blocks[neighbor];let show=true;if(min[0]===0&&max[0]===1&&min[1]===0&&max[1]===1&&min[2]===0&&max[2]===1){if(d.fluid)show=neighbor!==id&&(!nd||!nd.opaque);else if(d.transparent)show=neighbor!==id&&(!nd||!nd.opaque);else show=!nd||!nd.opaque}if(!show)continue;const corners=fd.corners.map(v=>[v[0]?max[0]:min[0],v[1]?max[1]:min[1],v[2]?max[2]:min[2]]);if(d.fluid&&f===2)corners.forEach(v=>v[1]=.88);this.addQuad(g,corners,fd.n,V.getUV(d.textures[f]||d.key),fd.shade,[x,y,z])}}
    addCross(g,x,y,z,id){const uv=V.getUV(V.Blocks[id].textures[0]),shade=.95,quads=[[[.1,0,.1],[.1,1,.1],[.9,1,.9],[.9,0,.9]],[[.9,0,.1],[.9,1,.1],[.1,1,.9],[.1,0,.9]]];for(const q of quads){this.addQuad(g,q,[0,0,1],uv,shade,[x,y,z]);this.addQuad(g,q.slice().reverse(),[0,0,-1],uv,shade,[x,y,z])}}
    makeGeometry(g){if(!g.count)return null;const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(g.p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(g.n,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(g.uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(g.c,3));geo.setIndex(g.i);geo.computeBoundingSphere();return geo}
    buildChunk(cx,cz){const key=V.chunkKey(cx,cz),old=this.chunkMeshes.get(key);if(old){this.disposeChunk(old);this.chunkMeshes.delete(key)}this.generateChunkData(cx,cz);const buckets={opaque:this.geometryBucket(),cutout:this.geometryBucket(),fluid:this.geometryBucket()};
      for(let z=0;z<CS;z++)for(let y=0;y<H;y++)for(let x=0;x<CS;x++){const wx=cx*CS+x,wz=cz*CS+z,id=this.getBlock(wx,y,wz);if(id===B.AIR)continue;const d=V.Blocks[id];if(id===B.RED_FLOWER||id===B.GOLD_FLOWER||id===B.TALL_GRASS||id===B.TORCH||id===B.FIRE){this.addCross(buckets.cutout,wx,y,wz,id);continue}const cat=d.fluid?'fluid':d.transparent?'cutout':'opaque';if(id===B.SLAB)this.addBox(buckets[cat],wx,y,wz,id,[0,0,0],[1,.5,1],cat);else if(id===B.BED)this.addBox(buckets.cutout,wx,y,wz,id,[0,0,0],[1,.5625,1],'cutout');else if(id===B.STAIRS){this.addBox(buckets[cat],wx,y,wz,id,[0,0,0],[1,.5,1],cat);this.addBox(buckets[cat],wx,y,wz,id,[0,.5,.5],[1,1,1],cat)}else if(id===B.DOOR){const ent=this.blockEntities[V.blockKey(wx,y,wz)];if(ent&&ent.open)this.addBox(buckets.cutout,wx,y,wz,id,[.42,0,0],[.58,1,1],'cutout');else this.addBox(buckets.cutout,wx,y,wz,id,[0,0,.42],[1,1,.58],'cutout')}else this.addBox(buckets[cat],wx,y,wz,id)}
      const group=new THREE.Group();group.name='chunk_'+key;for(const cat of ['opaque','cutout','fluid']){const geo=this.makeGeometry(buckets[cat]);if(geo){const mesh=new THREE.Mesh(geo,this.materials[cat]);mesh.castShadow=cat==='opaque'&&this.game.settings.shadows;mesh.receiveShadow=cat!=='fluid';mesh.frustumCulled=true;group.add(mesh)}}this.group.add(group);this.chunkMeshes.set(key,group);}
    disposeChunk(group){this.group.remove(group);group.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    raycast(origin,dir,maxDist=6){let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z);const sx=dir.x>0?1:-1,sy=dir.y>0?1:-1,sz=dir.z>0?1:-1;const dx=dir.x!==0?Math.abs(1/dir.x):Infinity,dy=dir.y!==0?Math.abs(1/dir.y):Infinity,dz=dir.z!==0?Math.abs(1/dir.z):Infinity;let tx=dir.x>0?(x+1-origin.x)*dx:(origin.x-x)*dx,ty=dir.y>0?(y+1-origin.y)*dy:(origin.y-y)*dy,tz=dir.z>0?(z+1-origin.z)*dz:(origin.z-z)*dz,dist=0,normal={x:0,y:0,z:0};for(let i=0;i<128&&dist<=maxDist;i++){const id=this.getBlock(x,y,z);if(id!==B.AIR&&id!==B.WATER&&id!==B.LAVA&&id!==B.TALL_GRASS){return{x,y,z,id,normal,distance:dist,place:{x:x+normal.x,y:y+normal.y,z:z+normal.z}}}if(tx<ty&&tx<tz){x+=sx;dist=tx;tx+=dx;normal={x:-sx,y:0,z:0}}else if(ty<tz){y+=sy;dist=ty;ty+=dy;normal={x:0,y:-sy,z:0}}else{z+=sz;dist=tz;tz+=dz;normal={x:0,y:0,z:-sz}}}return null}
    nearbyTorches(x,y,z,r=12){const out=[];for(let yy=Math.max(0,Math.floor(y-r));yy<Math.min(H,Math.ceil(y+r));yy++)for(let zz=Math.floor(z-r);zz<=Math.ceil(z+r);zz++)for(let xx=Math.floor(x-r);xx<=Math.ceil(x+r);xx++)if(this.getBlock(xx,yy,zz)===B.TORCH)out.push({x:xx+.5,y:yy+.7,z:zz+.5});return out.slice(0,12)}
    tickFurnaces(dt){for(const e of Object.values(this.blockEntities)){if(e.type!=='furnace')continue;if(e.burn>0)e.burn=Math.max(0,e.burn-dt);const recipe=e.input&&V.Smelts[e.input.key],fuel=e.fuel&&V.Items[e.fuel.key]&&V.Items[e.fuel.key].fuel;if(recipe&&e.burn<=0&&fuel){e.burn=e.burnMax=fuel;e.fuel.count--;if(e.fuel.count<=0)e.fuel=null}if(recipe&&e.burn>0){const out=e.output;if(!out||(out.key===recipe[0]&&out.count+recipe[1]<=V.itemMax(out))){e.progress+=dt;if(e.progress>=10){e.progress=0;e.input.count--;if(e.input.count<=0)e.input=null;if(out)out.count+=recipe[1];else e.output=V.makeStack(recipe[0],recipe[1])}}}else e.progress=Math.max(0,e.progress-dt*2)}}
    serialize(){this.saveDimensionState();this.data.dimensionStates=this.dimensionStates;const over=this.dimensionStates.overworld;this.data.modified=over.modified;this.data.blockEntities=over.blockEntities;this.data.explored=over.explored;this.data.dimension=this.dimension;}
  }
  V.World=World;
})();
