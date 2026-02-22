<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { StreamGameState } from '$lib/store/appState';

	const initialState: StreamGameState = {
		playerCount: 2,
		currentTurn: 0,
		updatedAt: Date.now(),
		names: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6'],
		lifeTotals: [20, 20, 0, 0, 0, 0]
	};

	let state: StreamGameState = initialState;
	let status: 'connecting' | 'connected' | 'error' = 'connecting';
	let source: EventSource | null = null;
	let endpoint = '';

	const getConfiguredServerBaseUrl = () => {
		if (typeof window === 'undefined') return '';

		const params = new URLSearchParams(window.location.search);
		const serverFromQuery = params.get('server')?.trim();
		if (serverFromQuery) return serverFromQuery.replace(/\/$/, '');

		try {
			const rawSettings = localStorage.getItem('appSettings');
			if (!rawSettings) return '';
			const parsed = JSON.parse(rawSettings) as { remoteServerUrl?: string };
			const remoteServerUrl = parsed?.remoteServerUrl?.trim();
			return remoteServerUrl ? remoteServerUrl.replace(/\/$/, '') : '';
		} catch {
			return '';
		}
	};

	const visiblePlayers = () => {
		const count = Math.max(2, Math.min(6, state.playerCount || 2));
		return Array.from({ length: count }, (_, index) => ({
			name: state.names[index] ?? `Player ${index + 1}`,
			life: state.lifeTotals[index] ?? 0,
			isCurrent: state.currentTurn === index
		}));
	};

	onMount(() => {
		const baseUrl = getConfiguredServerBaseUrl();
		if (!baseUrl) {
			status = 'error';
			return;
		}

		endpoint = `${baseUrl}/api/stream`;
		source = new EventSource(endpoint);

		source.onopen = () => {
			status = 'connected';
		};

		source.onmessage = (event) => {
			try {
				const parsed = JSON.parse(event.data) as StreamGameState;
				state = parsed;
				status = 'connected';
			} catch {
				status = 'error';
			}
		};

		source.onerror = () => {
			status = 'error';
		};
	});

	onDestroy(() => {
		source?.close();
	});
</script>

<div class="w-screen h-screen bg-transparent text-white p-8 flex flex-col justify-center">
	<div class="mb-6 flex items-center justify-between text-3xl font-black uppercase tracking-widest">
		<div class="opacity-90">MTG Life Overlay</div>
		<div class="tabular-nums" class:text-green-300={status === 'connected'} class:text-red-300={status === 'error'}>
			{status}
		</div>
	</div>
	{#if endpoint}
		<div class="mb-4 text-lg opacity-80 truncate">{endpoint}</div>
	{/if}

	<div class="grid gap-8" style={`grid-template-columns: repeat(${Math.min(3, visiblePlayers().length)}, minmax(0, 1fr));`}>
		{#each visiblePlayers() as player}
			<div
				class="rounded-2xl border border-white/60 bg-black/60 px-8 py-6 text-center"
				class:shadow-[0_0_40px_rgba(250,204,21,0.8)]={player.isCurrent}
			>
				<div class="text-4xl font-bold uppercase truncate">{player.name}</div>
				<div class="mt-2 font-black tabular-nums leading-none text-[15rem]">{player.life}</div>
			</div>
		{/each}
	</div>
</div>
