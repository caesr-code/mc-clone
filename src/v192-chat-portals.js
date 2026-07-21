(function(){
'use strict';
const V=window.Voidlands,B=V.B,GP=V.Game.prototype;
V.VERSION='1.9.2';

/* -------------------------------------------------------------------------
   Text-entry focus guard.
   Gameplay shortcuts are registered on document in the capture phase. The
   guard must run before those shortcuts call preventDefault, otherwise keys
   such as W, A, S, D, E, Q, T, C and F never reach the chat input.
------------------------------------------------------------------------- */
function isTextEntryTarget(target){
  if(!target)return false;
  if(target.isContentEditable)return true;
  const tag=String(target.tagName||'').toUpperCase();
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return true;
  return !!(target.closest&&target.closest('input,textarea,select,[contenteditable="true"]'));
}
V.isTextEntryTarget=isTextEntryTarget;

const previousKeyDown=GP.keyDown;
GP.keyDown=function(event){
  if(this.state==='chat'||isTextEntryTarget(event&&event.target))return;
  return previousKeyDown.call(this,event);
};
const previousKeyUp=GP.keyUp;
GP.keyUp=function(event){
  if(this.state==='chat'||isTextEntryTarget(event&&event.target))return;
  return previousKeyUp.call(this,event);
};

/* -------------------------------------------------------------------------
   Dimension-safe Nether portal ignition.
   A standard 4 x 5 Obsidian frame can be lit in either the Overworld or the
   Nether. A lit Nether portal always routes back to the Overworld.
------------------------------------------------------------------------- */
function frameAt(world,x0,y0,z0,axis){
  for(let width=0;width<4;width++)for(let height=0;height<5;height++){
    const border=width===0||width===3||height===0||height===4;
    const x=x0+(axis==='x'?width:0),z=z0+(axis==='z'?width:0);
    const id=world.getBlock(x,y0+height,z);
    if(border){if(id!==B.OBSIDIAN)return null}
    else if(id!==B.AIR&&id!==B.EMBER_PORTAL)return null;
  }
  return{x0,y0,z0,axis};
}
function findFrame(world,x,y,z){
  for(const axis of ['x','z']){
    for(let widthOffset=-3;widthOffset<=0;widthOffset++){
      for(let heightOffset=-4;heightOffset<=0;heightOffset++){
        const x0=x+(axis==='x'?widthOffset:0);
        const z0=z+(axis==='z'?widthOffset:0);
        const found=frameAt(world,x0,y+heightOffset,z0,axis);
        if(found)return found;
      }
    }
  }
  return null;
}
function lightFrame(world,frame){
  if(!frame)return false;
  for(let width=1;width<=2;width++)for(let height=1;height<=3;height++){
    const x=frame.x0+(frame.axis==='x'?width:0);
    const z=frame.z0+(frame.axis==='z'?width:0);
    world.setBlock(x,frame.y0+height,z,B.EMBER_PORTAL,false);
  }
  return true;
}
V.findNetherPortalFrame=findFrame;
V.lightNetherPortal=function(world,x,y,z){
  if(!world||world.dimension==='starreach')return false;
  return lightFrame(world,findFrame(world,Math.floor(x),Math.floor(y),Math.floor(z)));
};

const previousUseOrPlace=GP.useOrPlace;
GP.useOrPlace=function(){
  const stack=this.inventory&&this.inventory.selectedStack&&this.inventory.selectedStack();
  if(stack&&stack.key==='flint_and_steel'&&this.world&&this.world.dimension!=='starreach'){
    const origin=this.player.eyePosition(),direction=this.player.viewDirection();
    const hit=this.world.raycast(origin,direction,this.mode==='creative'?8:5.2)||this.target;
    if(hit&&V.lightNetherPortal(this.world,hit.x,hit.y,hit.z)){
      if(this.mode!=='creative')this.inventory.damageSelected(1);
      if(this.audio)this.audio.play('place');
      if(this.visuals)this.visuals.swing('use');
      const returning=this.world.dimension==='emberdeep';
      this.ui.toast(returning?'Nether portal lit — enter it to return to the Overworld':'Nether portal lit');
      this.ui.refreshHUD();
      this.save();
      return true;
    }
  }
  return previousUseOrPlace.call(this);
};

/* Keep the destination rule explicit even if other dimension patches change. */
GP.portalDestination=function(portalBlock){
  if(portalBlock===B.EMBER_PORTAL)return this.world.dimension==='emberdeep'?'overworld':'emberdeep';
  if(portalBlock===B.STAR_PORTAL)return this.world.dimension==='overworld'?'starreach':'overworld';
  return null;
};
GP.updatePortal=function(dt){
  this.portalCooldown=Math.max(0,(this.portalCooldown||0)-dt);
  const p=this.player.position,x=Math.floor(p.x),z=Math.floor(p.z);
  const ids=[
    this.world.getBlock(x,Math.floor(p.y+.25),z),
    this.world.getBlock(x,Math.floor(p.y+1.1),z)
  ];
  const portal=ids.find(id=>id===B.EMBER_PORTAL||id===B.STAR_PORTAL);
  const destination=portal&&this.portalDestination(portal);
  if(!destination||this.portalCooldown>0){this.portalTime=0;return}
  this.portalTime=(this.portalTime||0)+dt;
  if(this.portalTime>.25&&this.portalTime-dt<=.25)this.ui.toast('Hold still inside the portal…');
  if(this.portalTime>=1.35)this.switchDimension(destination);
};
})();
