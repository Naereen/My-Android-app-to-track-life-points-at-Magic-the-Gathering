import { get } from 'svelte/store';
import { appSettings } from './appSettings';
import { persist } from './persist';

export interface PlayerState {
	id: number;
	name: string;
	color: string;
	life: number;
}

export interface GameSnapshot {
	timestamp: number;
	players: PlayerState[];
}

const LIFE_HISTORY_STORAGE_KEY = 'lifeHistory';
const LIFE_HISTORY_MAX_SNAPSHOTS = 400;
const LIFE_HISTORY_DEBOUNCE_MS = 1800;

const fallbackChartPalette = [
	'#38bdf8',
	'#f472b6',
	'#f59e0b',
	'#34d399',
	'#a78bfa',
	'#f87171',
	'#facc15',
	'#22d3ee'
] as const;

const namedPlayerColors: Record<string, string> = {
	mud: '#704214',
	metalicgray: '#6e7f80',
	gold: '#ffb700',
	purple: '#6600ff',
	pink: '#ff69b4',
	orange: '#ff8c00',
	lightgreen: '#90ee90',
	blue: '#0000bb',
	black: '#202020',
	red: '#bb0000',
	green: '#00bb00',
	white: '#ffffff'
};

export const LIFE_HISTORY_CHART_COLORS = [...fallbackChartPalette];

export const lifeHistory = persist<GameSnapshot[]>(LIFE_HISTORY_STORAGE_KEY, []);

let recordTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: GameSnapshot | null = null;

const isHexColor = (value: string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

const normalizePlayerColor = (value: string | undefined) => {
	if (!value || value.includes(',')) return null;
	const normalized = value.trim().toLowerCase();
	if (isHexColor(normalized)) return normalized;
	return namedPlayerColors[normalized] ?? null;
};

const shouldUsePlayerColor = (value: string | null, usedColors: Set<string>) => {
	if (!value) return false;
	if (value === '#ffffff' || value === '#202020') return false;
	return !usedColors.has(value);
};

const cloneSnapshot = (snapshot: GameSnapshot): GameSnapshot => ({
	timestamp: snapshot.timestamp,
	players: snapshot.players.map((player) => ({ ...player }))
});

const areSnapshotsEquivalent = (left: GameSnapshot | undefined, right: GameSnapshot | null) => {
	if (!left || !right) return false;
	if (left.players.length !== right.players.length) return false;

	return left.players.every((player, index) => {
		const other = right.players[index];
		return (
			player.id === other.id &&
			player.name === other.name &&
			player.color === other.color &&
			player.life === other.life
		);
	});
};

const commitSnapshot = (snapshot: GameSnapshot) => {
	lifeHistory.update((current) => {
		const previous = current[current.length - 1];
		if (areSnapshotsEquivalent(previous, snapshot)) {
			return current;
		}

		const next = [...current, cloneSnapshot(snapshot)];
		if (next.length > LIFE_HISTORY_MAX_SNAPSHOTS) {
			return next.slice(next.length - LIFE_HISTORY_MAX_SNAPSHOTS);
		}
		return next;
	});

	pendingSnapshot = null;
	if (recordTimer) {
		clearTimeout(recordTimer);
		recordTimer = null;
	}
};

const toPlayerStates = (players: App.Player.Data[], activePlayerCount: number): PlayerState[] => {
	const activePlayers = players.slice(0, activePlayerCount);
	const usedColors = new Set<string>();

	return activePlayers.map((player, index) => {
		const preferredColor = normalizePlayerColor(player.color);
		const fallbackColor = LIFE_HISTORY_CHART_COLORS[index % LIFE_HISTORY_CHART_COLORS.length];
		const color = shouldUsePlayerColor(preferredColor, usedColors) ? preferredColor : fallbackColor;
		usedColors.add(color);

		return {
			id: player.id,
			name: player.playerName,
			color,
			life: player.lifeTotal
		};
	});
};

const buildSnapshot = (players: App.Player.Data[], activePlayerCount: number): GameSnapshot => ({
	timestamp: Date.now(),
	players: toPlayerStates(players, activePlayerCount)
});

export const recordSnapshot = (
	players: App.Player.Data[],
	activePlayerCount: number = get(appSettings).playerCount
) => {
	pendingSnapshot = buildSnapshot(players, activePlayerCount);
	if (recordTimer) {
		clearTimeout(recordTimer);
	}
	recordTimer = setTimeout(() => {
		if (pendingSnapshot) {
			commitSnapshot(pendingSnapshot);
		}
	}, LIFE_HISTORY_DEBOUNCE_MS);
};

export const recordImmediateSnapshot = (
	players: App.Player.Data[],
	activePlayerCount: number = get(appSettings).playerCount
) => {
	commitSnapshot(buildSnapshot(players, activePlayerCount));
};

export const flushPendingSnapshot = () => {
	if (pendingSnapshot) {
		commitSnapshot(pendingSnapshot);
	}
};

export const clearLifeHistory = () => {
	if (recordTimer) {
		clearTimeout(recordTimer);
		recordTimer = null;
	}
	pendingSnapshot = null;
	lifeHistory.set([]);
};
