(function () {
  'use strict';
  const api = window.Voidlands && window.Voidlands.ModAPI;
  const V = window.Voidlands;
  if (!api || !V) return;

  api.register({
    id: 'tree-miner',
    name: 'Tree Miner',
    version: '1.0.0',
    author: 'Voidlands Mod Author'
  });

  // Bounds worst-case work per trigger so a pathological or malformed "tree"
  // (e.g. one connected to a huge log structure) can't stall the tick.
  const MAX_BLOCKS_PER_TRIGGER = 128;

  // Coordinates currently being broken by our own flood-fill, so the
  // blockChange events our own setBlock calls generate get ignored instead
  // of re-triggering the handler.
  const processing = new Set();

  function coordKey(x, y, z) {
    return x + ',' + y + ',' + z;
  }

  // Flood-fills outward from `seeds` through blocks matching `matchId`,
  // breaking each one and dropping its item, up to MAX_BLOCKS_PER_TRIGGER
  // total blocks for this single trigger.
  function floodFillBreak(game, world, seeds, matchId) {
    const queue = seeds.slice();
    const visited = new Set(seeds.map(([x, y, z]) => coordKey(x, y, z)));
    let count = 0;

    while (queue.length && count < MAX_BLOCKS_PER_TRIGGER) {
      const [x, y, z] = queue.shift();
      if (world.getBlock(x, y, z) !== matchId) continue;

      const k = coordKey(x, y, z);
      processing.add(k);

      const blockDef = V.Blocks[matchId];
      const dropKey = blockDef ? blockDef.drop : null;
      if (dropKey) {
        game.entities.drop(V.makeStack(dropKey, 1), x + 0.5, y + 0.55, z + 0.5);
      }
      world.setBlock(x, y, z, 0, true);

      processing.delete(k);
      count++;

      const neighbors = [
        [x + 1, y, z], [x - 1, y, z],
        [x, y + 1, z], [x, y - 1, z],
        [x, y, z + 1], [x, y, z - 1]
      ];
      for (const [nx, ny, nz] of neighbors) {
        const nk = coordKey(nx, ny, nz);
        if (visited.has(nk)) continue;
        visited.add(nk);
        if (world.getBlock(nx, ny, nz) === matchId) {
          queue.push([nx, ny, nz]);
        }
      }
    }
  }

  api.on('blockChange', (payload) => {
    if (!payload || !payload.playerChange) return;
    const { world, x, y, z, before, after } = payload;
    if (!world) return;
    if (after !== 0) return; // only care about breaks, not placements
    if (processing.has(coordKey(x, y, z))) return; // our own break, ignore

    const logDef = V.BlockByKey['log'];
    if (!logDef || before !== logDef.id) return;

    const game = api.getGame();
    if (!game) return;

    // The originally-broken block is already air and already dropped by the
    // base game; only chain out into its still-standing log neighbors.
    const seeds = [
      [x + 1, y, z], [x - 1, y, z],
      [x, y + 1, z], [x, y - 1, z],
      [x, y, z + 1], [x, y, z - 1]
    ].filter(([nx, ny, nz]) => world.getBlock(nx, ny, nz) === logDef.id);

    if (seeds.length) {
      floodFillBreak(game, world, seeds, logDef.id);
    }
  });
})();
