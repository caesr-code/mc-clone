(function(){
'use strict';
const V=window.Voidlands;
V.VERSION='2.0.2';

/*
  Creative mode used 999 as entity damage so that blocks could be broken
  instantly. Entity combat and block breaking are separate systems, so that
  value must never reach a mob. Rebuild absurd melee values from the held
  weapon, enchantments and critical state while preserving instant Creative
  block breaking.
*/
V.computeSafeMeleeDamage=function(game,incoming){
  let damage=Number(incoming);
  if(!Number.isFinite(damage)||damage<0)damage=1;
  if(damage<100||!game)return damage;

  const stack=game.inventory&&game.inventory.selectedStack&&game.inventory.selectedStack();
  const item=stack&&V.Items[stack.key];
  if(!item)return 1;

  const enchant=id=>V.enchantLevel?V.enchantLevel(stack,id):0;
  let base=Math.max(1,Number(item.damage)||1);

  if(item.tool==='mace'){
    const density=enchant('density'),breach=enchant('breach');
    const player=game.player;
    const fall=player&&player.fallStart!=null?Math.max(0,player.fallStart-player.position.y):0;
    const smash=fall>1.5,scale=2.6+density*.55;
    base=6+breach*.8+(smash?Math.min(42,Math.floor((fall-1.5)*scale)):0);
  }

  // The existing enchantment pipeline applies both combat bonus passes.
  base+=enchant('sharpness')*2.45;

  const player=game.player;
  const critical=!!(player&&!player.grounded&&!player.inWater&&player.velocity&&player.velocity.y<-.05);
  if(critical)base*=1.5;

  // No legitimate melee hit in this build exceeds this, including a maximum
  // Mace smash. This also protects old saves with corrupted item definitions.
  return Math.max(1,Math.min(96,base));
};

const EntityManager=V.EntityManager;
const previousAttackRay=EntityManager.prototype.attackRay;
EntityManager.prototype.attackRay=function(origin,dir,maxDist,damage){
  return previousAttackRay.call(this,origin,dir,maxDist,V.computeSafeMeleeDamage(this.game,damage));
};

})(window.Voidlands);
