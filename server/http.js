import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

const publicRoot = resolve(
  fileURLToPath(new URL("../public/", import.meta.url)),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

export function createProfileServer(snapshot, allowedOrigin = "") {
  return createServer(
    { requestTimeout: 10000, headersTimeout: 5000 },
    async (request, response) => {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      response.setHeader("X-Frame-Options", "DENY");
      response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      if (request.headers.origin === allowedOrigin && allowedOrigin) {
        response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      }
      response.setHeader("Vary", "Origin");
      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        response.writeHead(405, { Allow: "GET, HEAD, OPTIONS" });
        response.end();
        return;
      }
      const send = (status, body, type, cache = "no-store") => {
        response.writeHead(status, {
          "Content-Type": type,
          "Cache-Control": cache,
        });
        response.end(request.method === "HEAD" ? undefined : body);
      };
      try {
        let pathname = decodeURIComponent(
          new URL(request.url, "http://localhost").pathname,
        );
        if (pathname === "/about-me") {
          response.writeHead(308, { Location: "/about-me/" });
          response.end();
          return;
        }
        if (pathname.startsWith("/about-me/"))
          pathname = pathname.slice("/about-me".length);
        if (pathname === "/api/discord") {
          send(200, JSON.stringify(snapshot()), types[".json"]);
          return;
        }
        if (pathname === "/api/health") {
          send(200, '{"ok":true}', types[".json"]);
          return;
        }
        if (pathname === "/") pathname = "/index.html";
        const file = resolve(publicRoot, `.${pathname}`);
        if (
          !file.startsWith(`${publicRoot}${sep}`) ||
          pathname.split("/").some((part) => part.startsWith("."))
        ) {
          send(404, "Not found", "text/plain");
          return;
        }
        const type = types[extname(file)];
        if (!type) {
          send(404, "Not found", "text/plain");
          return;
        }
        send(200, await readFile(file), type, "public, max-age=300");
      } catch (error) {
        const status =
          error instanceof URIError
            ? 400
            : ["ENOENT", "EISDIR", "ENOTDIR"].includes(error.code)
              ? 404
              : 500;
        if (status === 500)
          console.error("HTTP request failed:", error.message);
        send(
          status,
          status === 400
            ? "Bad request"
            : status === 404
              ? "Not found"
              : "Internal error",
          "text/plain",
        );
      }
    },
  );
}
