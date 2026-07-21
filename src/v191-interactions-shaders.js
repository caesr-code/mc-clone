(function(){
'use strict';
const V=window.Voidlands,B=V.B;
V.VERSION='1.9.1';
V.DEFAULT_SETTINGS.shadersMod=!!V.DEFAULT_SETTINGS.shadersMod;

const GP=V.Game.prototype;

/* -------------------------------------------------------------------------
   Reliable block interaction on the use button.
   Right click opens or uses interactive blocks; left click is reserved for
   attacking and mining every block, including crafting tables and chests.
------------------------------------------------------------------------- */
GP.interactBlock=function(target,source='use'){
  if(!target)return false;
  const id=this.world.getBlock(target.x,target.y,target.z),def=V.Blocks[id];
  if(id===B.DOOR){this.world.toggleDoor(target.x,target.y,target.z);this.audio.play('door');this.visuals.swing('use');return true}
  if(id===B.BED){this.visuals.swing('use');this.useBed(target.x,target.y,target.z);return true}
  if(def&&def.interact){
    const entity=this.world.ensureBlockEntity(target.x,target.y,target.z,def.interact);
    this.visuals.swing('use');
    this.openInventory(def.interact,entity);
    return true;
  }
  return false;
};
GP.closestEntityRayDistance=function(origin,dir,maxDist){
  if(!this.entities||!this.entities.mobs||!this.entities.rayAABB)return null;
  let best=null;
  for(const mob of this.entities.mobs){
    if(!mob||mob.dead||!mob.aabb)continue;
    const a=mob.aabb(),pad=.16,box={minX:a.minX-pad,maxX:a.maxX+pad,minY:a.minY-.08,maxY:a.maxY+pad,minZ:a.minZ-pad,maxZ:a.maxZ+pad};
    const t=this.entities.rayAABB(origin,dir,box,best==null?maxDist:best);
    if(t!=null&&(best==null||t<best))best=t;
  }
  return best;
};
const previousUseOrPlace=GP.useOrPlace;
GP.useOrPlace=function(){
  const origin=this.player.eyePosition(),dir=this.player.viewDirection(),block=this.world.raycast(origin,dir,this.mode==='creative'?8:5.2);
  const villager=this.entities&&this.entities.findVillagerRay&&this.entities.findVillagerRay(origin,dir,4.8);
  if(block&&(!villager||block.distance<villager.distance-.02)&&this.interactBlock(block,'use'))return true;
  return previousUseOrPlace.call(this);
};

/* -------------------------------------------------------------------------
   /gamemode command with aliases and clear feedback.
------------------------------------------------------------------------- */
const previousHandleChat=GP.handleChat;
GP.setGameMode=function(mode){
  const aliases={c:'creative',creative:'creative','1':'creative',s:'survival',survival:'survival','0':'survival',h:'hardcore',hardcore:'hardcore'};
  const next=aliases[String(mode||'').toLowerCase()];
  if(!next)return false;
  this.mode=next;this.data.mode=next;this.inventory.mode=next;
  if(next==='hardcore'){this.difficulty='hard';this.data.difficulty='hard';this.player.flying=false;this.player.sprintLatched=false}
  if(next==='survival'){this.player.flying=false;this.player.sprintLatched=false}
  if(next==='creative'){this.player.health=20;this.player.hunger=20;this.player.saturation=20}
  this.ui.refreshHUD();this.ui.chat(`Game mode set to ${next}.`);this.save();return true;
};
GP.handleChat=function(value){
  const match=String(value||'').trim().match(/^\/(?:gamemode|gm)(?:\s+(\S+))?$/i);
  if(match){
    if(!match[1]){this.ui.chat(`Current game mode: ${this.mode}. Use /gamemode survival, creative, or hardcore.`);return}
    if(!this.setGameMode(match[1]))this.ui.chat('Usage: /gamemode survival|creative|hardcore');
    return;
  }
  return previousHandleChat.call(this,value);
};

/* -------------------------------------------------------------------------
   First-person cleanup: an equipped item replaces that hand/arm on screen.
------------------------------------------------------------------------- */
const PVP=V.PlayerVisuals&&V.PlayerVisuals.prototype;
if(PVP){
  const previousVisualUpdate=PVP.update;
  PVP.update=function(dt){
    const result=previousVisualUpdate.call(this,dt);
    const main=!!this.mainKey,off=!!this.offKey;
    if(this.fpArm)this.fpArm.visible=!main;
    if(this.fpArmOuter)this.fpArmOuter.visible=!main;
    if(this.fpOffArm)this.fpOffArm.visible=!off;
    if(this.fpOffArmOuter)this.fpOffArmOuter.visible=!off;
    return result;
  };
}

/* -------------------------------------------------------------------------
   Aurora Shaders: dependency-free screen-space shader post-processing.
------------------------------------------------------------------------- */
GP.ensureShaderPipeline=function(){
  if(this.shaderPipelineReady)return true;
  if(!THREE.WebGLRenderTarget||!THREE.ShaderMaterial||!THREE.OrthographicCamera||!THREE.Vector2||!this.renderer.setRenderTarget)return false;
  const ratio=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,this.settings.graphics==='fast'?1:this.settings.graphics==='ultra'?1.7:1.35);
  const width=Math.max(1,Math.floor((typeof innerWidth==='number'?innerWidth:1280)*ratio));
  const height=Math.max(1,Math.floor((typeof innerHeight==='number'?innerHeight:720)*ratio));
  this.shaderTarget=new THREE.WebGLRenderTarget(width,height,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false});
  this.shaderScene=new THREE.Scene();
  this.shaderCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.shaderMaterial=new THREE.ShaderMaterial({
    uniforms:{tDiffuse:{value:this.shaderTarget.texture},resolution:{value:new THREE.Vector2(width,height)},time:{value:0},strength:{value:1},night:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:`
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float time;
      uniform float strength;
      uniform float night;
      varying vec2 vUv;
      float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
      vec3 sat(vec3 c,float s){float y=luma(c);return mix(vec3(y),c,s);}
      void main(){
        vec2 px=1.0/resolution;
        vec2 fromCenter=vUv-.5;
        float edge=dot(fromCenter,fromCenter);
        float aberr=.65*strength*(.2+edge*2.3);
        vec3 base;
        base.r=texture2D(tDiffuse,vUv+vec2(px.x*aberr,0.0)).r;
        base.g=texture2D(tDiffuse,vUv).g;
        base.b=texture2D(tDiffuse,vUv-vec2(px.x*aberr,0.0)).b;
        vec3 n=texture2D(tDiffuse,vUv+vec2(0.0,px.y*1.5)).rgb;
        vec3 s=texture2D(tDiffuse,vUv-vec2(0.0,px.y*1.5)).rgb;
        vec3 e=texture2D(tDiffuse,vUv+vec2(px.x*1.5,0.0)).rgb;
        vec3 w=texture2D(tDiffuse,vUv-vec2(px.x*1.5,0.0)).rgb;
        vec3 sharp=base*1.34-(n+s+e+w)*.085;
        vec3 b1=texture2D(tDiffuse,vUv+px*vec2(3.0,2.0)).rgb;
        vec3 b2=texture2D(tDiffuse,vUv+px*vec2(-3.0,2.0)).rgb;
        vec3 b3=texture2D(tDiffuse,vUv+px*vec2(3.0,-2.0)).rgb;
        vec3 b4=texture2D(tDiffuse,vUv+px*vec2(-3.0,-2.0)).rgb;
        vec3 glow=(b1+b2+b3+b4)*.25;
        glow*=smoothstep(.56,1.15,luma(glow));
        vec3 col=mix(base,sharp,.42*strength)+glow*.34*strength;
        col=(col-.5)*(1.08+.08*strength)+.5;
        col=sat(col,1.0+.17*strength);
        float hi=smoothstep(.42,1.0,luma(col));
        float lo=1.0-smoothstep(.08,.48,luma(col));
        col+=vec3(.045,.018,-.012)*hi*strength;
        col+=vec3(-.012,.012,.045)*lo*strength*(.45+.35*night);
        float vignette=smoothstep(.46,.98,edge*1.85);
        col*=1.0-vignette*(.22+.08*night)*strength;
        float grain=fract(sin(dot(vUv*resolution+time*31.7,vec2(12.9898,78.233)))*43758.5453)-.5;
        col+=grain*.012*strength;
        gl_FragColor=vec4(max(col,0.0),1.0);
      }`,
    depthTest:false,depthWrite:false,toneMapped:false
  });
  this.shaderQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.shaderMaterial);
  this.shaderScene.add(this.shaderQuad);this.shaderPipelineReady=true;return true;
};
GP.resizeShaderPipeline=function(){
  if(!this.shaderTarget||!this.shaderMaterial)return;
  const ratio=Math.min(typeof devicePixelRatio==='number'?devicePixelRatio:1,this.settings.graphics==='fast'?1:this.settings.graphics==='ultra'?1.7:1.35),w=Math.max(1,Math.floor(innerWidth*ratio)),h=Math.max(1,Math.floor(innerHeight*ratio));
  this.shaderTarget.setSize(w,h);this.shaderMaterial.uniforms.resolution.value.set(w,h);
};
const previousResize=GP.resize;
GP.resize=function(){const result=previousResize.call(this);this.resizeShaderPipeline();return result};
const previousApplySettings=GP.applySettings;
GP.applySettings=function(){
  const result=previousApplySettings.call(this),enabled=!!this.settings.shadersMod;
  this.canvas.classList.toggle('aurora-shaders',enabled);
  if(enabled){this.ensureShaderPipeline();this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=this.settings.vibrantVisuals?1.12:1.06}
  return result;
};
const previousRenderFrame=GP.renderFrame;
GP.renderFrame=function(){
  if(!this.settings.shadersMod||!this.ensureShaderPipeline())return previousRenderFrame.call(this);
  const renderer=this.renderer;
  this.shaderMaterial.uniforms.time.value=(typeof performance!=='undefined'?performance.now():0)/1000;
  this.shaderMaterial.uniforms.strength.value=this.settings.graphics==='fast'?.72:this.settings.graphics==='ultra'?1.2:1;
  this.shaderMaterial.uniforms.night.value=this.isNight&&this.isNight()?1:0;
  renderer.autoClear=true;renderer.setRenderTarget(this.shaderTarget);if(renderer.clear)renderer.clear();renderer.render(this.scene,this.camera);
  renderer.setRenderTarget(null);renderer.autoClear=true;if(renderer.clear)renderer.clear();renderer.render(this.shaderScene,this.shaderCamera);
  if(this.viewScene&&this.viewCamera&&this.visuals&&this.visuals.firstPerson.visible){renderer.autoClear=false;renderer.clearDepth();renderer.render(this.viewScene,this.viewCamera);renderer.autoClear=true}
};
const previousDestroy=GP.destroy;
GP.destroy=function(){
  if(this.shaderTarget)this.shaderTarget.dispose();
  if(this.shaderQuad&&this.shaderQuad.geometry)this.shaderQuad.geometry.dispose();
  if(this.shaderMaterial)this.shaderMaterial.dispose();
  this.shaderTarget=this.shaderQuad=this.shaderMaterial=this.shaderScene=this.shaderCamera=null;
  return previousDestroy.call(this);
};

/* -------------------------------------------------------------------------
   Settings and Mods UI wiring.
------------------------------------------------------------------------- */
const UIP=V.UI.prototype,previousLoadOptions=UIP.loadOptions,previousSaveOptions=UIP.saveOptions,previousAction=UIP.action;
UIP.loadOptions=function(){
  const result=previousLoadOptions.call(this),enabled=!!this.app.settings.shadersMod;
  const option=this.q('#auroraShaders'),mod=this.q('#auroraShadersMod');if(option)option.checked=enabled;if(mod)mod.checked=enabled;return result;
};
UIP.saveOptions=function(){const option=this.q('#auroraShaders');if(option)this.app.settings.shadersMod=!!option.checked;return previousSaveOptions.call(this)};
UIP.action=function(action){
  if(action==='save-mods'){
    const vibrant=this.q('#vibrantVisualsMod'),shader=this.q('#auroraShadersMod');
    this.app.settings.vibrantVisuals=!!(vibrant&&vibrant.checked);this.app.settings.shadersMod=!!(shader&&shader.checked);
    this.app.storage.saveSettings(this.app.settings);
    if(this.app.game)this.app.game.applySettings();else if(this.app.panorama&&this.app.panorama.setVibrant)this.app.panorama.setVibrant(this.app.settings.vibrantVisuals||this.app.settings.shadersMod);
    this.loadOptions();this.show(this.returnScreen);return;
  }
  return previousAction.call(this,action);
};

})();
