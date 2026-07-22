(function () {
  'use strict';
  const api = window.Voidlands && window.Voidlands.ModAPI;
  if (!api) return;

  api.register({
    id: 'qol-commands',
    name: 'QoL Commands',
    version: '1.0.0',
    author: 'Voidlands Mod Author'
  });

  api.command('heal', ({ game }) => {
    if (!game) return 'No world loaded.';
    game.player.health = 20;
    game.ui.refreshHUD();
    return 'Healed.';
  });

  api.command('feed', ({ game }) => {
    if (!game) return 'No world loaded.';
    game.player.hunger = 20;
    game.player.saturation = Math.max(game.player.saturation, 5);
    game.ui.refreshHUD();
    return 'Fed.';
  });

  api.command('day', ({ game }) => {
    if (!game) return 'No world loaded.';
    game.data.time = 0;
    return 'Time set to day.';
  });

  api.command('night', ({ game }) => {
    if (!game) return 'No world loaded.';
    game.data.time = 13000;
    return 'Time set to night.';
  });

  api.command('clearinv', ({ game }) => {
    if (!game) return 'No world loaded.';
    const slots = game.inventory.slots;
    for (let i = 0; i < slots.length; i++) {
      slots[i] = null;
    }
    game.ui.refreshHUD();
    return 'Inventory cleared.';
  });
})();
