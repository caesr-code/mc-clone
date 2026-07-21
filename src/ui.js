(function(){
'use strict';const V=window.Voidlands;
class UI{
 constructor(app){this.app=app;this.current='titleScreen';this.selectedWorld=null;this.returnScreen='titleScreen';this.tooltip=null;this.creativeCategory='all';this.recipeBookOpen=true;this.recipeSearch='';this.dragStart=null;this.dragged=false;this.dragTargets=[];this.dragButton=0;this.dragOriginProcessed=false;this.rebindingHandler=null;this.bind();this.loadOptions();this.renderControls();}
 q(s){return document.querySelector(s)} qa(s){return [...document.querySelectorAll(s)]}
 show(id){this.qa('.screen').forEach(x=>x.classList.remove('active'));const e=this.q('#'+id);if(e)e.classList.add('active');this.current=id;}
 bind(){
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;this.app.audio&&this.app.audio.play('menu');this.action(b.dataset.action)});
  this.q('#gameMode').onchange=()=>this.modeHelp();
  this.q('#creativeSearch').oninput=()=>this.renderInventory();
  const body=this.q('#inventoryBody'),cursor=this.q('#cursorStack'),windowEl=this.q('.inventory-window');
  const slotData=s=>s?{group:s.dataset.group,index:Number(s.dataset.index||0),creative:s.dataset.creative||null}:null;
  const same=(a,b)=>a&&b&&a.group===b.group&&a.index===b.index&&a.creative===b.creative;
  const clearDragClasses=()=>{this.qa('.drag-hover').forEach(x=>x.classList.remove('drag-hover'));windowEl&&windowEl.classList.remove('dragging')};
  const paintDragTargets=()=>{clearDragClasses();if(!this.dragged)return;windowEl&&windowEl.classList.add('dragging');for(const target of this.dragTargets){for(const slot of this.qa('.slot')){const data=slotData(slot);if(same(data,target)){slot.classList.add('drag-hover');break}}}};
  const refresh=(keepDrag=false)=>{this.renderInventory();this.refreshHUD();if(keepDrag)paintDragTargets()};
  const resetDrag=()=>{this.dragStart=null;this.dragged=false;this.dragTargets=[];this.dragOriginProcessed=false;clearDragClasses()};
  const addTarget=(d,slot,g)=>{if(!d||!g||d.creative||d.group==='output'||!g.inventory.cursor||!g.inventory.canPlaceCursorAt(d.group,d.index))return false;if(this.dragTargets.some(t=>same(t,d)))return false;this.dragTargets.push(d);if(slot)slot.classList.add('drag-hover');return true};
  const beginDrag=()=>{
    if(!this.dragStart||this.dragOriginProcessed)return false;
    const g=this.app.game;if(!g)return false;
    this.dragOriginProcessed=true;this.dragTargets=[];
    const started=g.inventory.beginCursorDrag(this.dragStart.group,this.dragStart.index,this.dragButton,this.dragStart.creative);
    if(!started.ready)return false;
    if(!started.fromCursor)refresh(true);
    if(started.fromCursor&&!this.dragStart.creative){
      const origin=[...this.qa('.slot')].find(slot=>same(slotData(slot),this.dragStart));
      if(addTarget(this.dragStart,origin,g)&&this.dragButton===2){
        g.inventory.placeCursorOne(this.dragStart.group,this.dragStart.index);
        refresh(true);
      }
    }
    windowEl&&windowEl.classList.add('dragging');
    return true;
  };
  const trackPointerSlot=(e,placeRight=true)=>{
    const g=this.app.game;if(!g||!this.dragged)return;
    const el=document.elementFromPoint(e.clientX,e.clientY),slot=el&&el.closest&&el.closest('.slot'),d=slotData(slot);
    if(!addTarget(d,slot,g))return;
    if(placeRight&&this.dragButton===2&&g.inventory.placeCursorOne(d.group,d.index))refresh(true);
  };
  document.addEventListener('mousemove',e=>{
    cursor.style.left=e.clientX+8+'px';cursor.style.top=e.clientY+8+'px';
    if(this.tooltip){this.tooltip.style.left=e.clientX+16+'px';this.tooltip.style.top=e.clientY+16+'px'}
    if(!this.dragStart)return;
    if(!this.dragged&&Math.hypot(e.clientX-this.dragStart.x,e.clientY-this.dragStart.y)>4){
      this.dragged=true;
      if(!beginDrag()){resetDrag();return}
    }
    if(this.dragged)trackPointerSlot(e,true);
  });
  body.addEventListener('contextmenu',e=>e.preventDefault());
  body.addEventListener('click',e=>{
    const b=e.target.closest('[data-category]');if(b){this.creativeCategory=b.dataset.category;this.renderInventory();return}
    const t=e.target.closest('[data-recipe-toggle]');if(t){this.recipeBookOpen=!this.recipeBookOpen;this.renderInventory();return}
    const r=e.target.closest('[data-recipe]');if(r&&this.app.game){const recipe=V.Recipes[Number(r.dataset.recipe)],result=this.app.game.inventory.fillRecipe(recipe);if(!result.ok)this.toast(result.message);this.renderInventory();return}
  });
  body.addEventListener('input',e=>{if(e.target.id==='recipeSearch'){this.recipeSearch=e.target.value;const pos=e.target.selectionStart||this.recipeSearch.length;this.renderInventory();const next=this.q('#recipeSearch');if(next){next.focus();next.setSelectionRange(pos,pos)}}});
  body.addEventListener('mousedown',e=>{
    if(e.button!==0&&e.button!==2)return;
    const slot=e.target.closest('.slot');if(!slot)return;
    e.preventDefault();
    const d=slotData(slot),g=this.app.game;
    this.dragStart=Object.assign({x:e.clientX,y:e.clientY,shift:e.shiftKey,hadCursor:!!(g&&g.inventory.cursor)},d);
    this.dragButton=e.button;this.dragged=false;this.dragTargets=[];this.dragOriginProcessed=false;this.hideTooltip();
  });
  document.addEventListener('mouseup',e=>{
    if(!this.dragStart)return;
    const g=this.app.game;
    if(g){
      if(!this.dragged){
        const el=document.elementFromPoint(e.clientX,e.clientY),slot=el&&el.closest&&el.closest('.slot'),d=slotData(slot),target=d||this.dragStart;
        if(target.creative)g.inventory.creativeTake(target.creative,this.dragButton);
        else g.inventory.click(target.group,target.index,this.dragButton,this.dragStart.shift);
      }else{
        trackPointerSlot(e,true);
        if(this.dragButton===0&&g.inventory.cursor)g.inventory.distributeCursor(this.dragTargets);
      }
      refresh();
    }
    resetDrag();
  });
  window.addEventListener('blur',()=>resetDrag());
  body.addEventListener('mouseover',e=>{if(this.dragStart)return;const slot=e.target.closest('.slot');if(!slot)return;const g=this.app.game;let st=null;if(slot.dataset.creative)st=V.makeStack(slot.dataset.creative,1);else if(g){const r=g.inventory.slotRef(slot.dataset.group,Number(slot.dataset.index||0));st=r&&r.get();if(slot.dataset.group==='output')st=g.inventory.output()}if(st)this.showTooltip(st)});
  body.addEventListener('mouseout',e=>{if(e.target.closest('.slot'))this.hideTooltip()});
  ['masterVolume','musicVolume','effectsVolume','sensitivity','fov','renderDistance'].forEach(id=>this.q('#'+id).oninput=()=>this.updateOptionOutputs());
 }
 action(a){const app=this.app,g=app.game;switch(a){case'singleplayer':this.renderWorlds();this.show('worldScreen');break;case'back-title':case'credits-back':this.show('titleScreen');break;case'credits':this.show('creditsScreen');break;case'mods':this.returnScreen='titleScreen';this.loadOptions();this.show('modsScreen');break;case'pause-mods':this.returnScreen='pauseScreen';this.loadOptions();this.show('modsScreen');break;case'save-mods':app.settings.vibrantVisuals=!!this.q('#vibrantVisualsMod').checked;app.storage.saveSettings(app.settings);if(g)g.applySettings();else if(app.panorama&&app.panorama.setVibrant)app.panorama.setVibrant(app.settings.vibrantVisuals);this.loadOptions();this.show(this.returnScreen);break;case'options':this.returnScreen='titleScreen';this.loadOptions();this.show('optionsScreen');break;case'pause-options':this.returnScreen='pauseScreen';this.loadOptions();this.show('optionsScreen');break;case'controls':this.returnScreen='optionsScreen';this.show('controlsScreen');break;case'pause-controls':this.returnScreen='pauseScreen';this.show('controlsScreen');break;case'controls-back':app.storage.saveSettings(app.settings);this.show(this.returnScreen);break;case'reset-controls':app.settings.keybinds=V.deepClone(V.DEFAULT_SETTINGS.keybinds);app.storage.saveSettings(app.settings);if(g)g.clearInput(true);this.renderControls();this.toast('Controls reset to defaults');break;case'save-options':this.saveOptions();this.show(this.returnScreen);if(g&&this.returnScreen==='pauseScreen')g.applySettings();else if(!g&&app.panorama&&app.panorama.setVibrant)app.panorama.setVibrant(app.settings.vibrantVisuals);break;case'reset-options':{const defaults=V.deepClone(V.DEFAULT_SETTINGS);for(const key of Object.keys(app.settings))delete app.settings[key];Object.assign(app.settings,defaults);app.storage.saveSettings(app.settings);this.loadOptions();this.renderControls();if(g)g.applySettings();else if(app.panorama&&app.panorama.setVibrant)app.panorama.setVibrant(app.settings.vibrantVisuals);break;}case'fullscreen':document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();break;case'create-world':this.q('#worldName').value=this.nextWorldName();this.q('#worldSeed').value='';this.show('createScreen');break;case'cancel-create':this.show('worldScreen');break;case'confirm-create':app.createFromForm();break;case'play-world':if(this.selectedWorld)app.startWorld(this.selectedWorld);break;case'delete-world':if(this.selectedWorld)this.dialog('Delete World?',`Permanently delete “${this.selectedWorld.name}”?`,()=>{app.storage.delete(this.selectedWorld.id);this.selectedWorld=null;this.renderWorlds()},null,true);break;case'rename-world':if(this.selectedWorld)this.dialog('Rename World','Enter a new world name:',v=>{app.storage.rename(this.selectedWorld.id,v||this.selectedWorld.name);this.renderWorlds()},this.selectedWorld.name);break;case'recreate-world':if(this.selectedWorld){const w=app.storage.recreate(this.selectedWorld.id);app.startWorld(w)}break;case'quit':window.close();this.toast('Your browser blocked automatic closing. You may close this tab.');break;case'resume':g&&g.resume();break;case'pause-options':break;case'world-info':if(g){this.renderWorldInfo();this.show('worldInfoScreen')}break;case'world-info-back':this.show('pauseScreen');break;case'save-quit':g&&g.saveAndQuit();break;case'respawn':g&&g.respawn();break;case'death-title':g&&g.saveAndQuit();break}}
 nextWorldName(){let n=1,names=this.app.storage.worlds.map(w=>w.name);while(names.includes('New World'+(n>1?' '+n:'')))n++;return'New World'+(n>1?' '+n:'')}
 modeHelp(){const v=this.q('#gameMode').value,m={survival:'Search for resources, craft tools, manage hunger and survive the night.',creative:'Unlimited building resources, instant breaking and double-tap Space flight.',hardcore:'Hard difficulty with one life. A dead world can no longer be played.'};this.q('#modeDescription').textContent=m[v]}
 renderWorlds(){const list=this.q('#worldList'),worlds=this.app.storage.list();list.innerHTML=worlds.length?'':'<div class="empty-worlds">No worlds yet.<br>Create one to begin exploring.</div>';for(const w of worlds){const d=document.createElement('div');d.className='world-card'+(this.selectedWorld&&this.selectedWorld.id===w.id?' selected':'');d.innerHTML=`<div class="world-thumb"></div><div><div class="world-title">${V.escapeHtml(w.name)}</div><div class="world-meta"><span class="world-mode">${w.mode}</span> · ${V.escapeHtml(w.worldType)} · Seed ${V.escapeHtml(w.seed)}</div><div class="world-meta">${w.explored?.length||0} chunks explored${w.hardcoreDead?' · World lost':''}</div></div><div class="world-date">${new Date(w.lastPlayed||w.created).toLocaleString()}</div>`;d.onclick=()=>{this.selectedWorld=w;this.renderWorlds()};d.ondblclick=()=>{if(!w.hardcoreDead)this.app.startWorld(w)};list.appendChild(d)}}
 loadOptions(){const s=this.app.settings;for(const k of ['masterVolume','musicVolume','effectsVolume','sensitivity','fov','renderDistance','graphics'])this.q('#'+k).value=s[k];this.q('#invertMouse').checked=s.invertMouse;this.q('#shadows').checked=s.shadows;const vv=this.q('#vibrantVisuals'),vm=this.q('#vibrantVisualsMod');if(vv)vv.checked=!!s.vibrantVisuals;if(vm)vm.checked=!!s.vibrantVisuals;this.updateOptionOutputs()}
 updateOptionOutputs(){const pct=x=>Math.round(Number(this.q('#'+x).value)*100)+'%';this.q('#masterOut').value=pct('masterVolume');this.q('#musicOut').value=pct('musicVolume');this.q('#effectsOut').value=pct('effectsVolume');this.q('#sensitivityOut').value=Math.round(Number(this.q('#sensitivity').value)*10000);this.q('#fovOut').value=this.q('#fov').value+'°';this.q('#renderOut').value=this.q('#renderDistance').value+' chunks'}
 saveOptions(){const s=this.app.settings;for(const k of ['masterVolume','musicVolume','effectsVolume','sensitivity','fov','renderDistance'])s[k]=Number(this.q('#'+k).value);s.graphics=this.q('#graphics').value;s.invertMouse=this.q('#invertMouse').checked;s.shadows=this.q('#shadows').checked;s.vibrantVisuals=!!this.q('#vibrantVisuals').checked;this.app.storage.saveSettings(s);this.app.audio.settings=s;this.app.audio.applySettings()}
 renderControls(){const labels={forward:'Move Forward',back:'Move Back',left:'Strafe Left',right:'Strafe Right',jump:'Jump / Fly Up',sneak:'Sneak / Fly Down',sprint:'Sprint',inventory:'Inventory',drop:'Drop Item',chat:'Chat / Commands',hud:'Toggle HUD',debug:'Debug Overlay',perspective:'Camera Perspective',zoom:'Zoom'};if(this.rebindingHandler){document.removeEventListener('keydown',this.rebindingHandler,true);this.rebindingHandler=null}this.q('#controlsList').innerHTML=Object.entries(labels).map(([k,n])=>`<div class="control-row"><span>${n}</span><button data-bind="${k}">${V.KEY_NAMES[this.app.settings.keybinds[k]]||this.app.settings.keybinds[k]}</button></div>`).join('');this.qa('[data-bind]').forEach(b=>b.onclick=()=>{if(this.rebindingHandler)document.removeEventListener('keydown',this.rebindingHandler,true);b.textContent='Press a key… (Esc to cancel)';const action=b.dataset.bind,h=e=>{e.preventDefault();e.stopPropagation();document.removeEventListener('keydown',h,true);this.rebindingHandler=null;if(e.code==='Escape'){this.renderControls();return}const binds=this.app.settings.keybinds,oldCode=binds[action],newCodes=V.KEY_ALIASES[e.code]||[e.code],conflict=Object.keys(binds).find(key=>key!==action&&(V.KEY_ALIASES[binds[key]]||[binds[key]]).some(code=>newCodes.includes(code)));if(conflict)binds[conflict]=oldCode;binds[action]=e.code;this.app.storage.saveSettings(this.app.settings);if(this.app.game)this.app.game.clearInput(true);this.renderControls();this.toast(conflict?'Controls swapped to avoid a conflict':'Control updated')};this.rebindingHandler=h;document.addEventListener('keydown',h,true)})}
 dialog(title,msg,confirm,inputValue=null,danger=false){this.q('#dialogTitle').textContent=title;this.q('#dialogMessage').textContent=msg;const inp=this.q('#dialogInput');inp.classList.toggle('hidden',inputValue===null);if(inputValue!==null){inp.value=inputValue;setTimeout(()=>inp.select(),0)}const ok=this.q('#dialogConfirm');ok.classList.toggle('danger',danger);this.show('dialogScreen');ok.onclick=()=>{const v=inputValue!==null?inp.value:true;confirm(v);this.show('worldScreen')};this.q('#dialogCancel').onclick=()=>this.show('worldScreen')}
 recipeBookHTML(inv){const q=this.recipeSearch.trim().toLowerCase(),size=inv.craftSize();let cards='';V.Recipes.forEach((r,i)=>{const out=V.Items[r.out[0]];if(!out)return;const pat=r.type==='shaped'?r.shape:null,w=pat?Math.max(...pat.map(x=>x.length)):1,h=pat?pat.length:1;if(w>size||h>size)return;const ingredients=V.recipeIngredients(r),text=Object.entries(ingredients).map(([k,n])=>`${n}× ${V.Items[k]?.name||k}`).join(', ');if(q&&!out.name.toLowerCase().includes(q)&&!text.toLowerCase().includes(q))return;const craftable=inv.canCraftRecipe(r);cards+=`<button class="recipe-card ${craftable?'craftable':'locked'}" data-recipe="${i}" title="${V.escapeHtml(text)}"><div class="recipe-icon" style="background-image:${V.itemIcon(r.out[0])}"></div><span><strong>${V.escapeHtml(out.name)}</strong><small>${V.escapeHtml(text)}</small></span><b>${r.out[1]>1?'×'+r.out[1]:''}</b></button>`});return`<aside class="recipe-book ${this.recipeBookOpen?'':'collapsed'}"><div class="recipe-book-head"><button data-recipe-toggle>${this.recipeBookOpen?'Hide':'Recipe Book'}</button>${this.recipeBookOpen?`<input id="recipeSearch" value="${V.escapeHtml(this.recipeSearch)}" placeholder="Search recipes...">`:''}</div>${this.recipeBookOpen?`<div class="recipe-list">${cards||'<p class="recipe-empty">No matching recipes.</p>'}</div>`:''}</aside>`}
  slotHTML(stack,group,index,extra=''){let inner='';if(stack){const it=V.Items[stack.key];inner=`<div class="item-icon" style="background-image:${V.itemIcon(stack.key)}"></div>${stack.count>1?`<span class="count">${stack.count}</span>`:''}`;if(it.durability)inner+=`<div class="durability"><span style="width:${Math.max(0,100-(stack.damage||0)/it.durability*100)}%"></span></div>`}return`<div class="slot" data-group="${group}" data-index="${index}" ${extra}>${inner}</div>`}
 renderInventory(){const g=this.app.game;if(!g)return;const inv=g.inventory,type=inv.openType,body=this.q('#inventoryBody'),creative=g.mode==='creative'&&type==='player';this.q('#inventoryTitle').textContent=type==='crafting'?'Crafting Table':type==='chest'?'Chest':type==='furnace'?'Stone Furnace':creative?'Creative Inventory':'Inventory';this.q('#creativeSearch').classList.toggle('hidden',!creative);let h='<div class="inventory-layout"><div>';
 h+='<div class="equipment">'+['head','chest','legs','feet'].map((k,i)=>this.slotHTML(inv.armor[k],'armor',i)).join('')+'<div class="player-preview"></div>'+this.slotHTML(inv.offhand,'offhand',0)+'</div></div><div>';
 if(creative){const q=this.q('#creativeSearch').value.toLowerCase();h+='<div class="creative-tabs">'+V.ITEM_CATEGORIES.map(c=>`<button data-category="${c}" class="${this.creativeCategory===c?'primary':''}">${c}</button>`).join('')+'</div><div class="slot-grid creative-grid">';for(const [key,it] of Object.entries(V.Items))if((this.creativeCategory==='all'||it.category===this.creativeCategory)&&(!q||it.name.toLowerCase().includes(q)||key.includes(q)))h+=this.slotHTML(V.makeStack(key,it.maxStack),'creative',0,`data-creative="${key}"`);h+='</div>'}
 if(type==='chest'){h+='<div class="inv-title">Chest</div><div class="slot-grid">'+inv.chestSlots.map((s,i)=>this.slotHTML(s,'chest',i)).join('')+'</div>'}
 if(type==='furnace'){const f=inv.furnace;h+=`<div class="furnace-ui"><div class="furnace-input">${this.slotHTML(f.input,'furnace',0)}</div><div class="furnace-fire">${f.burn>0?'🔥':'◇'}</div><div class="furnace-fuel">${this.slotHTML(f.fuel,'furnace',1)}</div><div class="furnace-progress"><div style="width:${f.progress/10*100}%"></div></div><div class="furnace-output">${this.slotHTML(f.output,'furnace',2)}</div></div>`}
 if(type==='player'||type==='crafting'){const grid=inv.craftGrid(),group=type==='crafting'?'table':'craft';h+='<div class="crafting-area"><div><div class="inv-title">Crafting</div><div class="craft-grid '+(type==='crafting'?'large':'')+'">'+grid.map((s,i)=>this.slotHTML(s,group,i)).join('')+'</div></div><div class="craft-arrow">→</div>'+this.slotHTML(inv.output(),'output',0)+'</div>'+this.recipeBookHTML(inv)}
 h+='<div class="inv-title">Inventory</div><div class="slot-grid">';for(let i=9;i<36;i++)h+=this.slotHTML(inv.slots[i],'inv',i);h+='</div><div class="inv-title">Hotbar</div><div class="slot-grid">';for(let i=0;i<9;i++)h+=this.slotHTML(inv.slots[i],'inv',i);h+='</div></div></div><div class="close-hint">Press E or Escape to close</div>';body.innerHTML=h;const c=this.q('#cursorStack');c.innerHTML=inv.cursor?this.slotHTML(inv.cursor,'cursor',0):'';c.classList.toggle('hidden',!inv.cursor)}
 showTooltip(s){this.hideTooltip();const it=V.Items[s.key];this.tooltip=document.createElement('div');this.tooltip.className='item-tooltip';this.tooltip.innerHTML=`<strong>${V.escapeHtml(it.name)}</strong>${it.tool?`<br><span class="tooltip-key">${it.tool} · tier ${it.tier}</span>`:''}${it.food?`<br>Restores ${it.food} hunger`:''}${it.durability?`<br>Durability ${it.durability-(s.damage||0)} / ${it.durability}`:''}`;document.body.appendChild(this.tooltip)}hideTooltip(){if(this.tooltip)this.tooltip.remove();this.tooltip=null}
 showInventory(){this.renderInventory();this.show('inventoryScreen')}
 refreshHUD(){const g=this.app.game;if(!g)return;const inv=g.inventory,p=g.player;const hot=this.q('#hotbar');hot.innerHTML='';for(let i=0;i<9;i++){const s=inv.slots[i],d=document.createElement('div');d.className='hotbar-slot'+(i===inv.selected?' selected':'');d.innerHTML=`<span class="key">${i+1}</span>`+(s?`<div class="item-icon" style="background-image:${V.itemIcon(s.key)}"></div>${s.count>1?`<span class="count">${s.count}</span>`:''}`:'');hot.appendChild(d)}this.icons('#healthBar','health',p.health,10);this.icons('#hungerBar','hunger',p.hunger,10,true);this.icons('#armourBar','armour',inv.armourPoints(),10);this.icons('#airBar','air',p.air*2,10,true);this.q('#airBar').classList.toggle('hidden',!p.headWater);this.q('#xpBar div').style.width=(p.xp%10)*10+'%';this.q('#xpBar span').textContent=p.level;}
 icons(sel,type,val,n,right){const e=this.q(sel);e.classList.toggle('right',!!right);e.innerHTML='';for(let i=0;i<n;i++){const x=val-i*2,d=document.createElement('span');d.className=`status-icon ${type} ${x>=2?'full':x>0?'half':'empty'}`;e.appendChild(d)}}
 selectedName(){const g=this.app.game,s=g.inventory.selectedStack(),e=this.q('#selectedName');e.textContent=s?V.Items[s.key].name:'';e.style.opacity=1;clearTimeout(this.nameTimer);this.nameTimer=setTimeout(()=>e.style.opacity=0,1800)}
 toast(t){const e=this.q('#toast');e.textContent=t;e.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>e.classList.remove('show'),2200)}
 damageFlash(){const e=this.q('#damageFlash');e.style.opacity=1;setTimeout(()=>e.style.opacity=0,120)}
 chat(t){const e=this.q('#chatLog'),d=document.createElement('div');d.className='chat-line';d.textContent=t;e.appendChild(d);while(e.children.length>8)e.firstChild.remove();setTimeout(()=>d.remove(),9000)}
 renderWorldInfo(){const g=this.app.game,w=g.world.data,s=w.stats;this.q('#worldInfo').innerHTML=`<dl class="stats-grid"><dt>World</dt><dd>${V.escapeHtml(w.name)}</dd><dt>Seed</dt><dd>${V.escapeHtml(w.seed)}</dd><dt>Mode</dt><dd>${w.mode}</dd><dt>Difficulty</dt><dd>${w.difficulty}</dd><dt>World type</dt><dd>${w.worldType}</dd><dt>Current realm</dt><dd>${g.world.dimension==='overworld'?'Overworld':g.world.dimension==='emberdeep'?'Emberdeep':'Starreach'}</dd><dt>Local time</dt><dd>${V.formatTime(w.time)}</dd><dt>Chunks explored</dt><dd>${g.world.explored.size}</dd><dt>Blocks mined</dt><dd>${s.blocksMined}</dd><dt>Blocks placed</dt><dd>${s.blocksPlaced}</dd><dt>Distance walked</dt><dd>${Math.floor(s.distanceWalked)} m</dd><dt>Mobs defeated</dt><dd>${s.mobsDefeated}</dd><dt>Items crafted</dt><dd>${s.itemsCrafted}</dd><dt>Deaths</dt><dd>${s.deaths}</dd><dt>Play time</dt><dd>${Math.floor(s.playTime/60)} min</dd></dl>`}
}
V.UI=UI;
})();
