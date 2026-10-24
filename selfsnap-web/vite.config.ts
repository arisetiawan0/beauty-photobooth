import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import type { IncomingMessage } from "node:http";
import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

// Values from .env files, later files win. Unlike Vite's loadEnv, file values override
// whatever is already in process.env, so edits to .env.local always take effect.
function readEnvFiles(dir: string, mode: string): Record<string, string> {
  return Object.assign(
    {},
    ...[".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`]
      .map((name) => join(dir, name))
      .filter((path) => existsSync(path))
      .map((path) => parseEnv(readFileSync(path, "utf8")))
  );
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Serves Vercel-style functions (api/<name>.ts exporting GET/POST) during `npm run dev`,
// so the email feature works locally without `vercel dev`.
function vercelApiDev(): Plugin {
  return {
    name: "vercel-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0] ?? "";
        const match = path.match(/^\/api\/([\w-]+)$/);
        if (!match) return next();

        try {
          // Re-read .env / .env.local on every call, so edited keys apply without a restart
          const { mode, root, envDir } = server.config;
          Object.assign(process.env, readEnvFiles(envDir || root, mode));

          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          const handler = mod[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            return res.end();
          }

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers.set(k, v);
          }
          const hasBody = req.method !== "GET" && req.method !== "HEAD";
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers,
            body: hasBody ? new Uint8Array(await readBody(req)) : undefined,
          });

          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  // The cloud name is public, so the browser may read it directly; every other var stays server-only
  envPrefix: ["VITE_", "CLOUDINARY_CLOUD_NAME"],
  plugins: [vue(), vercelApiDev()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
