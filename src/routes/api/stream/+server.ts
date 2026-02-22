import { json, type RequestHandler } from '@sveltejs/kit';

export const prerender = false;

type StreamPayload = Record<string, unknown>;

const encoder = new TextEncoder();

type StreamClient = {
	id: string;
	controller: ReadableStreamDefaultController<Uint8Array>;
	pingInterval: ReturnType<typeof setInterval>;
};

const clients = new Map<string, StreamClient>();
let latestState: StreamPayload = {
	playerCount: 0,
	names: [],
	lifeTotals: [],
	updatedAt: Date.now()
};

const serializeData = (data: StreamPayload) => `data: ${JSON.stringify(data)}\n\n`;

const pushDataToClient = (client: StreamClient, data: StreamPayload) => {
	try {
		client.controller.enqueue(encoder.encode(serializeData(data)));
		return true;
	} catch {
		return false;
	}
};

const broadcast = (data: StreamPayload) => {
	for (const [clientId, client] of clients.entries()) {
		const ok = pushDataToClient(client, data);
		if (!ok) {
			clearInterval(client.pingInterval);
			clients.delete(clientId);
		}
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			return json({ error: 'Invalid stream payload' }, { status: 400 });
		}

		latestState = {
			...(body as StreamPayload),
			serverReceivedAt: Date.now()
		};

		broadcast(latestState);

		return json({ ok: true, connectedClients: clients.size });
	} catch (error) {
		return json({ error: 'Unable to process stream update' }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	let currentClientId: string | null = null;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const id = crypto.randomUUID();
			currentClientId = id;

			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(pingInterval);
					clients.delete(id);
				}
			}, 15000);

			const client: StreamClient = {
				id,
				controller,
				pingInterval
			};

			clients.set(id, client);

			controller.enqueue(encoder.encode('retry: 3000\n\n'));
			pushDataToClient(client, latestState);
		},
		cancel() {
			if (!currentClientId) return;
			const client = clients.get(currentClientId);
			if (client) {
				clearInterval(client.pingInterval);
				clients.delete(currentClientId);
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
