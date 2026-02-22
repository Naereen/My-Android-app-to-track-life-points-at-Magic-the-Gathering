//
// A simple Node.js server that relays game state updates to connected clients using Server-Sent Events (SSE).
// Clients can connect to the /api/stream endpoint to receive real-time updates, and send POST requests to the same endpoint to update the game state.
// This server is designed to be used as a relay for streaming overlays, allowing a separate application (like a mobile app) to send game state updates that can be consumed by a web-based overlay for streaming platforms.
//

import http from 'node:http';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*';
const PING_INTERVAL_MS = 15000;
const MAX_BODY_SIZE = 1_000_000;

let latestState = {
    playerCount: 0,
    currentTurn: -1,
    names: [],
    lifeTotals: [],
    updatedAt: Date.now(),
    serverReceivedAt: Date.now()
};

const clients = new Map();

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', CORS_ALLOW_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const writeSseData = (res, data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const sendToAllClients = (data) => {
    for (const [clientId, client] of clients.entries()) {
        try {
            writeSseData(client.res, data);
        } catch {
            clearInterval(client.pingInterval);
            clients.delete(clientId);
        try {
            client.res.end();
        } catch {
            // noop
        }
        }
    }
};

const createServer = () => {
    return http.createServer((req, res) => {
        const { method, url } = req;

        if (!url) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing URL' }));
        return;
        }

        if (method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(204);
        res.end();
        return;
        }

        if (method === 'GET' && url === '/health') {
        setCorsHeaders(res);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
            JSON.stringify({
            ok: true,
            connectedClients: clients.size,
            updatedAt: latestState.updatedAt
            })
        );
        return;
        }

        if (method === 'GET' && url.startsWith('/api/stream')) {
        setCorsHeaders(res);
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        res.write('retry: 3000\n\n');
        writeSseData(res, latestState);

        const clientId = crypto.randomUUID();
        const pingInterval = setInterval(() => {
            try {
            res.write(': ping\n\n');
            } catch {
            clearInterval(pingInterval);
            clients.delete(clientId);
            }
        }, PING_INTERVAL_MS);

        clients.set(clientId, { res, pingInterval });

        req.on('close', () => {
            clearInterval(pingInterval);
            clients.delete(clientId);
        });

        return;
        }

        if (method === 'POST' && url === '/api/stream') {
        let rawBody = '';
        let tooLarge = false;

        req.on('data', (chunk) => {
            rawBody += chunk;
            if (rawBody.length > MAX_BODY_SIZE) {
            tooLarge = true;
            req.destroy();
            }
        });

        req.on('end', () => {
            setCorsHeaders(res);

            if (tooLarge) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Payload too large' }));
            return;
            }

            try {
            const parsed = JSON.parse(rawBody || '{}');
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid stream payload' }));
                return;
            }

            latestState = {
                ...parsed,
                serverReceivedAt: Date.now()
            };

            sendToAllClients(latestState);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, connectedClients: clients.size }));
            } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
        });

        req.on('error', () => {
            setCorsHeaders(res);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request stream error' }));
        });

        return;
        }

        setCorsHeaders(res);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    });
};

const server = createServer();
server.listen(PORT, HOST, () => {
    console.log(`[relay] listening on http://${HOST}:${PORT}`);
});
