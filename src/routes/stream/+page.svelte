<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { StreamGameState } from '$lib/store/appState';

	const MAX_STREAM_PLAYERS = 8;

	const initialState: StreamGameState = {
		playerCount: 2,
		currentTurn: 0,
		updatedAt: Date.now(),
		names: [
			'Player 1',
			'Player 2',
			'Player 3',
			'Player 4',
			'Player 5',
			'Player 6',
			'Player 7',
			'Player 8'
		],
		lifeTotals: [20, 20, 0, 0, 0, 0, 0, 0],
        // Flat properties for backward compatibility with older payload formats. TODO: remove in a future version.
		namePlayer1: 'Player 1',
		namePlayer2: 'Player 2',
		namePlayer3: 'Player 3',
		namePlayer4: 'Player 4',
		namePlayer5: 'Player 5',
		namePlayer6: 'Player 6',
		namePlayer7: 'Player 7',
		namePlayer8: 'Player 8',
		lifePlayer1: 20,
		lifePlayer2: 20,
		lifePlayer3: 0,
		lifePlayer4: 0,
		lifePlayer5: 0,
		lifePlayer6: 0,
		lifePlayer7: 0,
		lifePlayer8: 0
	};

	let state: StreamGameState = initialState;
	let status: 'connecting' | 'connected' | 'error' = 'connecting';
	let source: EventSource | null = null;
	let endpoint = '';
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let errorDetail = '';
	let isDarkTheme = false;
	let previousBodyBackground = '';
	let previousBodyColor = '';
	let previousHtmlBackground = '';
	let previousHtmlColor = '';
	let previousLayoutBackground = '';
	let previousLayoutForeground = '';

	const applyDocumentTheme = () => {
		if (typeof document === 'undefined') return;
		const background = isDarkTheme ? 'rgb(0 0 0)' : 'rgb(241 245 249)';
		const color = isDarkTheme ? 'rgb(255 255 255)' : 'rgb(15 23 42)';
		document.body.style.backgroundColor = background;
		document.body.style.color = color;
		document.documentElement.style.backgroundColor = background;
		document.documentElement.style.color = color;
		document.documentElement.style.setProperty('--stream-layout-bg', background);
		document.documentElement.style.setProperty('--stream-layout-fg', color);
	};

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
		const playerCount = Math.max(2, Math.min(8, Number(candidate.playerCount ?? state.playerCount ?? 2)));

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
			namePlayer7: names[6],
			namePlayer8: names[7],
			lifePlayer1: lifeTotals[0],
			lifePlayer2: lifeTotals[1],
			lifePlayer3: lifeTotals[2],
			lifePlayer4: lifeTotals[3],
			lifePlayer5: lifeTotals[4],
			lifePlayer6: lifeTotals[5],
			lifePlayer7: lifeTotals[6],
			lifePlayer8: lifeTotals[7]
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
		const count = Math.max(2, Math.min(8, state.playerCount || 2));
		return Array.from({ length: count }, (_, index) => ({
			name: state.names[index] ?? `Player ${index + 1}`,
			life: state.lifeTotals[index] ?? 0,
			isCurrent: state.currentTurn === index
		}));
	};

	onMount(() => {
		if (typeof document !== 'undefined') {
			previousBodyBackground = document.body.style.backgroundColor;
			previousBodyColor = document.body.style.color;
			previousHtmlBackground = document.documentElement.style.backgroundColor;
			previousHtmlColor = document.documentElement.style.color;
			previousLayoutBackground = document.documentElement.style.getPropertyValue('--stream-layout-bg');
			previousLayoutForeground = document.documentElement.style.getPropertyValue('--stream-layout-fg');
		}
		applyDocumentTheme();
		connectToStream();
	});

	$: applyDocumentTheme();

	onDestroy(() => {
		clearReconnectTimer();
		source?.close();
		if (typeof document !== 'undefined') {
			document.body.style.backgroundColor = previousBodyBackground;
			document.body.style.color = previousBodyColor;
			document.documentElement.style.backgroundColor = previousHtmlBackground;
			document.documentElement.style.color = previousHtmlColor;
			document.documentElement.style.setProperty('--stream-layout-bg', previousLayoutBackground);
			document.documentElement.style.setProperty('--stream-layout-fg', previousLayoutForeground);
		}
	});
</script>

<div
	class="relative h-full w-full box-border p-4 flex flex-col justify-between gap-4 transition-colors duration-300 overflow-hidden px-8"
	style="width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);"
	class:bg-black={isDarkTheme}
	class:text-white={isDarkTheme}
	class:bg-slate-100={ !isDarkTheme }
	class:text-slate-900={ !isDarkTheme }
>
	<div class="flex items-center justify-between text-3xl font-black tracking-widest">
		<div>
            <h1 class="text-4xl">Naereen's MTG Life Tracker</h1>
            <h2 class="text-lg" class:opacity-80={isDarkTheme} class:opacity-70={!isDarkTheme}>Stream Overlay</h2>
        </div>
		<div class="tabular-nums"
            class:text-green-300={status === 'connected'}
            class:text-green-700={status === 'connected' && !isDarkTheme}
            class:text-red-300={status === 'error'}
            class:text-red-700={status === 'error' && !isDarkTheme}
        >
			{status}
		</div>
	</div>

	<div class="grid content-center gap-6" style={`grid-template-columns: repeat(${Math.min(3, visiblePlayers().length)}, minmax(0, 1fr)); container-type: size;`}>
		{#each visiblePlayers() as player}
			<div
				class={`rounded-2xl border px-8 py-8 text-center transition-colors duration-300 ${
					isDarkTheme ? 'border-white/60 bg-black/60' : 'border-slate-300 bg-white/80 shadow-md'
				} ${
					player.isCurrent
						? isDarkTheme
							? 'shadow-[0_0_50px_rgba(250,204,21,0.9)]'
							: 'bg-amber-50/95 ring-4 ring-amber-400 shadow-[0_0_45px_rgba(245,158,11,0.9)]'
						: ''
				}`}
			>
				<div class="text-4xl font-bold truncate">
                    {player.name}
                </div>
				<div class="mt-2 font-black tabular-nums leading-none"
					style="font-size: clamp(5rem, min(15cqw, 20cqh), 14rem); text-align: center; white-space: nowrap;"
                >
                    {player.life}
                </div>
			</div>
		{/each}
	</div>

    {#if errorDetail}
		<div class="mt-4 mb-2 text-base" class:text-red-300={isDarkTheme} class:text-red-700={!isDarkTheme}>{errorDetail}</div>
	{/if}

	<div class="mt-2 flex items-center justify-between gap-4 text-sm">
		<div class="min-w-0 truncate" class:opacity-80={isDarkTheme} class:opacity-70={!isDarkTheme}>
			{#if endpoint}
				Endpoint URL:
				<a
					href={endpoint}
					target="_blank"
					rel="noopener noreferrer"
					class="underline decoration-1"
					class:text-blue-300={isDarkTheme}
					class:text-blue-700={!isDarkTheme}
				>{endpoint}</a>
			{/if}
		</div>
		<button
			type="button"
			on:click={() => (isDarkTheme = !isDarkTheme)}
			class={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-xl transition-colors duration-200 ${
				isDarkTheme ? 'border-white/60 bg-black/60' : 'border-slate-400 bg-white/90'
			}`}
			title={isDarkTheme ? 'Passer au thème clair' : 'Passer au thème sombre'}
			aria-label={isDarkTheme ? 'Passer au thème clair' : 'Passer au thème sombre'}
		>
			{isDarkTheme ? '☀️' : '🌙'}
		</button>
	</div>
</div>
