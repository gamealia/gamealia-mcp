---
name: "gamealia-sdk"
description: "Reference for the Gamealia web games SDK (window.Gamealia): init, the portal language (locale, localeChange), loadingStop, gameplayStart/gameplayStop, happyTime, midgame and rewarded ads, players and tokens, cloud saves, multiplayer rooms, Unity/Godot plugins and the CrazyGames/Poki shims. Use when writing, reviewing or debugging game code that calls Gamealia.* or when integrating the Gamealia SDK by hand."
---

# Gamealia SDK (`window.Gamealia`)

Load the SDK in `index.html`, before the game scripts (`gamealia_integrate_sdk` does it):

```html
<script src="https://gamealia.app/sdk/v1.js"></script>
```

Every call is safe outside the portal: locally it runs a mock (mock ads, a fake user, saves in
localStorage). The full reference is the MCP resource `gamealia://docs/en-sdk-reference` (or
`gamealia_docs_search {query}`).

## Lifecycle (required)

```js
const { locale, user, device } = await Gamealia.init(); // first SDK call, at startup
Gamealia.game.loadingStart();
// ... load assets ...
Gamealia.game.loadingStop();   // REQUIRED when the game is ready: the autotest fails without it
Gamealia.game.gameplayStart(); // required: real play starts (after the first input, level start, unpause)
Gamealia.game.gameplayStop();  // required: play stops (game over, pause menu, level end)
Gamealia.game.happyTime();     // a big moment (win, record)
```

`init()` resolves with `{ environment, locale, gameId, user, joinRoom, device }`.

### Language (required: autotest check `locale`)

`locale` is the language the player chose on the portal (one of 32 codes: en, es, pt-BR, ja, ar...),
not the browser's. The game **must** show its UI in it, falling back to the closest language it has
(pt-BR -> pt -> en), and follow `localeChange` when the player switches language mid-game (no
reload). Supporting all 32 languages is recommended, not required; ignoring the locale fails the
autotest (reading it but not following `localeChange` warns).

```js
const LANGS = ["en", "es", "pt"]; // the languages the game has
const pickLang = (code) =>
  [code, code.split("-")[0]].find((c) => LANGS.includes(c)) ?? "en"; // pt-BR -> pt -> en
function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = ["ar", "he"].includes(lang) ? "rtl" : "ltr";
  // ...swap the game's strings
}
const { locale } = await Gamealia.init();
setLanguage(pickLang(locale));
Gamealia.on("localeChange", (c) => setLanguage(pickLang(c)));
```

`Gamealia.peekInit().locale` gives the same code once init finished. With the CrazyGames/Poki shims,
`SDK.user.systemInfo.locale` / `getSystemInfo()` or `PokiSDK.getLanguage()` count too (a portal
language change reloads the game). If the game has its own language menu or hard-coded strings,
wire both up (default to the portal's language; the player's own in-game choice can still override
it).

## Ads

```js
Gamealia.onAdStart(() => { pause(); muteAudio(); });
Gamealia.onAdEnd(() => { resume(); unmuteAudio(); });
await Gamealia.ad.requestMidgame();               // at natural breaks: game over, between levels
const { rewarded } = await Gamealia.ad.requestRewarded();
if (rewarded) giveExtraLife();                     // reward only when rewarded is true
```

Both resolve `{ shown, rewarded }` and never reject. Never show ads from other networks.

## Players

- `await Gamealia.user.get()`: `{ id, username, avatarUrl }` or `null` for a guest.
- `await Gamealia.user.getToken()`: a signed token for the game's own backend to verify, or `null`.
- `await Gamealia.user.requestLogin()`: shows the portal sign-in. Never build a login of your own.
- `Gamealia.user.onChange(cb)`. Guests must always be able to play.

## Saves

- `await Gamealia.data.get(key)` / `await Gamealia.data.set(key, value)` (JSON, 1 MB total; resolves
  `false` when over).
- `await Gamealia.data.load()`: `{ ok: true, data }` or `{ ok: false, error }`. On `ok: false` do not
  start a new save over the old one.
- `getAll()`, `remove(key)`, `clear()`. Synced to the account when signed in.

## Multiplayer rooms

- `Gamealia.room.getJoinCode()`: the room code the player was invited to, or `null`.
- `await Gamealia.room.inviteLink(code)` / `Gamealia.room.showInvite(code)`.
- `Gamealia.room.publish({ code, name, players, max, inProgress })` every 15 s while open;
  `Gamealia.room.unpublish()`.
- `Gamealia.presence.setStatus(text)`.
- Declare the game's own servers in the listing's `backendHosts`.

## Events

`Gamealia.on(event, cb)` returns an unsubscribe function. Events: `adStart`, `adEnd`,
`userChange`, `roomJoin`, `pause`, `resume`, `mute`, `unmute`.

## Engines and migrations

- **Unity WebGL:** `Gamealia.jslib` plugin plus the `Gamealia.cs` wrapper. **Godot:** the
  `addons/gamealia` addon. `gamealia_integrate_sdk` adds both.
- **CrazyGames SDK:** load `https://gamealia.app/sdk/crazygames.js` instead of the CrazyGames
  script; `CrazyGames.SDK` calls keep working.
- **Poki SDK:** load `https://gamealia.app/sdk/poki.js` instead of the Poki script; `PokiSDK`
  calls keep working.

## Rules that affect code

No other ad networks, purchases only through your own payment provider (checkout in a new window,
hosts in `backendHosts`, playable without paying), no own login (guests play), no
trackers, no `document.cookie`, no other games' localStorage keys, no `window.parent`/`top`, no
service workers, no `eval` of downloaded code. Bundle remote scripts or pin exact versions.
Microphone or camera only when declared in the listing (manual review).

## Updates and release notes

Keep a short changelog of what you change in the game (new content, fixes, balance or control
changes). Submitting an update to a game that is already live requires it as release notes
(`notes`, at least 10 characters, in `gamealia_submit_for_review` or `gamealia_upload_version
{submit:true}`; `--notes` in the CLI); the developer confirms it before you submit.

Talk to the developer in their language; keep code and API names as they are.
