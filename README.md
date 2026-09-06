# avisolanki.com

Avi Solanki’s single-screen personal site: two travelers beside a river, layered illustrated motion, About, LinkedIn, email, and light/dark appearance. The homepage has no arcade. V1 remains available at `/v1/`.

## Develop

```sh
npm ci
npm run dev
npm test
```

Wrangler runs `npm run build` before development and deployment. The existing Cloudflare Worker is `avisolanki-com`; custom domains are `avisolanki.com` and `www.avisolanki.com`.

- Homepage: `public/index.html`; appearance and About: `public/epic/style.css`, `public/epic/app.js`, and `public/theme.js`.
- Motion: `src/epic.js`, bundled to `public/epic/scene.js`. `npm run build:epic` rebuilds just this scene.
- The scene composites generated background and foreground artwork. Cloth and foliage use local deformation; the figures are not rigged characters. The foreground uses a runtime chroma key.
- Rendering pauses in hidden tabs and respects reduced motion. The illustration remains as a fallback without WebGL.
- Portrait composition keeps both travelers visible. About is a native dialog; Escape closes it and returns focus.
- Themes follow the system until the visitor chooses an appearance; that preference is saved when storage is available.

The original sun and courtyard code remains for earlier versions. Manrope uses the SIL Open Font License (`public/OFL-Manrope.txt`). Three.js uses the MIT license; bundled license comments are preserved.
