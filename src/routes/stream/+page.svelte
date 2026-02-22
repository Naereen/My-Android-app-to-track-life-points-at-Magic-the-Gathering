<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { StreamGameState } from '$lib/store/appState';

	const MAX_STREAM_PLAYERS = 6;

	const initialState: StreamGameState = {
		playerCount: 2,
		currentTurn: 0,
		updatedAt: Date.now(),
		names: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'],
		lifeTotals: [20, 20, 0, 0, 0, 0],
        // Flat properties for backward compatibility with older payload formats. TODO: remove in a future version.
		namePlayer1: 'Player 1',
		namePlayer2: 'Player 2',
		namePlayer3: 'Player 3',
		namePlayer4: 'Player 4',
		namePlayer5: 'Player 5',
		namePlayer6: 'Player 6',
		lifePlayer1: 20,
		lifePlayer2: 20,
		lifePlayer3: 0,
		lifePlayer4: 0,
		lifePlayer5: 0,
		lifePlayer6: 0
	};

	let state: StreamGameState = initialState;
	let status: 'connecting' | 'connected' | 'error' = 'connecting';
	let source: EventSource | null = null;
	let endpoint = '';
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let errorDetail = '';

	const getConfiguredServerBaseUrl = () => {
		if (typeof window === 'undefined') return '';

		const params = new URLSearchParams(window.location.search);
		const serverFromQuery = params.get('server')?.trim();
		if (serverFromQuery) return serverFromQuery.replace(/\/$/, '');
		const endpointFromQuery = params.get('endpoint')?.trim();
		if (endpointFromQuery) {
			try {
				const endpointUrl = new URL(endpointFromQuery);
				return `${endpointUrl.origin}${endpointUrl.pathname.replace(/\/api\/stream\/?$/, '')}`.replace(/\/$/, '');
			} catch {
				// ignore
			}
		}

		try {
			const rawSettings = localStorage.getItem('appSettings');
			if (rawSettings) {
				const parsed = JSON.parse(rawSettings) as { remoteServerUrl?: string };
				const remoteServerUrl = parsed?.remoteServerUrl?.trim();
				if (remoteServerUrl) return remoteServerUrl.replace(/\/$/, '');
			}

			const legacyRawSettings = localStorage.getItem('streamSettings');
			if (legacyRawSettings) {
				const legacyParsed = JSON.parse(legacyRawSettings) as { remoteServerUrl?: string };
				const legacyRemoteUrl = legacyParsed?.remoteServerUrl?.trim();
				if (legacyRemoteUrl) return legacyRemoteUrl.replace(/\/$/, '');
			}

			return '';
		} catch {
			return '';
		}
	};

	const normalizePayload = (payload: unknown): StreamGameState | null => {
		if (!payload || typeof payload !== 'object') {
            // console.warn('Invalid payload format: not an object', payload);
            return null;
        }

		const candidate = payload as Partial<StreamGameState> & Record<string, unknown>;
		const playerCount = Math.max(2, Math.min(6, Number(candidate.playerCount ?? state.playerCount ?? 2)));

		const namesFromArray = Array.isArray(candidate.names) ? candidate.names.map((name) => String(name ?? '')) : [];
		const livesFromArray = Array.isArray(candidate.lifeTotals)
			? candidate.lifeTotals.map((life) => Number(life ?? 0))
			: [];

		const names = Array.from({ length: MAX_STREAM_PLAYERS }, (_, index) => {
			return (
				namesFromArray[index] ||
				String(candidate[`namePlayer${index + 1}`] ?? '') ||
				`Player ${index + 1}`
			);
		});

		const lifeTotals = Array.from({ length: MAX_STREAM_PLAYERS }, (_, index) => {
			const fromArray = livesFromArray[index];
			if (Number.isFinite(fromArray)) return fromArray;
			const fromFlat = Number(candidate[`lifePlayer${index + 1}`] ?? 0);
			return Number.isFinite(fromFlat) ? fromFlat : 0;
		});

        // console.warn('Normalized payload', { candidate, normalized: { playerCount, names, lifeTotals } });

		return {
			playerCount,
			currentTurn: Number(candidate.currentTurn ?? -1),
			updatedAt: Number(candidate.updatedAt ?? Date.now()),
			names,
			lifeTotals,
			namePlayer1: names[0],
			namePlayer2: names[1],
			namePlayer3: names[2],
			namePlayer4: names[3],
			namePlayer5: names[4],
			namePlayer6: names[5],
			lifePlayer1: lifeTotals[0],
			lifePlayer2: lifeTotals[1],
			lifePlayer3: lifeTotals[2],
			lifePlayer4: lifeTotals[3],
			lifePlayer5: lifeTotals[4],
			lifePlayer6: lifeTotals[5]
		};
	};

	const clearReconnectTimer = () => {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	};

	const isMixedContentBlocked = (baseUrl: string) => {
		if (typeof window === 'undefined') return false;
		try {
			const relayUrl = new URL(baseUrl);
			return window.location.protocol === 'https:' && relayUrl.protocol === 'http:';
		} catch {
			return false;
		}
	};

	const connectToStream = () => {
		clearReconnectTimer();
		source?.close();
		source = null;
		errorDetail = '';

		const baseUrl = getConfiguredServerBaseUrl();
		if (!baseUrl) {
			status = 'error';
			errorDetail = 'Aucune URL de relais configurée.';
			return;
		}

		if (isMixedContentBlocked(baseUrl)) {
			status = 'error';
			errorDetail = 'Connexion bloquée : page HTTPS vers relais HTTP (mixed content). Ouvre l\'overlay en HTTP local ou expose le relais en HTTPS.';
			return;
		}

		endpoint = `${baseUrl}/api/stream`;
		status = 'connecting';
		source = new EventSource(endpoint);

		source.onopen = () => {
			status = 'connected';
			errorDetail = '';
		};

		source.onmessage = (event) => {
			let normalized: StreamGameState | null = null;
			try {
				normalized = normalizePayload(JSON.parse(event.data));
			} catch {
				normalized = null;
			}
			if (!normalized) {
				status = 'error';
				errorDetail = 'Payload SSE invalide reçu depuis le relais.';
				return;
			}
			state = normalized;
			status = 'connected';
			errorDetail = '';
		};

		source.onerror = () => {
			status = 'error';
			errorDetail = 'Connexion SSE interrompue, reconnexion en cours…';
			source?.close();
			source = null;
			clearReconnectTimer();
			reconnectTimer = setTimeout(() => {
				connectToStream();
			}, 2000);
		};
	};

	$: visiblePlayers = () => {
		const count = Math.max(2, Math.min(6, state.playerCount || 2));
		return Array.from({ length: count }, (_, index) => ({
			name: state.names[index] ?? `Player ${index + 1}`,
			life: state.lifeTotals[index] ?? 0,
			isCurrent: state.currentTurn === index
		}));
	};

	onMount(() => {
		connectToStream();
	});

	onDestroy(() => {
		clearReconnectTimer();
		source?.close();
	});
</script>

<div class="w-screen h-screen bg-transparent text-white p-4 flex flex-col justify-center">
	<div class="mb-6 flex items-center justify-between text-3xl font-black tracking-widest">
		<div>
            <h1 class="text-4xl">Naereen's MTG Life Tracker</h1>
            <h2 class="text-lg opacity-80">Stream Overlay</h2>
        </div>
		<div class="tabular-nums"
            class:text-green-300={status === 'connected'}
            class:text-red-300={status === 'error'}
        >
			{status}
		</div>
	</div>

	<div class="grid gap-8 mb-12" style={`grid-template-columns: repeat(${Math.min(3, visiblePlayers().length)}, minmax(0, 1fr)); container-type: inline-size;`}>
		{#each visiblePlayers() as player}
			<div
				class="rounded-2xl border border-white/60 bg-black/60 px-8 py-6 text-center"
				class:shadow-[0_0_40px_rgba(250,204,21,0.8)]={player.isCurrent}
			>
				<div class="text-4xl font-bold truncate">
                    {player.name}
                </div>
				<div class="mt-2 font-black tabular-nums leading-none"
                    style="font-size: 15cqw; text-align: center; white-space: nowrap;"
                >
                    {player.life}
                </div>
			</div>
		{/each}
	</div>

    {#if errorDetail}
		<div class="mt-4 mb-2 text-base text-red-300">{errorDetail}</div>
	{/if}

    {#if endpoint}
    <div class="absolute bottom-2 mt-4 mb-2 text-sm opacity-80 truncate">
            Endpoint URL:
            <a href={endpoint} target="_blank" rel="noopener noreferrer" class="text-blue-300">{endpoint}</a>
        </div>
	{/if}
</div>
