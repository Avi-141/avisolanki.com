# avisolanki.com

A single-screen personal site for Avi Solanki. Static HTML, CSS, and a small three-piece puzzle. No application framework or backend.

## Local development

```sh
npm ci
npm run dev
npm test
```

Cloudflare Workers Builds deploys `main` using `npx wrangler deploy`, with no build command. The Worker is named `avisolanki-com` and serves `public/` at `avisolanki.com`.

Edit copy and links in `public/index.html`, styling in `public/style.css`, and interaction in `public/puzzle.js`. Puzzle buttons work with pointer, touch, Enter, and Space. Reduced motion follows the visitor’s system preference. At larger text sizes, the page can scroll rather than clip content.

Manrope is distributed under the SIL Open Font License; see `public/OFL-Manrope.txt`.
