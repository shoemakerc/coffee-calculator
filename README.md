# Coffee Calculator

Ratios, recipes, and a brew timer for making good coffee:
**[shoemakerc.github.io/coffee-calculator](https://shoemakerc.github.io/coffee-calculator/)**

- **Six methods:** V60, Chemex, French press, AeroPress, espresso, and cold brew, each with a house ratio, grind, and water temperature.
- **Linked numbers:** change the coffee, water, ratio, or number of cups, and the rest follow. Whichever of coffee or water you set last is held when the ratio moves. Arrow keys nudge a field (hold Shift for bigger steps).
- **Pour schedule and timer:** each step shows a running weight target for your scale, with an optional chime when it's time for the next pour.
- **Units:** grams or ounces, °C or °F.
- **Saved recipes:** stored in your browser's localStorage. No accounts, no server.

It's a companion to [shoemakerc.github.io](https://github.com/shoemakerc/shoemakerc.github.io) and borrows that site's look.

## Development

```bash
npm install
npm run dev     # http://localhost:3000/coffee-calculator/
npm test        # unit tests for the brew math (Vitest)
npm run lint
npm run build   # static export to out/
```

The app is served at `/coffee-calculator/`, so `basePath` is set in `next.config.ts`. Locally, open `/coffee-calculator/` rather than `/`.

## How it's organized

| Path | What's there |
| --- | --- |
| `src/lib/methods.ts` | Every method's ratio, grind, temperature, and pour schedule. Edit recipes here. |
| `src/lib/brew.ts` | The ratio math, servings, yield, and schedule targets. Pure functions with tests. |
| `src/lib/units.ts` | Unit conversion and number formatting. |
| `src/lib/storage.ts` | Saved recipes and preferences in localStorage. |
| `src/components/` | The calculator, the timer, and the header and footer shared with the main site. |
| `src/app/globals.css` | The calculator's own styles. |
| `scripts/sync-site.mjs` | Runs before `dev` and `build`. Pulls the main site's nav, footer links and base styles from its `/shared/` files into `src/lib/site-shared.json` and `src/app/site-base.css`. Don't edit those two by hand; change the site instead. |

## Deploying

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds the static export and publishes it to GitHub Pages. In the repo's **Settings → Pages**, the source must be set to **GitHub Actions**.

The 2017 Create React App starter that used to live here is tagged `legacy-2017`.
