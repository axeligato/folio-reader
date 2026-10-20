# Folio Reader

A free, privacy-first PDF reading experience with adaptive presets for books, comfortable reading, accessibility, and focused study.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Deploy to Vercel using its Vite preset (build: `npm run build`, output: `dist`).

## MVP

- Open local PDFs without server upload
- Render pages with PDF.js
- Four appearance presets: Book, Comfort, Accessible, Focus
- Mobile, tablet and desktop layouts
- Page navigation, zoom, local preset persistence

## Limitations

These presets currently change the interface appearance; they do **not** reflow PDF text or guarantee that inaccessible source PDFs become accessible. Animated page turning, text-to-speech, reflow, bookmarks, and offline/PWA support are planned, not implemented.

The accessible preset is only a visual starting point. Screen-reader navigation, focus handling, meaningful PDF semantics, contrast verification, and device testing require a dedicated accessibility audit.

## Privacy

PDF bytes are processed by PDF.js in your browser. The app does not intentionally upload documents to a backend.
