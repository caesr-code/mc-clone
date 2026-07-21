(function(){
  'use strict';
  const V=window.Voidlands,B=V.B;
  class Player{
    constructor(game,data){
      this.game=game;this.world=game.world;this.position=new THREE.Vector3();this.velocity=new THREE.Vector3();this.yaw=0;this.pitch=0;this.width=.6;this.height=1.8;this.eye=1.62;this.grounded=false;this.inWater=false;this.headWater=false;this.inLava=false;this.sprinting=false;this.sprintLatched=false;this.sneaking=false;this.flying=false;this.perspective=0;this.lastSpace=-Infinity;this.lastForward=-Infinity;this.stepTimer=0;this.walkDistance=0;this.fallStart=null;this.health=20;this.hunger=20;this.saturation=5;this.air=10;this.xp=0;this.level=0;this.fireTime=0;this.dead=false;this.invulnerable=0;this.regenTimer=0;this.hungerTimer=0;this.eatTime=0;this.eating=false;this.spawn=this.world.findSpawn();this.load(data);
      if(!data){this.position.set(this.spawn.x,this.spawn.y,this.spawn.z);this.yaw=Math.PI}
      this.ensureSafePosition();
    }
    load(d){if(!d)return;if(d.position)this.position.set(d.position.x,d.position.y,d.position.z);this.yaw=d.yaw||0;this.pitch=d.pitch||0;this.health=d.health==null?20:d.health;this.hunger=d.hunger==null?20:d.hunger;this.saturation=d.saturation==null?5:d.saturation;this.air=d.air==null?10:d.air;this.xp=d.xp||0;this.level=d.level||0;this.flying=!!d.flying&&this.game.mode==='creative';}
    serialize(){return{position:{x:this.position.x,y:this.position.y,z:this.position.z},yaw:this.yaw,pitch:this.pitch,health:this.health,hunger:this.hunger,saturation:this.saturation,air:this.air,xp:this.xp,level:this.level,flying:this.flying}}
    ensureSafePosition(){if(!this.collidesAt(this.position))return;const x=Math.floor(this.position.x),z=Math.floor(this.position.z),y=this.world.getSurfaceY(x,z);this.position.set(x+.5,y+.02,z+.5);this.velocity.set(0,0,0)}
    aabbAt(pos){return{minX:pos.x-this.width/2,maxX:pos.x+this.width/2,minY:pos.y,maxY:pos.y+this.height,minZ:pos.z-this.width/2,maxZ:pos.z+this.width/2}}
    boxesAround(a){const out=[];for(let y=Math.floor(a.minY);y<=Math.floor(a.maxY);y++)for(let z=Math.floor(a.minZ);z<=Math.floor(a.maxZ);z++)for(let x=Math.floor(a.minX);x<=Math.floor(a.maxX);x++)out.push(...this.world.collisionBoxes(x,y,z));return out}
    intersects(a,b){return a.maxX>b.minX&&a.minX<b.maxX&&a.maxY>b.minY&&a.minY<b.maxY&&a.maxZ>b.minZ&&a.minZ<b.maxZ}
    collidesAt(pos){const a=this.aabbAt(pos);return this.boxesAround(a).some(b=>this.intersects(a,b))}
    moveAxis(axis,delta){if(!delta)return false;let collided=false;const steps=Math.max(1,Math.ceil(Math.abs(delta)/.22)),part=delta/steps;for(let n=0;n<steps;n++){
        this.position[axis]+=part;let a=this.aabbAt(this.position),boxes=this.boxesAround(a),hit=false;
        for(const b of boxes){if(!this.intersects(a,b))continue;hit=true;collided=true;if(axis==='x'){this.position.x=part>0?b.minX-this.width/2:b.maxX+this.width/2;this.velocity.x=0}else if(axis==='z'){this.position.z=part>0?b.minZ-this.width/2:b.maxZ+this.width/2;this.velocity.z=0}else{if(part>0){this.position.y=b.minY-this.height;this.velocity.y=0}else{this.position.y=b.maxY;this.velocity.y=0;this.grounded=true}}a=this.aabbAt(this.position)}if(hit&&axis!=='y')break}
      return collided;
    }
    tryHorizontal(axis,delta){if(!delta)return;const before=this.position.clone(),blocked=this.moveAxis(axis,delta);if(blocked&&this.grounded&&!this.sneaking&&!this.flying){this.position.copy(before);const raised=before.clone();raised.y+=.61;if(!this.collidesAt(raised)){this.position.copy(raised);const blocked2=this.moveAxis(axis,delta);if(!blocked2){this.grounded=false;this.moveAxis('y',-.62);return}}this.position.copy(before)}
    }
    isSupportedAt(x,z){const test=this.position.clone();test.x=x;test.z=z;test.y-=.08;return this.collidesAt(test)}
    onJumpPress(){const now=V.now();if(this.game.mode==='creative'&&now-this.lastSpace<.32){this.flying=!this.flying;this.velocity.y=0;this.game.ui.toast(this.flying?'Flight enabled':'Flight disabled')}this.lastSpace=now}
    onForwardPress(){const now=V.now();if(now-this.lastForward<.28&&this.hunger>6&&!this.sneaking){this.sprintLatched=true;this.sprinting=true}this.lastForward=now}
    look(dx,dy){const s=this.game.settings.sensitivity;this.yaw-=dx*s;this.pitch+=dy*s*(this.game.settings.invertMouse?1:-1);this.pitch=V.clamp(this.pitch,-Math.PI/2+.01,Math.PI/2-.01)}
    update(dt){if(this.dead)return;this.invulnerable=Math.max(0,this.invulnerable-dt);const mode=this.game.mode,down=a=>this.game.isActionDown(a),forward=down('forward'),back=down('back'),left=down('left'),right=down('right');this.sneaking=down('sneak');const forwardOnly=forward&&!back&&!this.sneaking,canSprint=this.game.mode==='creative'||this.hunger>6,wantsSprint=canSprint&&!this.eating&&(down('sprint')||this.sprintLatched)&&forwardOnly;this.sprinting=wantsSprint;let mx=(right?1:0)-(left?1:0),mz=(back?1:0)-(forward?1:0);const moving=mx!==0||mz!==0;if(!forward||back||this.sneaking||!canSprint){this.sprinting=false;this.sprintLatched=false;}
      this.updateEnvironment(dt);
      if(mode==='creative'&&this.flying){let speed=wantsSprint?11:7;if(this.sneaking)speed=3;const len=Math.hypot(mx,mz)||1,mxN=mx/len,mzN=mz/len,sin=Math.sin(this.yaw),cos=Math.cos(this.yaw);this.velocity.x=(mxN*cos+mzN*sin)*speed;this.velocity.z=(-mxN*sin+mzN*cos)*speed;this.velocity.y=(down('jump')?speed:0)-(down('sneak')?speed:0);this.position.addScaledVector(this.velocity,dt);this.grounded=false;}
      else{
        let speed=this.inWater?2.4:this.sneaking?1.55:wantsSprint&&this.hunger>6?5.65:4.2;if(mode==='creative')speed*=1.08;const len=Math.hypot(mx,mz)||1,mxN=mx/len,mzN=mz/len,sin=Math.sin(this.yaw),cos=Math.cos(this.yaw),targetX=(mxN*cos+mzN*sin)*speed,targetZ=(-mxN*sin+mzN*cos)*speed,accel=this.grounded?18:this.inWater?7:5;
        this.velocity.x=V.lerp(this.velocity.x,targetX,Math.min(1,accel*dt));this.velocity.z=V.lerp(this.velocity.z,targetZ,Math.min(1,accel*dt));
        if(!moving){const drag=this.grounded?.75:this.inWater?.85:.98;this.velocity.x*=Math.pow(drag,dt*60);this.velocity.z*=Math.pow(drag,dt*60)}
        if(down('jump')){if(this.grounded){this.velocity.y=7.15;if(wantsSprint){this.velocity.x+=-Math.sin(this.yaw)*1.55;this.velocity.z+=-Math.cos(this.yaw)*1.55}this.grounded=false;this.game.audio.play('splash')}else if(this.inWater)this.velocity.y=3.2}
        this.velocity.y-=this.inWater?7*dt:20*dt;this.velocity.y=Math.max(this.velocity.y,-28);
        const nx=this.position.x+this.velocity.x*dt,nz=this.position.z+this.velocity.z*dt;if(this.sneaking&&this.grounded){if(this.isSupportedAt(nx,this.position.z))this.tryHorizontal('x',this.velocity.x*dt);else this.velocity.x=0;if(this.isSupportedAt(this.position.x,nz))this.tryHorizontal('z',this.velocity.z*dt);else this.velocity.z=0}else{this.tryHorizontal('x',this.velocity.x*dt);this.tryHorizontal('z',this.velocity.z*dt)}
        if(wantsSprint&&moving&&Math.hypot(this.velocity.x,this.velocity.z)<.45){this.sprinting=false;this.sprintLatched=false}
        const wasGrounded=this.grounded;this.grounded=false;this.moveAxis('y',this.velocity.y*dt);
        if(!wasGrounded&&!this.grounded&&this.velocity.y<0&&this.fallStart==null)this.fallStart=this.position.y;
        if(this.grounded&&this.fallStart!=null){const fall=this.fallStart-this.position.y;if(fall>3.2)this.damage(Math.floor(fall-3),`fell ${Math.floor(fall)} blocks`);this.fallStart=null}
        const horizontal=Math.hypot(this.velocity.x,this.velocity.z);if(this.grounded&&horizontal>.5){this.walkDistance+=horizontal*dt;this.game.world.data.stats.distanceWalked+=horizontal*dt;this.stepTimer-=dt;if(this.stepTimer<=0){this.stepTimer=(wantsSprint?.28:.42);const below=this.world.getBlock(Math.floor(this.position.x),Math.floor(this.position.y-.1),Math.floor(this.position.z));this.game.audio.footstep((V.Blocks[below]||{}).sound||'grass')}}
      }
      if(this.position.y<-10){if(this.game.mode==='creative'){this.position.set(this.spawn.x,this.spawn.y,this.spawn.z);this.velocity.set(0,0,0)}else this.damage(100,'fell into the endless dark');}this.updateNeeds(dt);this.updateCamera();
    }
    updateEnvironment(dt){const feet=this.world.getBlock(Math.floor(this.position.x),Math.floor(this.position.y+.15),Math.floor(this.position.z)),head=this.world.getBlock(Math.floor(this.position.x),Math.floor(this.position.y+this.eye),Math.floor(this.position.z));this.inWater=feet===B.WATER||head===B.WATER;this.headWater=head===B.WATER;this.inLava=feet===B.LAVA||head===B.LAVA;if(this.headWater){this.air-=dt;if(this.air<=0){this.air=0;this.hungerTimer+=dt;if(this.hungerTimer>1){this.hungerTimer=0;this.damage(2,'drowned')}}}else this.air=Math.min(10,this.air+dt*3);if(this.inLava){this.fireTime=5;this.damage(4*dt,'tried to swim in lava',true)}if(this.fireTime>0){this.fireTime-=dt;this.damage(1*dt,'burned away',true)}}
    updateNeeds(dt){if(this.game.mode==='creative'||this.game.difficulty==='peaceful'){this.hunger=Math.min(20,this.hunger+dt*.3);if(this.health<20){this.regenTimer+=dt;if(this.regenTimer>1){this.health=Math.min(20,this.health+1);this.regenTimer=0}}return}
      const moving=Math.hypot(this.velocity.x,this.velocity.z)>4.5;this.hungerTimer+=dt*(moving?1.8:1);if(this.hungerTimer>45){this.hungerTimer=0;if(this.saturation>0)this.saturation=Math.max(0,this.saturation-1);else this.hunger=Math.max(0,this.hunger-1)}if(this.hunger>=18&&this.health<20){this.regenTimer+=dt;if(this.regenTimer>4){this.regenTimer=0;this.health=Math.min(20,this.health+1);this.saturation=Math.max(0,this.saturation-.5)}}else if(this.hunger===0){this.regenTimer+=dt;const limit=this.game.difficulty==='easy'?10:this.game.difficulty==='normal'?1:0;if(this.regenTimer>4&&this.health>limit){this.regenTimer=0;this.damage(1,'starved')}}
    }
    startEating(){const s=this.game.inventory.selectedStack(),it=s&&V.Items[s.key];if(!it||!it.food||this.hunger>=20)return false;this.eating=true;this.eatTime=0;return true}
    stopEating(){this.eating=false;this.eatTime=0}
    updateEating(dt){if(!this.eating)return;const s=this.game.inventory.selectedStack(),it=s&&V.Items[s.key];if(!it||!it.food){this.stopEating();return}this.eatTime+=dt;if(Math.floor(this.eatTime*5)!==Math.floor((this.eatTime-dt)*5))this.game.audio.play('eat');if(this.eatTime>=1.6){this.hunger=Math.min(20,this.hunger+it.food);this.saturation=Math.min(this.hunger,this.saturation+(it.saturation||1));s.count--;if(s.count<=0)this.game.inventory.slots[this.game.inventory.selected]=null;this.stopEating();this.game.ui.refreshHUD()}}
    damage(amount,reason='was defeated',continuous=false){if(this.dead||this.game.mode==='creative'||this.invulnerable>0&&!continuous)return;const armour=this.game.inventory.armourPoints(),reduced=amount*(1-Math.min(.75,armour*.04));this.health-=reduced;if(!continuous)this.invulnerable=.55;this.game.ui.damageFlash();if(!continuous)this.game.audio.play('damage');if(this.health<=0)this.die(reason)}
    heal(n){this.health=Math.min(20,this.health+n)}
    die(reason){if(this.dead)return;this.dead=true;this.health=0;this.game.world.data.stats.deaths++;this.game.onPlayerDeath(reason)}
    respawn(){this.dead=false;this.health=20;this.hunger=20;this.air=10;this.fireTime=0;this.velocity.set(0,0,0);this.position.set(this.spawn.x,this.spawn.y,this.spawn.z);this.ensureSafePosition();this.updateCamera()}
    updateCamera(){const cam=this.game.camera,eye=new THREE.Vector3(this.position.x,this.position.y+this.eye,this.position.z),dir=new THREE.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));if(this.perspective===0){cam.position.copy(eye);cam.lookAt(eye.clone().add(dir))}else{const front=this.perspective===2,desired=eye.clone().addScaledVector(dir,front?3.8:-4.2);desired.y+=.35;const hit=this.world.raycast(eye,desired.clone().sub(eye).normalize(),eye.distanceTo(desired));if(hit)desired.copy(eye).addScaledVector(desired.clone().sub(eye).normalize(),Math.max(.2,hit.distance-.25));cam.position.copy(desired);cam.lookAt(front?eye.clone().addScaledVector(dir,-4):eye.clone().addScaledVector(dir,2))}}
    viewDirection(){return new THREE.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch)).normalize()}
    eyePosition(){return new THREE.Vector3(this.position.x,this.position.y+this.eye,this.position.z)}
    cyclePerspective(){this.perspective=(this.perspective+1)%3;this.game.ui.toast(['First person','Third person: back','Third person: front'][this.perspective]);this.updateCamera()}
  }
  V.Player=Player;
})();
