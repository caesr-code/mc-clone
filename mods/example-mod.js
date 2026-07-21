(function(){
'use strict';
const api=window.Voidlands&&window.Voidlands.ModAPI;if(!api)return;
api.register({id:'example-mod',name:'Example Mod',version:'1.0.0',author:'Voidlands'});
api.command('hello',()=> 'Hello from the example mod!');
api.on('gameStart',({game})=>game.ui.toast('Example Mod loaded'));
})();
