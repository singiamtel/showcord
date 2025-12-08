# Upstream Tracking

How to keep Showcord in sync with upstream Pokemon Showdown sources.

## Update Commands

| Source | How to Update |
|--------|---------------|
| `@pkmn/*` packages | Dependabot PRs (automatic weekly) |
| `src/vendor/pokemon-showdown/` | `./scripts/sync-ps-client.sh` |
| CDN assets (data, CSS) | Automatic (always serves latest) |

## Vendored Battle Engine

The `src/vendor/pokemon-showdown/` directory contains the battle animation engine from the official Pokemon Showdown client. These `battle-*.ts` files are **MIT licensed** (see LICENSE in that directory).

### Syncing

1. Clone the PS client locally (if you haven't):
   ```bash
   git clone https://github.com/smogon/pokemon-showdown-client.git pokemon-showdown-client
   ```

2. Run the sync script:
   ```bash
   ./scripts/sync-ps-client.sh
   ```

3. Test and commit:
   ```bash
   npm run build
   npm test
   git add src/vendor/pokemon-showdown/
   git commit -m "chore: sync pokemon-showdown battle engine"
   ```

The local clone (`pokemon-showdown-client/`) is gitignored and not committed.

## npm packages (`@pkmn/*`)

Updated automatically via Dependabot (see `.github/dependabot.yml`).

- `@pkmn/client` - Battle state management
- `@pkmn/dex` - Pokemon data access
- `@pkmn/img` - Sprite URLs
- `@pkmn/protocol` - Protocol parsing
- `@pkmn/view` - Battle visualization

## CDN Assets

Loaded directly from `play.pokemonshowdown.com` in `index.html` - always up to date:

- Data: pokedex, moves, items, abilities, typechart, graphics, teambuilder-tables, aliases, text
- Styles: battle.css, sim-types.css
