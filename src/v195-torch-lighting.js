(function(){
'use strict';
const V=window.Voidlands,B=V.B,GP=V.Game.prototype,WP=V.World.prototype,PP=V.Player.prototype;
V.VERSION='1.9.5';

/* -------------------------------------------------------------------------
   Fire block. It deliberately reuses the existing animated-looking lava tile
   so the update remains fully offline and does not add a fragile asset path.
------------------------------------------------------------------------- */
if(B.FIRE==null)B.FIRE=56;
if(!V.Blocks[B.FIRE]){
  V.Blocks[B.FIRE]={
    id:B.FIRE,key:'fire',name:'Fire',solid:false,opaque:false,transparent:true,
    fluid:false,cutout:true,hardness:.02,tool:'any',requiresTool:false,minTier:0,
    drop:null,maxStack:0,sound:'wood',textures:['lava','lava','lava','lava','lava','lava'],
    placeable:false,emission:1
  };
  V.BlockByKey.fire=V.Blocks[B.FIRE];
}

function distanceSquared(ax,ay,az,bx,by,bz){
  const dx=ax-bx,dy=ay-by,dz=az-bz;return dx*dx+dy*dy+dz*dz;
}
function nightStrength(game){
  if(game.world&&game.world.dimension!=='overworld')return 1;
  const t=V.mod(Number(game.data&&game.data.time)||0,24000);
  if(t>=13000&&t<=22000)return 1;
  if(t>11000&&t<13000)return (t-11000)/2000;
  if(t>22000)return Math.max(0,(24000-t)/2000);
  return 0;
}
function lightStyle(type,night,vibrant,shaders){
  const boosted=shaders?.45:0;
  if(type==='furnace')return{
    colour:vibrant||shaders?0xff8a36:0xff7b24,
    intensity:V.lerp(2.0,6.2+boosted,night),distance:V.lerp(11,18,night),decay:V.lerp(1.55,1.18,night),
    glow:.16+night*.28,size:.82+night*.3
  };
  if(type==='fire')return{
    colour:vibrant||shaders?0xff9f3f:0xff8428,
    intensity:V.lerp(2.45,7.2+boosted,night),distance:V.lerp(12,20,night),decay:V.lerp(1.5,1.12,night),
    glow:.2+night*.4,size:1+night*.45
  };
  return{
    colour:vibrant||shaders?0xffad54:0xff9b3f,
    intensity:V.lerp(vibrant?2.7:2.35,vibrant?7.7:6.9,night)+boosted,
    distance:V.lerp(vibrant?15:14,shaders?22:20,night),decay:V.lerp(1.45,1.1,night),
    glow:.2+night*.38,size:.9+night*.5
  };
}

/* Return closest local light emitters first. The original torch scan returned
   them in coordinate order and truncated the result, which could ignore the
   torch beside the player while lighting a distant one instead. */
WP.nearbyLightSources=function(x,y,z,r=20,max=24){
  const out=[],r2=r*r,minY=Math.max(0,Math.floor(y-12)),maxY=Math.min(V.WORLD_HEIGHT-1,Math.ceil(y+12));
  const minX=Math.floor(x-r),maxX=Math.ceil(x+r),minZ=Math.floor(z-r),maxZ=Math.ceil(z+r);
  for(let yy=minY;yy<=maxY;yy++)for(let zz=minZ;zz<=maxZ;zz++)for(let xx=minX;xx<=maxX;xx++){
    const id=this.getBlock(xx,yy,zz);if(id!==B.TORCH&&id!==B.FIRE)continue;
    const py=id===B.TORCH?yy+.72:yy+.48,d2=distanceSquared(xx+.5,py,zz+.5,x,y,z);
    if(d2<=r2)out.push({x:xx+.5,y:py,z:zz+.5,d2,type:id===B.TORCH?'torch':'fire'});
  }
  for(const [key,entity] of Object.entries(this.blockEntities||{})){
    if(!entity||entity.type!=='furnace'||!(entity.burn>0))continue;
    const parts=key.split(',').map(Number);if(parts.length!==3||parts.some(Number.isNaN))continue;
    const [fx,fy,fz]=parts;if(this.getBlock(fx,fy,fz)!==B.FURNACE)continue;
    const d2=distanceSquared(fx+.5,fy+.55,fz+.5,x,y,z);if(d2<=r2)out.push({x:fx+.5,y:fy+.55,z:fz+.5,d2,type:'furnace'});
  }
  out.sort((a,b)=>a.d2-b.d2);
  return out.slice(0,max);
};
WP.nearbyTorches=function(x,y,z,r=20){return this.nearbyLightSources(x,y,z,r,24).filter(source=>source.type==='torch')};

/* Fire persists on Netherrack and expires elsewhere. It is saved as an
   ordinary modified block plus a block entity, so reloading cannot orphan it. */
WP.createFire=function(x,y,z){
  x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);
  const current=this.getBlock(x,y,z);if(![B.AIR,B.TALL_GRASS,B.RED_FLOWER,B.GOLD_FLOWER].includes(current))return false;
  const neighbours=[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
  const supported=neighbours.some(([dx,dy,dz])=>{const def=V.Blocks[this.getBlock(x+dx,y+dy,z+dz)];return !!(def&&def.solid)});
  if(!supported)return false;
  if(!this.setBlock(x,y,z,B.FIRE,false))return false;
  const below=this.getBlock(x,y-1,z),permanent=below===B.EMBERSTONE;
  this.blockEntities[V.blockKey(x,y,z)]={type:'fire',age:0,life:permanent?Infinity:28+Math.random()*24,permanent};
  return true;
};
WP.tickFire=function(dt){
  this.fireTick=(this.fireTick||0)+dt;if(this.fireTick<.2)return;dt=this.fireTick;this.fireTick=0;
  for(const [key,entity] of Object.entries(this.blockEntities||{})){
    if(!entity||entity.type!=='fire')continue;
    const [x,y,z]=key.split(',').map(Number);
    if(this.getBlock(x,y,z)!==B.FIRE){delete this.blockEntities[key];continue}
    const supported=[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].some(([dx,dy,dz])=>{const def=V.Blocks[this.getBlock(x+dx,y+dy,z+dz)];return !!(def&&def.solid)});
    const rain=this.dimension==='overworld'&&this.game.weather==='rain'&&this.canSeeSky(x,y,z);
    if(!supported||rain){this.setBlock(x,y,z,B.AIR,false);continue}
    entity.age=(entity.age||0)+dt;
    if(!entity.permanent&&entity.age>Number(entity.life||36))this.setBlock(x,y,z,B.AIR,false);
  }
};

function ensureLightRig(game){
  const targetCount=24;
  while(game.torchLights.length<targetCount){
    const light=new THREE.PointLight(0xff9b3f,0,18,1.2);light.name='LocalBlockLight';game.scene.add(light);game.torchLights.push(light);
  }
  if(!game.localGlowGroup){
    game.localGlowGroup=new THREE.Group();game.localGlowGroup.name='LocalBlockGlows';game.scene.add(game.localGlowGroup);
    const geometry=new THREE.SphereGeometry(.22,8,6);
    for(let i=0;i<targetCount;i++){
      const material=new THREE.MeshBasicMaterial({color:0xffa342,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
      const glow=new THREE.Mesh(geometry,material);glow.visible=false;glow.renderOrder=3;game.localGlowGroup.add(glow);
    }
  }
  if(!game.heldTorchLight){game.heldTorchLight=new THREE.PointLight(0xffa34a,0,13,1.2);game.heldTorchLight.name='HeldTorchLight';game.scene.add(game.heldTorchLight)}
}

GP.updateTorches=function(dt){
  this.torchTimer=(this.torchTimer||0)-dt;if(this.torchTimer>0)return;this.torchTimer=.22;
  ensureLightRig(this);
  const night=nightStrength(this),vibrant=!!this.settings.vibrantVisuals,shaders=!!this.settings.shadersMod;
  const radius=17+night*5+(vibrant?1:0),sources=this.world.nearbyLightSources(this.player.position.x,this.player.position.y+1,this.player.position.z,radius,24);
  const pulse=1+Math.sin(performance.now()*.009)*.025;
  this.torchLights.forEach((light,index)=>{
    const source=sources[index],glow=this.localGlowGroup.children[index];
    if(!source){light.intensity=0;if(glow){glow.visible=false;glow.material.opacity=0}return}
    const style=lightStyle(source.type,night,vibrant,shaders);
    light.position.set(source.x,source.y,source.z);light.color.set(style.colour);light.distance=style.distance;light.decay=style.decay;light.intensity=style.intensity*pulse;
    if(glow){glow.visible=true;glow.position.set(source.x,source.y,source.z);glow.scale.set(style.size,style.size,style.size);glow.material.color.set(style.colour);glow.material.opacity=style.glow}
  });
  const main=this.inventory&&this.inventory.selectedStack&&this.inventory.selectedStack(),off=this.inventory&&this.inventory.offhand;
  const holdingTorch=(main&&main.key==='torch')||(off&&off.key==='torch');
  if(holdingTorch){
    const eye=this.player.eyePosition(),dir=this.player.viewDirection();this.heldTorchLight.position.copy(eye).addScaledVector(dir,.35);this.heldTorchLight.position.y-=.28;
    this.heldTorchLight.distance=V.lerp(9.5,15,night);this.heldTorchLight.decay=1.18;this.heldTorchLight.intensity=V.lerp(1.5,4.8,night);this.heldTorchLight.color.set(0xffa34a);
  }else this.heldTorchLight.intensity=0;
};

/* Flint and Steel keeps portal ignition, but now creates actual fire when the
   targeted arrangement is not a valid portal frame. */
const previousUseOrPlace=GP.useOrPlace;
GP.useOrPlace=function(){
  const stack=this.inventory&&this.inventory.selectedStack&&this.inventory.selectedStack();
  if(stack&&stack.key==='flint_and_steel'){
    const origin=this.player.eyePosition(),direction=this.player.viewDirection();
    const hit=this.world.raycast(origin,direction,this.mode==='creative'?8:5.2)||this.target;
    if(hit&&this.world.dimension!=='starreach'&&V.lightNetherPortal&&V.lightNetherPortal(this.world,hit.x,hit.y,hit.z)){
      if(this.mode!=='creative')this.inventory.damageSelected(1);this.audio.play('place');this.visuals.swing('use');
      this.ui.toast(this.world.dimension==='emberdeep'?'Nether portal lit — enter it to return to the Overworld':'Nether portal lit');this.ui.refreshHUD();this.save();return true;
    }
    if(hit&&hit.place&&this.world.createFire(hit.place.x,hit.place.y,hit.place.z)){
      if(this.mode!=='creative')this.inventory.damageSelected(1);this.audio.play('place');this.visuals.swing('use');this.spawnParticles(hit.place.x+.5,hit.place.y+.45,hit.place.z+.5,B.LAVA);this.ui.refreshHUD();return true;
    }
  }
  return previousUseOrPlace.call(this);
};

const previousFixedUpdate=GP.fixedUpdate;
GP.fixedUpdate=function(dt){const result=previousFixedUpdate.call(this,dt);if(this.world&&this.world.tickFire)this.world.tickFire(dt);return result};
const previousEnvironment=PP.updateEnvironment;
PP.updateEnvironment=function(dt){
  const result=previousEnvironment.call(this,dt),x=Math.floor(this.position.x),z=Math.floor(this.position.z);
  const feet=this.world.getBlock(x,Math.floor(this.position.y+.12),z),body=this.world.getBlock(x,Math.floor(this.position.y+1.02),z);
  if(feet===B.FIRE||body===B.FIRE){this.fireTime=Math.max(this.fireTime,4);this.damage(.8*dt,'burned in fire',true)}
  return result;
};

const previousDestroy=GP.destroy;
GP.destroy=function(){
  if(this.localGlowGroup){for(const glow of this.localGlowGroup.children){if(glow.material)glow.material.dispose()}const first=this.localGlowGroup.children[0];if(first&&first.geometry)first.geometry.dispose();this.scene.remove(this.localGlowGroup);this.localGlowGroup=null}
  if(this.heldTorchLight){this.scene.remove(this.heldTorchLight);this.heldTorchLight=null}
  return previousDestroy?previousDestroy.call(this):undefined;
};
})();
