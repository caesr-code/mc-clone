# Voidlands external mods

Put JavaScript mod files in this folder and list them in `manifest.js`.

```js
window.VOIDLANDS_EXTERNAL_MODS = [
  'mods/example-mod.js',
  'mods/my-new-mod.js'
];
```

Mods load in the listed order before the game starts. Use `window.Voidlands.ModAPI` to register metadata, textures, items, blocks, recipes, commands and events.

Read `../MODDING.md` for the complete API and examples. Every multiplayer participant should run the same mod list.

Only install mods from people you trust. JavaScript mods run with the same browser permissions as the game.
