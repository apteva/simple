// Dev static server + /api proxy. Usage:
//   PORT=5281 UPSTREAM=http://localhost:5280 bun run scripts/serve.ts
// Serves ./dist at PORT and proxies every /api/* request to UPSTREAM,
// streaming bodies verbatim so SSE works.
import { file } from "bun";
import { join, resolve } from "path";

const port = Number(process.env.PORT ?? 5281);
const upstream = process.env.UPSTREAM ?? "http://localhost:5280";
const root = resolve(import.meta.dir, "..", "dist");

console.log(`serving ${root}`);
console.log(`proxying /api → ${upstream}`);
console.log(`listening on http://localhost:${port}`);

Bun.serve({
  port,
  idleTimeout: 240,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/")) {
      const target = upstream + url.pathname + url.search;
      const headers = new Headers(req.headers);
      headers.set("host", new URL(upstream).host);
      const res = await fetch(target, {
        method: req.method,
        headers,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
        redirect: "manual",
      });
      // Pass through all headers verbatim (including Set-Cookie and
      // text/event-stream Content-Type for SSE).
      return new Response(res.body, {
        status: res.status,
        headers: res.headers,
      });
    }

    // Static: try exact file, fall back to index.html for SPA routes.
    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    const f = file(join(root, path));
    if (await f.exists()) return new Response(f);
    return new Response(file(join(root, "index.html")));
  },
});
