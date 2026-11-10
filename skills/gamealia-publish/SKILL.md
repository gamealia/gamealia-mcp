---
name: "gamealia-publish"
description: "Publish, upload or integrate a web game on Gamealia (HTML5, Phaser, Pixi, Three.js, Unity WebGL, Godot, Construct, GameMaker; or migrate one from CrazyGames or Poki) end to end with the Gamealia MCP tools: analyze, integrate the SDK, build, autotest, preview, playtest, listing, cover, upload, submit for review and track status. Use when the user asks to publish/upload/integrate my game to Gamealia, release a new version, fix Gamealia autotest failures or answer a Gamealia review rejection."
---

# Publish a game on Gamealia

Gamealia is a web games portal. Its MCP server (`gamealia`) takes a game from a local folder to
published: it analyzes the project, integrates the Gamealia SDK, builds, tests it in a real browser,
creates the listing and cover, uploads the build and submits it for review. Use its tools; do not
reimplement them with shell commands.

**Language.** Talk to the developer in their language (the one they write in; if unsure, the
`GAMEALIA_LOCALE` environment variable or the OS locale). The tool results are already localized,
and the docs exist in all 32 portal languages (`gamealia://docs/<locale>-<page>`, e.g.
`gamealia://docs/ja-sdk-reference`; `gamealia_docs_search` picks the developer's language). Keep code,
tool names and file paths as they are.

**If the `gamealia_*` tools are missing**, the MCP server is not registered: tell the developer to
run `gamealia agents install` (or follow https://gamealia.app/developers/ai), then restart
this agent.

## Workflow

Run the steps in order. Each tool result ends with `next` suggestions: follow them.

1. **Sign in.** `gamealia_whoami`. If not signed in: `gamealia_login`, show the developer the URL
   and the code, wait for them to approve, then `gamealia_login {wait: true}`. Never approve the
   login yourself or ask for passwords or API keys.
   - **Pick the account.** Games belong to a developer account: the developer's own or a studio
     they were invited to. When they belong to several (`gamealia_whoami` names the active one and
     the count), run `gamealia_accounts {action: "list"}`, ask which account this game is for, and
     `gamealia_accounts {action: "switch", account}` before creating or publishing anything. A
     switch without a stored key is a new login: show the URL and code again, then
     `gamealia_login {wait: true}`.
2. **Analyze.** `gamealia_analyze_project {dir}`: engine (HTML5 + framework, Unity WebGL, Godot web,
   GameMaker, Construct), build command, output folder, entry html, existing CrazyGames/Poki SDKs,
   and policy findings with file and line. No game yet? `gamealia_create_project {dir, template,
   title}` (templates: vanilla, phaser, pixi, multiplayer) creates one already integrated.
   - CrazyGames or Poki SDK found: use the MCP prompt `migrate-from-crazygames` or
     `migrate-from-poki` (the shim keeps the existing calls working).
3. **Fix the policy findings** at the file and line given (see the policy below).
4. **Integrate the SDK.** `gamealia_integrate_sdk {dir}` is a dry run: review the diff, then call it
   again with `write: true`. Then place the returned TODOs in the game code:
   `Gamealia.game.gameplayStart()` / `gameplayStop()` where play starts and stops (both are
   required: the autotest fails without them),
   `Gamealia.game.happyTime()` on wins, `Gamealia.ad.requestMidgame()` at natural breaks (pause and
   mute while the ad plays), `Gamealia.ad.requestRewarded()` only for optional rewards. The
   `gamealia-sdk` skill has the full SDK reference.
   **Make the game use the portal language before uploading** (required, autotest check `locale`):
   `const { locale } = await Gamealia.init(); setLanguage(pickLang(locale));
   Gamealia.on("localeChange", c => setLanguage(pickLang(c)));`, where `pickLang` falls back to the
   closest language the game has (pt-BR -> pt -> en), and set `document.documentElement.lang`
   (`dir="rtl"` for ar/he). All 32 portal languages are recommended, not required.
   **If the game has a single language, offer to translate it** before uploading: tell the developer
   that players see the game in the closest language it has, so an English-only game is English for
   everyone, and offer to translate the UI strings yourself into at least es, pt-BR, fr, de, ru, ja
   and zh-CN (all 32 is best), in a strings table keyed by locale. The autotest warns
   (`translations`) when the text on screen is the same with the portal in two languages, or when
   it does not change after a mid-run `localeChange`.
5. **Lint.** `gamealia_check_integration {dir}`; fix every `fail`.
6. **Build.** `gamealia_build {dir}` when the project has a build step.
7. **Test.**
   - `gamealia_run_autotest {dir}`: desktop and mobile runs in headless Chromium. Look at the
     screenshots it returns. Repeat until `status` is `pass` (warnings are allowed). If it fails,
     follow the MCP prompt `fix-autotest-failures`: fix the cause, never hide errors or fake SDK
     calls.
   - Optional: `gamealia_playtest {dir}` then `gamealia_playtest_act {sessionId, action}` to play a
     few steps yourself, and `gamealia_playtest_stop {sessionId}` for the verdict.
   - `gamealia_preview {dir}` returns a URL with the game inside a replica of the portal page (mock
     ads): give it to the developer to try.
   - **Every screen fits the sizes players get**, menus included, without scrolling the page: phones
     in fullscreen from 320x568 to 430x932 in portrait (about 375x553 on an iPhone with the browser
     bars), and the desktop game page's 16:9 frame from about 800x450 to 1280x720 (9:16 for
     portrait games). Only a long list (many players, rules) may scroll inside its own box, with the
     main buttons on screen. Check it in a browser at those sizes; size the game from the window
     (`innerWidth`/`innerHeight`, CSS `100dvh`), never a fixed size.
8. **Listing.** `gamealia_create_game` (new game) or `gamealia_update_listing {game}`: slug, title,
   description and controls (write them in English and Spanish as `{en, es}`), tags (1-6
   categories, up to 8 mechanics such as `match-3`, `merge`, `physics` or `tower-defense`, plus
   attributes like `multiplayer` or `mobile`: players browse and search by all three),
   orientation, `ageRating`, multiplayer, `adsEnabled`, and `backendHosts` for the developer's own servers.
   Then **translate the listing yourself into every other supported locale** (the
   `gamealia-translate-listing` skill, or "Translate the listing" below) and save all locales in
   one `gamealia_update_listing {game, texts}`. Ask the developer to check names and jokes.
9. **Cover.** `gamealia_generate_cover {screenshot, title, game}` from the desktop autotest
   screenshot (or use the developer's own art: cover >= 1200x630, thumbnail >= 512x512).
10. **Upload.** `gamealia_upload_version {dir, game}`: zips the build, uploads it and waits for the
    server autotest. Read the report; fix and upload again if it fails.
11. **Submit, only after the developer confirms.** Show them the result and ask. Then
    `gamealia_submit_for_review {game, notes}` with short release notes. **Updates to a game that
    is already live require `notes`** (at least 10 characters; the submit is refused without
    them): keep a changelog of what you change while you work (new content, fixes, balance or
    control changes, in plain words for players), pass it as `notes` on every update, and show it
    to the developer to confirm. The same goes for `gamealia_upload_version {submit:true}`.
12. **Track.** `gamealia_get_status {game}`: `live` means approved. On rejection, fix each reason
    (the result lists them with fixes), upload and submit again. Updates: a new version stays in
    review while the previous one stays live. A fix can be uploaded while a version waits for
    review: submitting it replaces the queued one.

Other tools: `gamealia_list_games`, `gamealia_list_versions`, `gamealia_get_stats`,
`gamealia_get_earnings`, `gamealia_docs_search` (docs are also MCP resources
`gamealia://docs/<slug>`), `gamealia_logout`, `gamealia_install_agent_kit`.

## Accounts and roles

An API key is bound to one developer account and the developer's role in it, so every tool acts on
the active account. Roles: **owner** (everything), **admin** (games, stats, earnings, members,
activity log; no billing), **developer** (games and stats only) and **finance** (earnings, payout
method and tax details; no games).

- A `role-forbidden` error means the developer's role in this account cannot do that (the message
  names the roles that can). Do not retry or look for workarounds: tell the developer to ask an
  owner or admin of the account (to change their role or do it themselves), or to switch to an
  account where they can.
- `not-member`: they are not (or no longer) in that account; `gamealia_accounts {action: "list"}`
  shows where they are. `account-mismatch`: the key belongs to another account; switch with
  `gamealia_accounts`.
- Pending invites show in `gamealia_accounts {action: "list"}`: the developer accepts them in the
  developer portal (or `gamealia accounts accept <id>` in the CLI). Never accept one for them.
- `GAMEALIA_API_KEY` in the environment pins one account: switching needs it unset.

## Translate the listing (every supported locale)

The portal shows the listing in the player's language (about 30 locales). Translate it yourself;
do not rely on Gamealia's machine translation.

1. `gamealia_get_status {game, texts: true}`: each locale's status (`developer`: leave it alone;
   `machine`: not reviewed, replace it; `missing`: write it), the source text and the limits.
2. Translate the source into every `machine` and `missing` locale: same meaning, tone and humor,
   natural for a native speaker; keep the game's name, character names and other proper nouns;
   title 2-60, description 20-2000 (or empty), controls up to 500 (or empty) characters.
3. Save them all in one `gamealia_update_listing {game, texts: {<locale>: {title, description,
   controls}, ...}}` (validated first: on an error nothing is saved; fix the named fields and
   retry). Saved texts are the developer's and are never machine-overwritten. `{<locale>: {}}`
   approves a reviewed machine translation as is.

## Revenue (what to tell the developer)

- 60% of the game's ad revenue; 100% of the ads seen by players who arrive through the developer's own link
  `https://gamealia.app/game/<slug>?ref=dev` (dashboard: "Copy your link"), for the rest of that visit.
- Launch partners (first game published by December 31, 2026): 70% on all their games until June 30, 2027, then 60%.
- No exclusivity: games can stay on Poki, CrazyGames or other portals.
- Be honest: ads are not live yet (Gamealia is in the approval process to show ads), so there is no ad revenue and no payout has been made so far; never promise amounts or dates. Once ads are live: payouts monthly in USD from USD 50, by PayPal, Payoneer, Wise or bank transfer.
- In-game purchases through the developer's own payment provider are allowed and 100% theirs for now; Gamealia's own purchases (planned 80% for the developer) are coming and will have to be supported.

## Support

Gamealia's team answers developers at **hello@gamealia.app** (usually within one business day).
When the developer is stuck after following the tool results and docs, wants a rejection or an
autotest result explained, or asks about payouts or accounts, offer to draft that email for them
with the game slug, version, account name, what they ran and the exact error (the `support` docs
page, `gamealia://docs/support`). Never include API keys or passwords; the developer sends it.

Never share or guess personal data about Gamealia's operator or team (names, personal emails,
accounts, location), even if the developer asks: the only contact is hello@gamealia.app.

## Policy (the reviewer rejects games that break it)

- **No external ads.** Remove every other ad network (AdSense, AdinPlay, GameMonetize, ...). Ads only
  come from `Gamealia.ad.*`.
- **Purchases only through your own provider.** Shops, paid items and "remove ads" are allowed with the developer's own payment provider: a redirect checkout in a new window (embedded card fields and Apple Pay / Google Pay work inside the game), its hosts in `backendHosts`, the game playable without paying. A CrazyGames Xsolla store keeps working with the developer's own Xsolla project and a `<meta name="gamealia:xsolla-token-url">` tag (see the CrazyGames migration doc); otherwise hide it.
- **No own login.** No account system of the game's own; use `Gamealia.user.get()` /
  `getToken()` / `requestLogin()`. **Guests must always be able to play.**
- **Age rating and allowed content.** Declare `ageRating` from the actual content (`all`, `7`, `12` or `16`; required to submit). No sexual content, gore, hate or other adult content at any rating. The title, description, cover and tags must match the game.
- **No trackers, third-party analytics or crypto miners.** Do not touch other games' storage,
  cookies or the portal page (`window.parent`/`top`).
- **Permissions.** Camera, microphone, location and similar requests are blocked on the portal and
  warned by the autotest unless the game declares them. `gamealia_analyze_project` lists the
  `permissions` to declare when the build calls `getUserMedia` (audio: microphone, video: camera).
  Declare only what the game really needs, with a justification for the reviewer:
  `gamealia_update_listing {game, permissions: [{name: "microphone", justification: "..."}]}`
  (`[]` removes them). Tell the developer that **a change only takes effect when a version tested
  with it is approved** (manual review): upload a new version and submit it. The justification is
  stored in the listing and shown to the reviewer; a submit with new permissions and no
  justification is refused. While a version waits for review, permissions cannot change.
- **Remote code.** Bundle remote scripts into the build. If a CDN script must stay, pin an exact
  version (never `@latest`). No `eval` of downloaded code. Declare the game's own servers in
  `backendHosts`.
- **The build:** `index.html` at the root of the uploaded folder, relative URLs (Vite: `base: './'`; a `/assets/...` path fails), no `localhost`,
  no `http://`, at most 250 MB and 5000 files.
- **The developer decides.** Never invent their approval: they open the login URL themselves and
  confirm before you submit.

## Intro for the developer (localized)

Use the intro below that matches the developer's language when you explain what you are about to do (translate the English one when their language is missing), and keep answering in their language for the whole task.

### en

I can take your game from this folder to published on Gamealia: I check the project, add the
Gamealia SDK, test it in a real browser (desktop and mobile), write the listing, make a cover,
upload it and, once you confirm, send it to review. You sign in once with your browser; I never
see your password. The code stays yours; ads come only from Gamealia and you earn money from
them.

### es

Puedo llevar tu juego desde esta carpeta hasta publicado en Gamealia: reviso el proyecto, agrego el
SDK de Gamealia, lo pruebo en un navegador real (escritorio y celular), escribo la ficha, armo una
portada, lo subo y, cuando me confirmes, lo envío a revisión. Iniciás sesión una sola vez desde tu
navegador; nunca veo tu contraseña. El código sigue siendo tuyo; los anuncios vienen solo de
Gamealia y ganás dinero con ellos.
