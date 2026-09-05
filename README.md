# avisolanki.com

Avi Solanki’s single-screen personal site with a softly animated Three.js sun and three optional games. Plain HTML, CSS and JavaScript; no backend or runtime CDN dependencies.

## Develop

```sh
npm ci
npm run dev
npm test
```

Wrangler runs `npm run build` automatically before development and deployment. This bundles `src/scene.js` into `public/dawn-scene.js`. Cloudflare uses `npx wrangler deploy`, Worker `avisolanki-com`, and custom domain `avisolanki.com`.

- Copy and contacts: `public/index.html`. Styling: `public/style.css`.
- Games: `public/app.js`. Tested scoring and simulation: `public/game-rules.mjs`.
- Assembly: rotate three pieces into an A. Click, tap, or use Tab and Enter.
- Orbit: catch the spark in the arc five times before three misses.
- Flight: steer with mouse, touch, arrow keys, or on-screen buttons. The ship fires automatically; hit twelve targets before three misses.
- Escape closes the native dialog and restores focus. Leaving the tab stops an active game; returning offers a restart.
- Ambient rendering is capped at 24 fps and 1.5 device pixel ratio. It pauses in hidden tabs and respects reduced motion. A static sun remains without WebGL; the games work independently.
- Small screens reflow; very short screens scroll rather than clip.

Manrope uses the SIL Open Font License (`public/OFL-Manrope.txt`). Three.js uses the MIT license; esbuild preserves bundled license comments.

Light and dark themes follow the system on first visit. The appearance button saves an explicit preference when local storage is available. Game colours follow the selected theme. Both avisolanki.com and www.avisolanki.com are retained in the deployment configuration.
