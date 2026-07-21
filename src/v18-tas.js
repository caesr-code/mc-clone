(function(){
'use strict';
const V=window.Voidlands,B=V.B;
V.VERSION='1.8.0';

const TAS_WORLD_NAME='Voidlands TAS Speedrun';
const TAS_SEED='voidlands-tas-route-180';
const TAS_STAGES=[
  'Create deterministic survival world',
  'Collect overworld supplies',
  'Build and ignite Nether portal',
  'Defeat blazes and collect rods',
  'Defeat Endermen and craft Eyes of Ender',
  'Locate and activate the stronghold portal',
  'Destroy End Crystals',
  'Defeat the Ender Dragon',
  'Enter the exit portal'
];
V.TAS_ROUTE_STAGES=TAS_STAGES.slice();

function ensureCompletionUI(){
  if(document.querySelector('#victoryScreen'))return;
  const ui=document.querySelector('#uiRoot');
  if(!ui)return;
  const section=document.createElement('section');
  section.id='victoryScreen';
  section.className='screen overlay-screen victory-screen';
  section.setAttribute('aria-label','Run complete');
  section.innerHTML='<div class="victory-card"><div class="victory-kicker">THE END</div><h1>Run Complete</h1><p id="victoryMessage">The dragon has fallen and the path home is open.</p><div class="victory-stats"><span>Completion time</span><strong id="victoryTime">00:00.000</strong><span>Best time</span><strong id="victoryBest">00:00.000</strong></div><div class="button-row"><button id="victoryContinue" class="primary">Continue World</button><button id="victoryQuit">Save and Quit</button></div></div>';
  ui.appendChild(section);
  section.querySelector('#victoryContinue').addEventListener('click',()=>{
    const g=window.voidlandsApp&&window.voidlandsApp.game;
    if(!g)return;
    section.classList.remove('active');
    g.resume();
  });
  section.querySelector('#victoryQuit').addEventListener('click',()=>{
    const g=window.voidlandsApp&&window.voidlandsApp.game;
    if(g)g.saveAndQuit();
  });
}
function formatRunTime(seconds){
  const ms=Math.max(0,Math.floor((Number(seconds)||0)*1000));
  const minutes=Math.floor(ms/60000),secs=Math.floor(ms%60000/1000),millis=ms%1000;
  return String(minutes).padStart(2,'0')+':'+String(secs).padStart(2,'0')+'.'+String(millis).padStart(3,'0');
}
V.formatRunTime=formatRunTime;

const GP=V.Game.prototype;
GP.completeRun=function(source='End exit portal'){
  if(!this.data)return false;
  ensureCompletionUI();
  this.data.stats=this.data.stats||{};
  const firstCompletion=!this.data.completed;
  const elapsed=this.tasRunner&&this.tasRunner.startStamp?this.tasRunner.elapsed():Math.max(0,this.data.stats.playTime||0);
  this.data.completed=true;
  this.data.completedAt=this.data.completedAt||Date.now();
  this.data.completionSource=this.data.completionSource||source;
  if(firstCompletion){
    this.data.stats.completions=(this.data.stats.completions||0)+1;
    this.data.completionTime=elapsed;
    if(!Number.isFinite(this.data.bestCompletionTime)||elapsed<this.data.bestCompletionTime)this.data.bestCompletionTime=elapsed;
  }
  this.save();
  this.clearInput(true);
  this.paused=true;
  this.state='victory';
  if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();
  this.ui.qa('.screen').forEach(x=>x.classList.remove('active'));
  const screen=document.querySelector('#victoryScreen');
  if(screen){
    screen.classList.add('active');
    const tas=!!this.data.tasWorld;
    screen.querySelector('#victoryMessage').textContent=tas?'The deterministic TAS route completed the game.':'The Ender Dragon has fallen. You escaped through the exit portal.';
    screen.querySelector('#victoryTime').textContent=formatRunTime(this.data.completionTime==null?elapsed:this.data.completionTime);
    screen.querySelector('#victoryBest').textContent=formatRunTime(this.data.bestCompletionTime);
  }
  document.dispatchEvent(new CustomEvent('voidlands:completed',{detail:{game:this,time:elapsed,source}}));
  return true;
};

const previousSwitch=GP.switchDimension;
GP.switchDimension=function(target,instant=false){
  const from=this.world&&this.world.dimension;
  const shouldComplete=from==='starreach'&&target==='overworld'&&!!this.data.bosses?.dragonDefeated;
  const result=previousSwitch.call(this,target,instant);
  if(shouldComplete&&!this._completionTransition){
    this._completionTransition=true;
    setTimeout(()=>{this._completionTransition=false;this.completeRun('End exit portal')},80);
  }
  return result;
};

/* A small public automation surface keeps the TAS separate from normal input. */
V.Automation={
  setPlayer(game,x,y,z,yaw=game.player.yaw,pitch=game.player.pitch){
    game.player.position.set(x,y,z);game.player.velocity.set(0,0,0);game.player.yaw=yaw;game.player.pitch=pitch;game.player.fallStart=null;game.player.updateCamera();game.world.queueAround(x,z,true);
  },
  give(game,key,count=1,extra){const stack=V.makeStack(key,count,extra);game.inventory.insert(stack);game.ui.refreshHUD();return stack},
  select(game,key){let i=game.inventory.slots.findIndex((s,n)=>n<9&&s&&s.key===key);if(i<0){i=game.inventory.selected;game.inventory.slots[i]=V.makeStack(key,1)}game.inventory.setSelected(i);game.ui.refreshHUD();return i},
  collectDrops(game){for(const d of [...game.entities.drops]){game.inventory.insert(d.stack);if(d.remove)d.remove();else if(d.mesh)game.entities.group.remove(d.mesh)}game.entities.drops=game.entities.drops.filter(d=>d&&d.mesh&&d.mesh.parent)},
  kill(game,type,count=1){const killed=[];for(let i=0;i<count;i++){const p=game.player.position,m=game.entities.spawn(type,p.x+2+(i%3),p.y+1,p.z-4-Math.floor(i/3));if(m&&m.takeDamage)m.takeDamage(999,new THREE.Vector3(0,1,0));killed.push(m)}this.collectDrops(game);return killed},
  buildNetherPortal(game){
    const baseX=Math.floor(game.player.position.x)+4,baseY=Math.max(3,Math.floor(game.world.getSurfaceY(baseX,game.player.position.z))+1),baseZ=Math.floor(game.player.position.z);
    for(let w=0;w<4;w++)for(let h=0;h<5;h++)game.world.setBlock(baseX+w,baseY+h,baseZ,(w===0||w===3||h===0||h===4)?B.OBSIDIAN:B.AIR,false);
    for(let w=1;w<=2;w++)for(let h=1;h<=3;h++)game.world.setBlock(baseX+w,baseY+h,baseZ,B.EMBER_PORTAL,false);
    return{x:baseX+1.5,y:baseY+1,z:baseZ+.5};
  },
  activateStronghold(game){
    const s=game.world.getStrongholdLocation();
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)game.world.buildChunk(s.cx+dx,s.cz+dz);
    const y=s.y,cx=s.x,cz=s.z,pts=[];
    for(let x=cx-2;x<=cx+2;x++)if(x===cx-2||x===cx+2)for(let z=cz-1;z<=cz+1;z++)pts.push([x,y,z]);
    for(let z=cz-2;z<=cz+2;z++)if(z===cz-2||z===cz+2)for(let x=cx-1;x<=cx+1;x++)pts.push([x,y,z]);
    for(const p of pts){const key=V.blockKey(...p);game.world.blockEntities[key]=Object.assign({},game.world.blockEntities[key]||{type:'end_portal_frame'}, {eye:true,centerX:cx,centerZ:cz});}
    for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++)game.world.setBlock(x,y,z,B.STAR_PORTAL,false);
    return{x:cx+.5,y:y+.2,z:cz+.5};
  },
  destroyEndCrystals(game){
    for(let cz=-3;cz<=3;cz++)for(let cx=-3;cx<=3;cx++)game.world.generateChunkData(cx,cz);
    let n=0;
    for(const [key,e] of Object.entries(game.world.blockEntities||{}))if(e&&e.type==='end_crystal'){
      const p=key.split(',').map(Number);game.world.setBlock(p[0],p[1],p[2],B.AIR,false);delete game.world.blockEntities[key];n++;
    }
    return n;
  }
};

class TASRunner{
  constructor(app){
    this.app=app;this.game=null;this.running=false;this.cancelled=false;this.startStamp=0;this.stage=0;this.splits=[];this.speed=1;
    this.createOverlay();
  }
  createOverlay(){
    let el=document.querySelector('#tasOverlay');
    if(!el){el=document.createElement('aside');el.id='tasOverlay';el.className='tas-overlay';el.innerHTML='<div class="tas-title"><strong>VOIDLANDS TAS</strong><span>v1.9.0</span></div><div id="tasTimer">00:00.000</div><div id="tasStage">Preparing deterministic route…</div><ol id="tasSplits"></ol><div class="tas-controls"><button id="tasPause">Pause</button><button id="tasRestart">Restart</button></div><small>Tool-assisted demonstration · deterministic TAS world</small>';document.body.appendChild(el)}
    this.el=el;this.timerEl=el.querySelector('#tasTimer');this.stageEl=el.querySelector('#tasStage');this.splitsEl=el.querySelector('#tasSplits');
    el.querySelector('#tasPause').addEventListener('click',()=>this.togglePause());
    el.querySelector('#tasRestart').addEventListener('click',()=>location.reload());
  }
  elapsed(){return this.startStamp?(performance.now()-this.startStamp)/1000:0}
  updateOverlay(){if(this.timerEl)this.timerEl.textContent=formatRunTime(this.elapsed())}
  wait(ms){return new Promise((resolve,reject)=>{const started=performance.now();const tick=()=>{if(this.cancelled)return reject(new Error('TAS cancelled'));if(!this.running){requestAnimationFrame(tick);return}this.updateOverlay();if(performance.now()-started>=ms/this.speed)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick)})}
  async split(label,action,delay=420){
    this.stage++;this.stageEl.textContent=label;
    if(action)await action();
    await this.wait(delay);
    const time=this.elapsed();this.splits.push({label,time});
    const li=document.createElement('li');li.innerHTML='<span>'+V.escapeHtml(label)+'</span><b>'+formatRunTime(time)+'</b>';this.splitsEl.appendChild(li);
  }
  togglePause(){this.running=!this.running;const b=this.el.querySelector('#tasPause');b.textContent=this.running?'Pause':'Resume';if(this.game){this.game.paused=!this.running;if(this.running)this.game.state='playing'} }
  async prepare(){
    const app=this.app;
    app.storage.worlds=app.storage.worlds.filter(w=>w.name!==TAS_WORLD_NAME);
    app.storage.saveWorlds();
    const w=app.storage.create({name:TAS_WORLD_NAME,seed:TAS_SEED,mode:'survival',difficulty:'normal',worldType:'default',structures:true,bonusChest:false});
    w.tasWorld=true;w.tasRouteVersion=1;w.time=1000;
    await app.startWorld(w);
    this.game=app.game;this.game.tasRunner=this;this.game.paused=false;this.game.state='playing';this.game.clearInput(true);
    this.game.player.health=20;this.game.player.hunger=20;
  }
  async run(){
    if(this.running)return;
    this.running=true;this.startStamp=performance.now();
    try{
      await this.split(TAS_STAGES[0],()=>this.prepare(),180);
      const g=this.game,A=V.Automation;
      await this.split(TAS_STAGES[1],async()=>{
        for(const [key,count] of [['log',12],['cobble',24],['iron_ingot',12],['diamond',5],['obsidian',14],['flint_and_steel',1],['cooked_meat',16],['water_bucket',1],['diamond_sword',1],['diamond_pickaxe',1],['bow',1]])A.give(g,key,count);
        g.inventory.slots[0]=V.makeStack('diamond_sword',1,{enchants:[{id:'sharpness',level:5},{id:'unbreaking',level:3}]});g.inventory.selected=0;g.player.level=30;g.player.xp=0;
      },520);
      let portal;
      await this.split(TAS_STAGES[2],async()=>{portal=A.buildNetherPortal(g);await this.moveTo(portal.x,portal.y,portal.z,520);g.switchDimension('emberdeep',true)},650);
      await this.split(TAS_STAGES[3],async()=>{A.kill(g,'blaze',7);A.give(g,'blaze_rod',7);A.give(g,'ghast_tear',1)},620);
      await this.split(TAS_STAGES[4],async()=>{g.switchDimension('overworld',true);A.kill(g,'enderman',12);A.give(g,'ender_pearl',12);A.give(g,'blaze_powder',12);A.give(g,'eye_of_ender',12)},650);
      let strong;
      await this.split(TAS_STAGES[5],async()=>{strong=A.activateStronghold(g);await this.moveTo(strong.x,strong.y,strong.z,600);g.switchDimension('starreach',true)},800);
      await this.split(TAS_STAGES[6],async()=>{const n=A.destroyEndCrystals(g);g.ui.chat('TAS destroyed '+n+' End Crystals.');await this.wait(300)},520);
      await this.split(TAS_STAGES[7],async()=>{
        let dragon=g.entities.mobs.find(m=>m.type==='ender_dragon'&&!m.dead);if(!dragon)dragon=g.entities.spawn('ender_dragon',8.5,52,8.5);
        while(dragon&&!dragon.dead){dragon.takeDamage(28,new THREE.Vector3(0,1,0));await this.wait(120)}
        if(g.updateBossProgression)g.updateBossProgression(.2);
      },700);
      await this.split(TAS_STAGES[8],async()=>{
        if(g.updateBossProgression)g.updateBossProgression(.2);
        await this.moveTo(8.5,40.3,8.5,420);
        g.switchDimension('overworld',true);
        await this.wait(180);
        if(!g.data.completed)g.completeRun('TAS End exit portal');
      },180);
      this.running=false;this.updateOverlay();this.stageEl.textContent='COMPLETE · '+formatRunTime(this.elapsed());this.el.classList.add('complete');
    }catch(e){console.error(e);this.running=false;this.stageEl.textContent='TAS stopped: '+e.message;this.el.classList.add('error')}
  }
  moveTo(x,y,z,duration=450){
    const g=this.game,p=g.player,start=p.position.clone(),begin=performance.now();
    return new Promise(resolve=>{const tick=()=>{if(this.cancelled)return resolve();if(!this.running){requestAnimationFrame(tick);return}const t=V.clamp((performance.now()-begin)/(duration/this.speed),0,1),s=t*t*(3-2*t);p.position.set(V.lerp(start.x,x,s),V.lerp(start.y,y,s),V.lerp(start.z,z,s));p.velocity.set(0,0,0);p.fallStart=null;p.updateCamera();g.world.queueAround(p.position.x,p.position.z,true);this.updateOverlay();if(t>=1)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick)})
  }
}
V.TASRunner=TASRunner;

function isTasMode(){try{return new URLSearchParams(location.search).get('tas')==='1'}catch(e){return false}}
function bootTas(){
  ensureCompletionUI();
  if(!isTasMode())return;
  const wait=()=>{if(!window.voidlandsApp){setTimeout(wait,20);return}const runner=new TASRunner(window.voidlandsApp);window.voidlandsTAS=runner;runner.run()};
  wait();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootTas);else bootTas();
})();
