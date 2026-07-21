(function(){
  'use strict';
  const V = window.Voidlands = window.Voidlands || {};
  V.VERSION = '1.6.0';
  V.CHUNK_SIZE = 16;
  V.WORLD_HEIGHT = 72;
  V.SEA_LEVEL = 30;
  V.SAVE_KEY = 'voidlands_worlds_v1';
  V.SETTINGS_KEY = 'voidlands_settings_v1';
  V.DEFAULT_SETTINGS = {
    masterVolume:.75,musicVolume:.32,effectsVolume:.8,sensitivity:.0024,
    invertMouse:false,fov:75,renderDistance:4,graphics:'fancy',shadows:true,vibrantVisuals:false,skinData:null,skinName:'Default Explorer',skinModel:'classic',
    keybinds:{forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',sneak:'ShiftLeft',sprint:'ControlLeft',inventory:'KeyE',drop:'KeyQ',chat:'KeyT',hud:'F1',perspective:'F5',debug:'F3',zoom:'KeyC'}
  };
  V.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  V.lerp=(a,b,t)=>a+(b-a)*t;
  V.smooth=t=>t*t*(3-2*t);
  V.mod=(n,m)=>((n%m)+m)%m;
  V.floorDiv=(n,d)=>Math.floor(n/d);
  V.chunkKey=(x,z)=>x+','+z;
  V.blockKey=(x,y,z)=>x+','+y+','+z;
  V.hashString=function(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  V.rng=function(seed){let x=seed>>>0;return function(){x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};
  V.escapeHtml=function(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))};
  V.deepClone=o=>JSON.parse(JSON.stringify(o));
  V.now=()=>performance.now()/1000;
  V.formatTime=function(ticks){const total=Math.floor((ticks%24000)/1000*60);const h=Math.floor((total+6*60)/60)%24,m=total%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')};
  V.DIRECTIONS=[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
  V.FACE_DEFS=[
    {n:[1,0,0],corners:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],shade:.84,name:'east'},
    {n:[-1,0,0],corners:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],shade:.78,name:'west'},
    {n:[0,1,0],corners:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],shade:1,name:'top'},
    {n:[0,-1,0],corners:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]],shade:.55,name:'bottom'},
    {n:[0,0,1],corners:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],shade:.9,name:'south'},
    {n:[0,0,-1],corners:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],shade:.72,name:'north'}
  ];
  V.KEY_NAMES={KeyW:'W',KeyA:'A',KeyS:'S',KeyD:'D',Space:'Space',ShiftLeft:'Left Shift',ShiftRight:'Right Shift',ControlLeft:'Left Control',ControlRight:'Right Control',AltLeft:'Left Alt',AltRight:'Right Alt',KeyE:'E',KeyQ:'Q',KeyT:'T',KeyC:'C',F1:'F1',F3:'F3',F5:'F5'};
  V.KEY_ALIASES={ShiftLeft:['ShiftLeft','ShiftRight'],ShiftRight:['ShiftLeft','ShiftRight'],ControlLeft:['ControlLeft','ControlRight'],ControlRight:['ControlLeft','ControlRight'],AltLeft:['AltLeft','AltRight'],AltRight:['AltLeft','AltRight']};
})();
