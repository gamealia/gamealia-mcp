# Gamealia MCP server

Publish your web game on [Gamealia](https://gamealia.app) from your AI coding assistant, and keep
**60–70% of the ad revenue** (100% from the players you bring), with **no exclusivity**.

Tell Claude Code, Cursor, Codex, VS Code, Gemini CLI, Windsurf, Cline, Zed or Claude Desktop:

> Publish this game on Gamealia. It's in ./my-game.

The server analyzes the project, integrates the Gamealia SDK (or swaps Poki / CrazyGames calls
through the compatibility layers), builds it, tests it in a real browser on desktop and mobile,
writes the listing and the cover, uploads the build and submits it for review **after you
confirm**. You approve one sign-in in your browser. A person reviews every version before it goes
live.

Works with any engine that exports to the web: plain HTML5 and JavaScript, Phaser, PixiJS,
three.js, Unity WebGL, Godot, GameMaker, Construct.

## Install

Node.js 22 or newer.

```sh
# Claude Code
claude mcp add gamealia -- npx -y gamealia-mcp
```

Any other MCP client (stdio):

```json
{
  "mcpServers": {
    "gamealia": { "command": "npx", "args": ["-y", "gamealia-mcp"] }
  }
}
```

The local autotest, preview and cover tools also use `playwright-core` with a headless Chromium
(`npx playwright-core install chromium`).

Ready-made skills and configs for each assistant:
[gamealia.app/developers](https://gamealia.app/developers#mcp).

## Tools

| Tool | What it does |
|---|---|
| `gamealia_analyze_project` | Detects the engine, the build and what the game needs |
| `gamealia_integrate_sdk` | Adds the SDK and lifecycle calls, or migrates Poki / CrazyGames calls |
| `gamealia_run_autotest` | Runs the game in a headless browser, desktop and mobile, with screenshots |
| `gamealia_create_game` | Creates the game page: title, description, controls, cover, translations |
| `gamealia_upload_version` | Uploads the build and submits it for review |
| `gamealia_get_status` | Review state and live version |
| `gamealia_get_earnings` | Estimated and confirmed earnings |
| `gamealia_playtest` | Plays the game in a browser and reports what it sees |

Full reference: [Publish with AI](https://gamealia.app/docs/publishing-with-ai).

## The deal for developers

- 60% of your game's ad revenue; launch partners (first game live by December 31, 2026) get 70%
  on all their games until June 30, 2027.
- 100% of the ads seen by players who arrive through your own link.
- Monthly payouts once your balance passes USD 50: PayPal, Payoneer, Wise or Mercado Pago.
- No exclusivity: keep your game on Poki, CrazyGames, itch.io or your own site.

More: [gamealia.app/developers](https://gamealia.app/developers) ·
[Revenue and payouts](https://gamealia.app/docs/revenue-and-payouts) ·
[Migrate from Poki](https://gamealia.app/docs/migrate-from-poki) ·
[Migrate from CrazyGames](https://gamealia.app/docs/migrate-from-crazygames)

## Contact

hello@gamealia.app
