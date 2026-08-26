import { derived } from 'svelte/store';
import { players } from './player';
import { appSettings } from './appSettings';
import { appState, type StreamGameState } from './appState';

const MAX_STREAM_PLAYERS = 8;

export const gameState = derived(
	[players, appSettings, appState],
	([$players, $appSettings, $appState]) => {
		// Stream payload is always normalized to 8 slots. Keeping a fixed width simplifies
		// consumer code and avoids schema churn when player count changes during a session.
		const playerCount = $appSettings.playerCount ?? 4;
		const activePlayers = $players.slice(0, playerCount);

		const names = Array.from({ length: MAX_STREAM_PLAYERS }, (_, index) => {
			const player = activePlayers[index];
			return player?.playerName ?? `Player ${index + 1}`;
		});

		const lifeTotals = Array.from({ length: MAX_STREAM_PLAYERS }, (_, index) => {
			const player = activePlayers[index];
			return player?.lifeTotal ?? 0;
		});

		return {
			playerCount,
			currentTurn: $appState.currentTurn,
			updatedAt: Date.now(),
			names,
			lifeTotals,
			namePlayer1: names[0] ?? '',
			namePlayer2: names[1] ?? '',
			namePlayer3: names[2] ?? '',
			namePlayer4: names[3] ?? '',
			namePlayer5: names[4] ?? '',
			namePlayer6: names[5] ?? '',
			namePlayer7: names[6] ?? '',
			namePlayer8: names[7] ?? '',
			lifePlayer1: lifeTotals[0] ?? 0,
			lifePlayer2: lifeTotals[1] ?? 0,
			lifePlayer3: lifeTotals[2] ?? 0,
			lifePlayer4: lifeTotals[3] ?? 0,
			lifePlayer5: lifeTotals[4] ?? 0,
			lifePlayer6: lifeTotals[5] ?? 0,
			lifePlayer7: lifeTotals[6] ?? 0,
			lifePlayer8: lifeTotals[7] ?? 0
		} satisfies StreamGameState;
	}
);
