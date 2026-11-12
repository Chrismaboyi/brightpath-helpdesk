import { mkdir, cp, access } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await cp("shared", "dist/shared", { recursive: true });
for (const file of [
  "dist/index.html",
  "dist/app.mjs",
  "dist/styles.css",
  "dist/assets/brightpath-logo.png",
])
  await access(file);
console.log("Built dist/ — static demo plus Netlify Functions integration.");
