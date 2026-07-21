(function(){
  'use strict';
  const V=window.Voidlands;

  function lambert(color,extra){return new THREE.MeshLambertMaterial(Object.assign({color},extra||{}))}
  function basic(color,extra){return new THREE.MeshBasicMaterial(Object.assign({color,toneMapped:false},extra||{}))}
  function partTexture(kind){const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const fill=(color,px=0,py=0,w=8,h=8)=>{x.fillStyle=color;x.fillRect(px,py,w,h)};if(kind==='sleeve'){fill('#315d7c');fill('#3e7192',1,1,6,2);fill('#24465f',0,6,8,2);fill('#5290ad',1,3,1,3);fill('#1e394d',6,3,1,3)}else if(kind==='cuff'){fill('#24465f');fill('#315d7c',0,0,8,2);fill('#172f42',0,6,8,2);fill('#4a7b96',1,2,1,4)}else if(kind==='skin'){fill('#d49b78');fill('#e4b08c',1,1,5,2);fill('#bd7f61',0,6,8,2);fill('#f0c2a0',1,3,1,3);fill('#a96e54',6,3,1,3)}else if(kind==='shirt'){fill('#315873');fill('#3f6e8d',1,1,6,2);fill('#244256',0,6,8,2);fill('#4d83a0',1,3,1,3)}else if(kind==='trousers'){fill('#263240');fill('#354555',1,1,6,2);fill('#1a232e',0,6,8,2);fill('#46596c',1,3,1,3)}else if(kind==='hair'){fill('#4a3025');fill('#674336',1,1,6,2);fill('#2e1e18',0,6,8,2);fill('#7b5140',1,3,1,2)}else fill('#ffffff');const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;if('encoding' in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;return tex}
  function box(w,h,d,color,viewModel=false,textureKind=null){const extra=textureKind?{map:partTexture(textureKind)}:{},mat=viewModel?basic(textureKind?0xffffff:color,extra):lambert(textureKind?0xffffff:color,extra),mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.castShadow=!viewModel;mesh.receiveShadow=!viewModel;return mesh}
  function disposeObject(root){if(!root)return;root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list){if(m.map)m.map.dispose();m.dispose()}}})}

  class PlayerVisuals{
    constructor(game){
      this.game=game;this.swingTime=0;this.swingLength=.32;this.swingKind='attack';this.currentKey=null;
      this.createFirstPerson();this.createThirdPerson();this.refreshHeldItem(true);
    }
    createFirstPerson(){
      if(!this.game.viewScene)this.game.viewScene=new THREE.Scene();
      if(!this.game.viewCamera){this.game.viewCamera=new THREE.PerspectiveCamera((this.game.settings&&this.game.settings.fov)||V.DEFAULT_SETTINGS.fov,(typeof innerWidth==='number'?innerWidth:1280)/(typeof innerHeight==='number'?innerHeight:720),.01,12);this.game.viewCamera.position.set(0,0,0);this.game.viewScene.add(this.game.viewCamera)}
      const root=this.firstPerson=new THREE.Group();root.name='FirstPersonViewModel';root.position.set(.48,-.42,-.82);this.game.viewCamera.add(root);
      const sleeve=box(.2,.48,.2,0x315d7c,true,'sleeve');sleeve.position.set(.06,.02,.04);sleeve.rotation.z=-.12;root.add(sleeve);
      const cuff=box(.205,.1,.205,0x25455e,true,'cuff');cuff.position.set(.055,-.21,.035);cuff.rotation.z=-.12;root.add(cuff);
      const hand=box(.19,.25,.19,0xd49b78,true,'skin');hand.position.set(.055,-.34,.03);hand.rotation.z=-.12;root.add(hand);
      this.fpItemAnchor=new THREE.Group();this.fpItemAnchor.position.set(-.04,-.22,-.16);this.fpItemAnchor.rotation.set(-.18,-.18,.08);root.add(this.fpItemAnchor);
      root.traverse(o=>{if(o.material){o.material.depthTest=true;o.material.depthWrite=true;o.renderOrder=5}});
    }
    createThirdPerson(){
      const root=this.thirdPerson=new THREE.Group();root.name='PlayerModel';this.game.scene.add(root);
      this.body=box(.58,.72,.3,0x315873,false,'shirt');this.body.position.y=1.05;root.add(this.body);
      this.head=box(.5,.5,.5,0xd09a78,false,'skin');this.head.position.y=1.66;root.add(this.head);
      const hair=box(.51,.16,.51,0x4a3025,false,'hair');hair.position.set(0,1.88,.01);root.add(hair);
      this.leftArm=box(.2,.7,.2,0x315873,false,'sleeve');this.leftArm.position.set(-.42,1.09,0);root.add(this.leftArm);
      this.rightArm=box(.2,.7,.2,0x315873,false,'sleeve');this.rightArm.position.set(.42,1.09,0);root.add(this.rightArm);
      const lh=box(.19,.2,.19,0xd09a78,false,'skin');lh.position.y=-.43;this.leftArm.add(lh);
      const rh=box(.19,.2,.19,0xd09a78,false,'skin');rh.position.y=-.43;this.rightArm.add(rh);
      this.leftLeg=box(.23,.72,.24,0x263240,false,'trousers');this.leftLeg.position.set(-.16,.36,0);root.add(this.leftLeg);
      this.rightLeg=box(.23,.72,.24,0x263240,false,'trousers');this.rightLeg.position.set(.16,.36,0);root.add(this.rightLeg);
      this.tpItemAnchor=new THREE.Group();this.tpItemAnchor.position.set(0,-.52,-.06);this.tpItemAnchor.rotation.set(-.4,0,-.12);this.rightArm.add(this.tpItemAnchor);
    }
    makeHeldMesh(key,firstPerson){
      const item=key&&V.Items[key];if(!item)return null;const isBlock=item.blockId!=null&&!V.Blocks[item.blockId].fluid;let geometry,material;
      if(isBlock){
        const def=V.Blocks[item.blockId],size=firstPerson?.38:.22;geometry=new THREE.BoxGeometry(size,size,size);
        material=def.textures.map(name=>new THREE.MeshBasicMaterial({map:V.createTileTexture(name,64),transparent:!!def.transparent,alphaTest:def.cutout?.32:0,side:def.transparent?THREE.DoubleSide:THREE.FrontSide,depthTest:true,depthWrite:true,toneMapped:false}));
      }else{
        geometry=new THREE.PlaneGeometry(firstPerson?.54:.3,firstPerson?.54:.3);material=new THREE.MeshBasicMaterial({map:V.createItemTexture(key,64),transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthTest:true,depthWrite:true,toneMapped:false});
      }
      const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=6;if(isBlock)mesh.rotation.set(.25,.65,.08);else mesh.rotation.set(0,0,-.2);return mesh;
    }
    clearAnchor(anchor){while(anchor.children.length){const child=anchor.children[0];anchor.remove(child);disposeObject(child)}}
    refreshHeldItem(force=false){const stack=this.game.inventory.selectedStack(),key=stack&&stack.key||null;if(!force&&key===this.currentKey)return;this.currentKey=key;this.clearAnchor(this.fpItemAnchor);this.clearAnchor(this.tpItemAnchor);if(!key)return;const fp=this.makeHeldMesh(key,true),tp=this.makeHeldMesh(key,false);if(fp)this.fpItemAnchor.add(fp);if(tp)this.tpItemAnchor.add(tp)}
    swing(kind='attack'){this.swingKind=kind;this.swingTime=this.swingLength}
    update(dt){
      const p=this.game.player;if(!p)return;this.swingTime=Math.max(0,this.swingTime-dt);this.refreshHeldItem();
      const first=p.perspective===0&&!this.game.hudHidden&&!p.dead&&this.game.state!=='destroyed';this.firstPerson.visible=first;this.thirdPerson.visible=p.perspective!==0&&!p.dead;
      const moving=Math.hypot(p.velocity.x,p.velocity.z)>.25&&p.grounded,bob=moving?Math.sin(p.walkDistance*7.5):0,sway=moving?Math.cos(p.walkDistance*3.75):0;
      const progress=this.swingTime>0?1-this.swingTime/this.swingLength:0,swing=this.swingTime>0?Math.sin(progress*Math.PI):0;
      this.firstPerson.position.set(.48+bob*.018,-.42+Math.abs(bob)*.018,-.82+sway*.012);this.firstPerson.rotation.set(-swing*.72,swing*.18,-swing*.48);
      if(p.eating){const eat=Math.sin(p.eatTime*15)*.08;this.firstPerson.position.y=-.31+eat;this.firstPerson.rotation.x=-.35+eat}
      this.thirdPerson.position.copy(p.position);this.thirdPerson.rotation.y=p.yaw;this.head.rotation.x=-p.pitch;this.head.rotation.y=0;
      const stride=moving?Math.sin(p.walkDistance*5.4)*.72:0;this.leftLeg.rotation.x=stride;this.rightLeg.rotation.x=-stride;this.leftArm.rotation.x=-stride*.75;this.rightArm.rotation.x=stride*.75-swing*1.35;this.rightArm.rotation.z=-swing*.22;
      if(p.sneaking){this.body.rotation.x=.22;this.head.position.y=1.58;this.leftArm.position.y=this.rightArm.position.y=1.02}else{this.body.rotation.x=0;this.head.position.y=1.66;this.leftArm.position.y=this.rightArm.position.y=1.09}
    }
    dispose(){if(this.firstPerson&&this.firstPerson.parent)this.firstPerson.parent.remove(this.firstPerson);if(this.thirdPerson&&this.thirdPerson.parent)this.thirdPerson.parent.remove(this.thirdPerson);disposeObject(this.firstPerson);disposeObject(this.thirdPerson)}
  }
  V.PlayerVisuals=PlayerVisuals;
})();
