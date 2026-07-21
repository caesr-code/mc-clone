(function () {
'use strict';

const V = window.Voidlands;
const api = V && V.ModAPI;

if (!V || !api) {
  console.error('[Hyper Rockets] Voidlands ModAPI was not found.');
  return;
}

api.register({
  id: 'hyper-rockets',
  name: 'Hyper Rockets',
  version: '1.0.0',
  author: 'Voidlands Mod Pack'
});

const STORAGE_KEY = 'voidlands.mod.hyperRockets.enabled';
const settings = {
  maxMomentum: 110,
  momentumPerRocket: 62,
  boostDuration: 10.5,
  initialImpulse: 27,
  minimumLift: 3.6,
  lookLift: 11,
  horizontalSteering: 5.5,
  verticalSteering: 4.5,
  activeDecay: 0.17,
  inactiveDecay: 1.25
};

let enabled = true;
try {
  enabled = localStorage.getItem(STORAGE_KEY) !== 'false';
} catch (_) {
  enabled = true;
}

function saveEnabled() {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (_) {}
}

function hasEquippedElytra(game) {
  const chest = game && game.inventory && game.inventory.armor
    ? game.inventory.armor.chest
    : null;
  const item = chest && V.Items ? V.Items[chest.key] : null;
  return Boolean(item && item.elytra);
}

const originalApplyRocket = V.applyElytraRocket;
const originalUpdateMomentum = V.updateElytraMomentum;

V.applyElytraRocket = function applyHyperRocket(game, stack) {
  if (!enabled) {
    return typeof originalApplyRocket === 'function'
      ? originalApplyRocket(game, stack)
      : false;
  }

  if (!game || !game.player || !hasEquippedElytra(game)) return false;
  if (game.player.grounded || game.player.inWater) return false;

  const player = game.player;
  const direction = player.viewDirection().normalize();

  player.gliding = true;
  player.rocketMomentum = Math.min(
    settings.maxMomentum,
    (player.rocketMomentum || 0) + settings.momentumPerRocket
  );
  player.rocketMomentumTime = Math.max(
    player.rocketMomentumTime || 0,
    settings.boostDuration
  );

  player.velocity.addScaledVector(direction, settings.initialImpulse);
  player.velocity.y += Math.max(
    settings.minimumLift,
    direction.y * settings.lookLift
  );
  player.fallStart = null;

  if (game.visuals) game.visuals.swing('use');
  if (game.audio) game.audio.play('swing');

  if (game.mode !== 'creative' && stack) {
    stack.count -= 1;
    if (stack.count <= 0) game.inventory.slots[game.inventory.selected] = null;
  }

  if (game.ui) {
    game.ui.refreshHUD();
    game.ui.toast('Hyper Rocket launched!');
  }
  return true;
};

V.updateElytraMomentum = function updateHyperMomentum(player, dt) {
  if (!enabled) {
    if (typeof originalUpdateMomentum === 'function') {
      return originalUpdateMomentum(player, dt);
    }
    return;
  }

  if (!player || !Number.isFinite(dt) || dt <= 0) return;

  if (
    player.gliding &&
    player.rocketMomentumTime > 0 &&
    player.rocketMomentum > 0
  ) {
    const direction = player.viewDirection().normalize();
    const target = direction.multiplyScalar(player.rocketMomentum);

    player.velocity.x = V.lerp(
      player.velocity.x,
      target.x,
      Math.min(1, dt * settings.horizontalSteering)
    );
    player.velocity.y = V.lerp(
      player.velocity.y,
      target.y,
      Math.min(1, dt * settings.verticalSteering)
    );
    player.velocity.z = V.lerp(
      player.velocity.z,
      target.z,
      Math.min(1, dt * settings.horizontalSteering)
    );

    player.rocketMomentum *= Math.exp(-dt * settings.activeDecay);
    player.rocketMomentumTime = Math.max(0, player.rocketMomentumTime - dt);
    player.fallStart = null;
  } else {
    player.rocketMomentum = Math.max(
      0,
      (player.rocketMomentum || 0) * Math.exp(-dt * settings.inactiveDecay)
    );
    player.rocketMomentumTime = Math.max(
      0,
      (player.rocketMomentumTime || 0) - dt
    );
  }
};

api.command('hyperrockets', ({ args }) => {
  const option = String(args[0] || 'status').toLowerCase();

  if (['on', 'enable', 'enabled'].includes(option)) {
    enabled = true;
    saveEnabled();
    return 'Hyper Rockets enabled. Rockets now fly much faster and farther.';
  }

  if (['off', 'disable', 'disabled'].includes(option)) {
    enabled = false;
    saveEnabled();
    return 'Hyper Rockets disabled. Standard rocket physics restored.';
  }

  if (option === 'toggle') {
    enabled = !enabled;
    saveEnabled();
    return `Hyper Rockets ${enabled ? 'enabled' : 'disabled'}.`;
  }

  return `Hyper Rockets is ${enabled ? 'ON' : 'OFF'}. Use /hyperrockets on or /hyperrockets off.`;
});

api.on('gameStart', ({ game }) => {
  if (enabled && game && game.ui) {
    game.ui.toast('Hyper Rockets mod active');
  }
});

window.HyperRocketsMod = {
  version: '1.0.0',
  settings,
  isEnabled: () => enabled,
  setEnabled(value) {
    enabled = Boolean(value);
    saveEnabled();
  }
};
})();
