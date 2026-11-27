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

`init()` resolves with `{ environment, locale, gameId, user, joinRoom, joinKey, device }`.

Optional: call `Gamealia.game.setProgress(n * 100 / N)` when the player advances (level n of N; 0..100,
shown on the player's "continue playing" row), and `Gamealia.game.setContext({ level, mode, build })` with
up to 10 string/number/bool values for crash reports and player feedback (never player names or e-mails).
Uncaught script errors are reported automatically (Insights: crash rates while loading and while playing);
call `Gamealia.game.reportError(message)` for errors the game catches itself.
Screenshots for player feedback (only when the player opts in) are automatic from the largest canvas; a game
without a canvas, or one that wants to pick its image, calls `Gamealia.game.onCapture(() => canvas | dataUrl | null)`.

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
- `await Gamealia.user.getToken()`: a signed token for the game's own backend to verify, or `null` (ES256, 5 min; JWKS URL, `iss`, `aud` and `kid` are on the game's dashboard page, "Player tokens").
- `await Gamealia.user.requestLogin()`: shows the portal sign-in. Never build a login of your own (linking an existing account on your servers with a one-time code is allowed: see the user-accounts doc).
- `Gamealia.user.onChange(cb)`. Guests must always be able to play.

## Saves

- `await Gamealia.data.get(key)` / `await Gamealia.data.set(key, value)` (JSON, 1 MB total; resolves
  `false` when over).
- `await Gamealia.data.load()`: `{ ok: true, data }` or `{ ok: false, error }`. On `ok: false` do not
  start a new save over the old one.
- `getAll()`, `remove(key)`, `clear()`. Synced to the account when signed in.

## Multiplayer rooms

The game's own server hosts the rooms and decides who enters; Gamealia adds friends, presence,
invites, room lists, Join and the key prompt. Build any subset and declare it in the listing:
`multiplayer: { min, max, features }`, features from `invites`, `publicRooms`, `friendsRooms`,
`lockedRooms`, `lateJoin` (omitted = invites + publicRooms; locked/lateJoin need a rooms feature).

- Join code, every multiplayer game: `const { joinRoom } = await Gamealia.init()` (=
  `room.getJoinCode()`) and `Gamealia.on("roomJoin", (code, { key }) => connect(code, key))`.
- Invites: `Gamealia.room.showInvite(code)` (sheet with the player's online friends) or
  `await Gamealia.room.inviteLink(code)`. Friends can also invite from Gamealia once the game reports
  a room. The invited friend gets `code` unchanged.
- Rooms: `Gamealia.room.publish({ code, name, players, max, inProgress, visibility, locked, lateJoin })`,
  again on every change (heartbeat every 15 s). `visibility: "public"` lists it for everyone,
  `"friends"` only for the host's friends (needs a signed-in host). Full and started rooms stay
  published; `Gamealia.room.unpublish()` only when the room closes.
- Locked rooms (`locked: true`): never publish the key. The portal asks the joining player for it and
  hands it to the game only: `Gamealia.room.getJoinKey()` / `key` in `roomJoin`. The server checks it
  (constant-time compare); on a wrong key call `Gamealia.room.joinFailed("wrong-key")` and the portal
  asks again. Also `"full"`, `"in-progress"`, `"closed"`.
- Room pass: `await Gamealia.room.getJoinPass(code)` = JWT signed by Gamealia (ES256, JWKS
  `https://api.gamealia.app/.well-known/jwks.json` or, with a per-game key, `https://api.gamealia.app/v1/games/<game id>/jwks.json`, `iss` `https://api.gamealia.app`, `aud` = game id,
  `typ` `"gamealia-room-pass"`, `room`, `sub`, `why` host|friend|invite, `host`, `by`, 120 s, `jti`) or
  null. Friends-only rooms: the server must require a pass (`why: "friend"` with `host` = the room's
  creator from `user.getToken()`, or `why: "invite"` with `by` in the room). Invited players may skip
  the key. Reject unsigned mock passes (`mock.` prefix).
- `Gamealia.presence.setStatus(text)`.
- Friends (signed-in players; ids are per game, like `user.get().id`): `await Gamealia.friends.list()` ->
  `{ ok, friends: [{ id, username, avatarUrl, online, playingThisGame, room: { code, name, players, max, locked } | null }] }`
  (guests: empty list; mock: two fake friends). `await Gamealia.friends.invite(friend.id, code)` ->
  `{ ok, delivered: "app" | "pushed" | false }` (one per friend every 30 s). `Gamealia.friends.onChange(() => list())`
  (at most every 5 s). `Gamealia.room.onJoin((code, { key }) => connect(code, key))` = `on("roomJoin")`.
- Parties (portal groups of up to 8 friends; the leader picks the game): nothing new to build. The leader's game
  creates a room and publishes it (`visibility: "friends"`); every other member arrives through `joinRoom` /
  `roomJoin`, as with an invite. Optional: `await Gamealia.party.get()` -> `{ id, isLeader, members: [{ id, username,
  avatarUrl, isLeader }], size, roomCode } | null` and `Gamealia.party.onChange(cb)` for a lobby. Mock party: see "Testing
  with the mock" in the multiplayer docs.
- Declare the game's own servers in the listing's `backendHosts`.
- Test joins locally with two tabs: see "Testing with the mock" in `gamealia://docs/en-multiplayer`.
- The autotest `multiplayer` check (warning) says what is missing, with the exact call.

## Game chat

Optional: a game's text chat can go through `Gamealia.chat` instead of its own server: every message is tied to a
Gamealia account (the username is shown), and Gamealia filters it (links, e-mails, @handles and phone
numbers refused, insults masked), rate-limits it (1 per 1.5 s, 20 per minute) and moderates it
(reports, blocks, 24 h mutes). Channels per game: `"global"` and `"room:<code>"`.

- `await Gamealia.chat.join(channel)` → `{ ok, messages (last 50, 7 days), canSend, reason? }`;
  `reason: "signin"` for guests (they read; show "Sign in to chat" and call `user.requestLogin()`),
  `"muted"`, `"unavailable"`. `chat.leave(channel)`.
- `await Gamealia.chat.send(channel, { text })` (max `chat.MAX_CHARS` = 200) or `{ sticker: "gg" }`
  (your own id `^[a-z0-9_-]{1,24}$`, the game translates it: quick phrases) → `{ ok, message }` or
  `{ ok: false, error }` (`signin`, `rate`, `muted`, `blocked-content`, `too-long`, ...).
  `chat.check(text)` runs the filter locally.
- `chat.onMessage(m => ...)` (each message once, own included; `m.from.id` = the player's per-game id,
  `m.from.username`, `m.mine`), `chat.onDelete(({ channel, ids }) => ...)` (moderation or blocks: remove
  them), `chat.onState(({ channel, canSend, reason }) => ...)` (sign in/out, mute).
- `chat.report(messageId)`, `chat.block(messageId)` (blocks the sender on all of Gamealia).
- Locally (localhost, mock) it is an in-memory echo through the same filter; in preview/autotest
  `canSend` is false (`"unavailable"`). Voice chat may use the developer's own service.

## In-game purchases (store)

Sell through your own Xsolla project with `Gamealia.store` (Gamealia takes no part of the sale): add
`<meta name="gamealia:xsolla-project-id" content="123456">` and
`<meta name="gamealia:xsolla-token-url" content="https://your-server/xsolla-token">` (an endpoint that
receives `{ gamealiaToken }`, verifies it and answers `{ token }`, an Xsolla user token: example in
`https://gamealia.app/downloads/examples/xsolla-token-endpoint/`).

- `Gamealia.store.isAvailable` (false without both tags: every call rejects `storeUnavailable`),
  `setSandbox(true)` for test payments, `getCatalogItems()`, `getPlayerInventory()`,
  `buyItem(sku)` (call it from a click: opens Xsolla's checkout in a new window; resolves when paid,
  rejects `purchaseCancelled`), `consumeItem(sku, quantity)`. Guests get `userNotAuthenticated`: ask
  them to sign in.
- Grant what was paid on your server (verify with Xsolla, consume there), never only in the client.
  Declare your server and the Xsolla hosts in `backendHosts`. The game stays playable without paying.

## Events

`Gamealia.on(event, cb)` returns an unsubscribe function. Events: `adStart`, `adEnd`,
`userChange`, `roomJoin` (`(code, { key })`), `pause`, `resume`, `mute`, `unmute`, `localeChange`,
`friendsChange`, `partyChange`
(chat events arrive through `chat.onMessage` / `onDelete` / `onState`).
Honor `mute` / `unmute` (silence all sound, restore it): the autotest's `mute_response` check warns when sound keeps playing after `mute`.

## Engines and migrations

- **Unity WebGL:** `Gamealia.jslib` plugin plus the `Gamealia.cs` wrapper. **Godot:** the
  `addons/gamealia` addon (a `Gamealia` autoload), one for Godot 4 and one for Godot 3.5, picked
  from `project.godot` (`config_version=5` is Godot 4, `4` is Godot 3). `gamealia_integrate_sdk`
  adds them. Godot 4: `var info := await Gamealia.init()`. Godot 3.5:
  `var info = yield(Gamealia.init(), "completed")`. Then show `info.locale`, call
  `Gamealia.loading_stop()`, `gameplay_start()`/`gameplay_stop()`. Do not call `window.Gamealia`
  through `JavaScript.eval` / `JavaScriptBridge.eval` by hand.
- **CrazyGames SDK:** load `https://gamealia.app/sdk/crazygames.js` instead of the CrazyGames
  script; `CrazyGames.SDK` calls keep working.
- **Poki SDK:** load `https://gamealia.app/sdk/poki.js` instead of the Poki script; `PokiSDK`
  calls keep working.

## Rules that affect code

No other ad networks, purchases only through your own payment provider (`Gamealia.store` with your
own Xsolla project, or any provider with checkout in a new window; hosts in `backendHosts`, playable
without paying), no own login (guests play), no
trackers, no `document.cookie`, no other games' localStorage keys, no `window.parent`/`top`, no
service workers, no `eval` of downloaded code. Bundle remote scripts or pin exact versions.
Microphone or camera only when declared in the listing (manual review).

## Updates and release notes

Keep a short changelog of what you change in the game (new content, fixes, balance or control
changes). Submitting an update to a game that is already live requires it as release notes
(`notes`, at least 10 characters, in `gamealia_submit_for_review` or `gamealia_upload_version
{submit:true}`; `--notes` in the CLI); the developer confirms it before you submit.

Talk to the developer in their language; keep code and API names as they are.
