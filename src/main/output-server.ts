import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

export class OutputServer {
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private port: number = 4989;
  private clients: Set<WebSocket> = new Set();

  start(distRendererPath: string, port = 4989): Promise<number> {
    this.port = port;
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // Serve static renderer files for OBS / vMix Browser Source
        let reqUrl = req.url || '/';
        const [pathname] = reqUrl.split('?');

        let filePath = path.join(distRendererPath, pathname === '/' ? 'index.html' : pathname);

        if (!fs.existsSync(filePath)) {
          // Fallback to index.html for SPA
          filePath = path.join(distRendererPath, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.webm': 'video/webm',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(content);
        });
      });

      // WebSocket Server for syncing live broadcast playout
      this.wss = new WebSocketServer({ server: this.server });
      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        ws.on('close', () => this.clients.delete(ws));
      });

      this.server.listen(this.port, () => {
        console.log(`[Broadcast Server] Running on http://localhost:${this.port}`);
        resolve(this.port);
      });
    });
  }

  broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  stop() {
    this.wss?.close();
    this.server?.close();
  }
}
