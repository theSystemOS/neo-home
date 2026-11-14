import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store, StoreError } from "./store.mjs";
import { seedDemo } from "./demo.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..", "app");

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : true;
}

const demo = Boolean(arg("demo", false));
const port = Number(arg("port", demo ? 4320 : 4311));
const host = String(arg("host", "127.0.0.1"));
const dataFile = String(
  arg("data", path.resolve(here, "..", "data", demo ? "demo/records.jsonl" : "records.jsonl")),
);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
};

function sendJson(res, status, value) {
  res.writeHead(status, {
    ...securityHeaders,
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new StoreError("request body is too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

let store;
try {
  store = new Store({ file: dataFile, demo });
  if (demo && store.isEmpty) seedDemo(store);
} catch (error) {
  console.error(`neo-home: refusing to start — ${error.message}`);
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/api/state" && req.method === "GET") {
    return sendJson(res, 200, store.snapshot());
  }

  if (pathname === "/api/events" && req.method === "GET") {
    const limit = Math.min(Number(url.searchParams.get("limit") || 100), 1000);
    return sendJson(res, 200, { events: store.events.slice(-limit) });
  }

  if (pathname === "/api/events" && req.method === "POST") {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw);
      const actor = typeof payload.actor === "string" ? payload.actor : "";
      const event = payload.event;
      const stored = store.append(actor, event);
      return sendJson(res, 200, { event: stored, state: store.snapshot() });
    } catch (error) {
      if (error instanceof StoreError) return sendJson(res, 409, { error: error.message });
      if (error instanceof SyntaxError) return sendJson(res, 400, { error: "body must be JSON" });
      console.error(error);
      return sendJson(res, 500, { error: "the store refused the write" });
    }
  }

  if (pathname === "/api/health" && req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      demo: store.demo,
      events: store.events.length,
      head: store.events.at(-1)?.hash ?? null,
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "method not allowed" });
  }

  if (pathname === "/favicon.ico") {
    res.writeHead(204, securityHeaders);
    return res.end();
  }

  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const file = path.resolve(appRoot, `.${requestPath}`);
  if (!file.startsWith(`${appRoot}${path.sep}`) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { ...securityHeaders, "content-type": "text/plain" });
    return res.end("not found");
  }
  const type = contentTypes[path.extname(file)] || "application/octet-stream";
  const cache = type.startsWith("text/html") ? "no-store" : "no-cache";
  res.writeHead(200, {
    ...securityHeaders,
    "content-type": type,
    "cache-control": cache,
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  const label = demo ? "illustrative data" : "local record store";
  console.log(`neo-home  http://${host}:${port}  (${label})`);
  console.log(`store     ${dataFile}`);
});
