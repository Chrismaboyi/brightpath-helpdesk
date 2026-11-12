# BrightPath Learn help desk

**Live demo:** https://brightpath-learn-helpdesk.netlify.app

**Public source:** https://github.com/Chrismaboyi/brightpath-helpdesk

The hosted app uses Gemini 3.8 Flash. The key is stored in Netlify's secret environment settings, never in the source or browser.

**Run locally:** `npm run dev`, then open http://localhost:8888. Without your own local key, it runs in labelled demo mode.

**Deploy updates:** `netlify deploy --prod` from this folder. This project uses CLI deployments; a GitHub push alone does not publish a new Netlify version.

**Test evidence:** Real-model smoke tests are in `docs/live-test-results.json`; mock results, browser checks and screenshots are also in `docs/`.
