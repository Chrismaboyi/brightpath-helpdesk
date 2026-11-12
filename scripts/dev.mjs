import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { Readable } from "node:stream";
import { handleAsk } from "../netlify/functions/ask.mjs";

const root = resolve("public");
const sharedRoot = resolve("shared");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".mjs": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
const server = createServer(async (req, res) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  );
  try {
    const url = new URL(req.url, "http://localhost");
    if (
      url.pathname === "/api/ask" ||
      url.pathname === "/.netlify/functions/ask"
    ) {
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        ...(req.method !== "GET" && req.method !== "HEAD"
          ? { body: Readable.toWeb(req), duplex: "half" }
          : {}),
      });
      const response = await handleAsk(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const isShared = url.pathname.startsWith("/shared/");
    const base = isShared ? sharedRoot : root;
    const pathname = decodeURIComponent(
      isShared
        ? url.pathname.slice("/shared/".length)
        : url.pathname === "/"
          ? "/index.html"
          : url.pathname,
    );
    const path = resolve(base, "." + sep + pathname);
    if (!path.startsWith(base + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const bytes = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(Number(process.env.PORT || 8888), "127.0.0.1", () =>
  console.log(`BrightPath Learn: http://localhost:${server.address().port}`),
);
