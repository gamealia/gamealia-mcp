---
name: "gamealia-translate-listing"
description: "Translate a Gamealia game listing (title, description, controls) yourself into every supported locale (about 30), keeping the meaning, tone, limits and the game's proper nouns, and save all locales in one gamealia_update_listing call. Use when the user asks to translate/localize their Gamealia game page or listing, after creating or changing the listing text, or when gamealia_get_status {texts:true} shows missing or machine-translated locales."
---

# Translate a Gamealia listing into every supported locale

The Gamealia portal shows each game's listing (title, description, controls) in the player's
language. **You translate it yourself**, in the game's own tone, and save every locale in one call.
Do not ask Gamealia to machine-translate it: your translation, checked by the developer, is better.

## Steps

1. **Fetch the listing.** `gamealia_get_status {game, texts: true}` returns, for every supported
   locale, its status and current text:
   - `developer`: written or approved by the developer. **Never change these** unless the developer
     asks.
   - `machine`: machine-translated by Gamealia, not reviewed. Replace them with your translation.
   - `missing`: no text yet. Translate them.

   It also returns the source locale and text (English, else Spanish, else the developer's first
   locale), the English name of each locale's language, and the field limits.
2. **Translate the source text into every `missing` and `machine` locale** (all of them, not just
   a few):
   - Keep the meaning, the tone and the humor of the original; adapt idioms instead of translating
     word by word. Write as a native speaker would, with the right script and formality for each
     language (e.g. `zh-TW` is Traditional Chinese, `pt-BR` Brazilian Portuguese).
   - **Keep the game's name, character names, brands and other proper nouns** as they are (only
     transliterate when the script requires it and the developer agrees). Keep key names in
     controls (`WASD`, `Space`, arrow keys) recognizable.
   - **Respect the limits** (characters, after trimming): title 2-60, description 20-2000 or empty,
     controls up to 500 or empty. Shorten rather than cut a sentence in half. Keep line breaks of
     the original.
   - Do not add claims, keywords or text that is not in the original.
3. **Save every locale in one call:** `gamealia_update_listing {game, texts: {<locale>: {title,
   description, controls}, ...}}`. The tool validates all of them first; if a field breaks a
   limit, nothing is saved and the error names the locale and field: fix those and call again.
   Saved texts count as the developer's, and Gamealia's machine translation never overwrites them.
4. **Tell the developer** which locales you wrote and ask them to check names and jokes. To keep a
   machine translation the developer reviewed as it is, save it with `{<locale>: {}}`; to remove a
   locale, `{<locale>: null}`.

When the source text changes later (a new description), translate again: Gamealia refreshes only
its own machine locales, never the ones you saved, so those keep the old text until you update them.

Without the MCP tools: `gamealia status <slug> --texts --json` prints the same data.

## Intro for the developer (localized)

Use the intro below that matches the developer's language when you explain what you are about to do (translate the English one when their language is missing), and keep answering in their language for the whole task.

### en

I can translate your game's page into every language Gamealia supports (about 30), keeping your
tone, your jokes and the names of your game and characters. I only fill in the languages you have
not written yourself, and I save them all at once; please check the names and jokes afterwards.

### es

Puedo traducir la ficha de tu juego a todos los idiomas que soporta Gamealia (unos 30), manteniendo
tu tono, tus chistes y los nombres del juego y de los personajes. Solo completo los idiomas que no
escribiste vos, y los guardo todos juntos; después revisá los nombres y los chistes.
