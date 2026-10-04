import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import http from "http";
import https from "https";

const localProxyPlugin = () => ({
  name: 'local-sports-proxy',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/streamed-proxy') && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            let upstreamPath = '';
            if (data.resource === 'sports') upstreamPath = '/api/sports';
            else if (data.resource === 'live-matches') upstreamPath = '/api/matches/live';
            else if (data.resource === 'streams') upstreamPath = `/api/stream/${encodeURIComponent(data.source)}/${encodeURIComponent(data.id)}`;
            
            const fetchRes = await fetch(`https://streamed.su${upstreamPath}`, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://streamed.su'
              }
            });
            const text = await fetchRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = fetchRes.status;
            res.end(text);
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: (e as Error).message }));
          }
        });
        return;
      }

      if (req.url?.startsWith('/api/streamed-image')) {
        const url = new URL(req.url, 'http://localhost');
        const kind = url.searchParams.get('kind');
        const id = url.searchParams.get('id');
        const imagePath = kind === 'poster' ? `/api/images/proxy/${id}.webp` : `/api/images/badge/${id}.webp`;
        try {
          const fetchRes = await fetch(`https://streamed.su${imagePath}`, {
            headers: {
              'Accept': 'image/webp',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://streamed.su'
            }
          });
          const buffer = await fetchRes.arrayBuffer();
          res.setHeader('Content-Type', 'image/webp');
          res.statusCode = fetchRes.status;
          res.end(Buffer.from(buffer));
        } catch (e) {
          res.statusCode = 500;
          res.end();
        }
        return;
      }

      if (req.url?.startsWith('/e/')) {
        // Simple rewrite for local dev
        res.writeHead(302, { Location: `https://embed.st/embed/${req.url.slice(3)}` });
        res.end();
        return;
      }

      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  plugins: [react(), mode === "development" && componentTagger(), localProxyPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalizedId)) {
            return "vendor-react";
          }
          if (/\/node_modules\/(react-router|react-router-dom|@remix-run\/router)\//.test(normalizedId)) {
            return "vendor-router";
          }
          if (normalizedId.includes("/node_modules/@tanstack/react-query/")) {
            return "vendor-query";
          }
          if (normalizedId.includes("/node_modules/@radix-ui/")) {
            return "vendor-ui";
          }
          if (normalizedId.includes("/node_modules/@supabase/")) {
            return "vendor-supabase";
          }
        },
      },
    },
  },
}));
