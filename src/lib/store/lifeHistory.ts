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

/**
 * Resolves a player color token to a chart-safe CSS color string.
 * Mirrors the logic used by the life-history snapshot builder so all views
 * (life chart, emblem/dungeon pawns, turn-time stats) render consistent colors.
 */
export const resolveChartColor = (
	colorToken: string | undefined | null,
	playerIndex: number
): string => {
	const palette = LIFE_HISTORY_CHART_COLORS[playerIndex % LIFE_HISTORY_CHART_COLORS.length];
	if (!colorToken || colorToken.includes(',')) return palette;
	const clean = colorToken.trim().toLowerCase();
	if (clean === '#ffffff' || clean === '#202020' || clean === 'white' || clean === 'black') return palette;
	if (isHexColor(clean)) return clean;
	const named = namedPlayerColors[clean];
	return named ?? palette;
};

export const lifeHistory = persist<GameSnapshot[]>(LIFE_HISTORY_STORAGE_KEY, []);

let recordTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: GameSnapshot | null = null;

/**
 * Validates a CSS hex color token (`#rgb` or `#rrggbb`).
 * @param {string} value Candidate color string.
 * @returns {boolean} `true` when the token is a valid hex color.
 */
const isHexColor = (value: string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());

/**
 * Resolves player color strings to canonical chart colors.
 * Rejects gradients and returns `null` when no safe single color is available.
 * @param {string | undefined} value Raw player color setting.
 * @returns {string | null} Normalized color or `null`.
 */
const normalizePlayerColor = (value: string | undefined) => {
	if (!value || value.includes(',')) return null;
	const normalized = value.trim().toLowerCase();
	if (isHexColor(normalized)) return normalized;
	return namedPlayerColors[normalized] ?? null;
};

/**
 * Decides whether a normalized player color is acceptable for chart rendering.
 * Prevents duplicate colors and avoids low-contrast defaults (white/black).
 * @param {string | null} value Candidate normalized color.
 * @param {Set<string>} usedColors Palette entries already assigned to previous players.
 * @returns {boolean} `true` when color should be used instead of fallback palette.
 */
const shouldUsePlayerColor = (value: string | null, usedColors: Set<string>) => {
	if (!value) return false;
	if (value === '#ffffff' || value === '#202020') return false;
	return !usedColors.has(value);
};

const cloneSnapshot = (snapshot: GameSnapshot): GameSnapshot => ({
	timestamp: snapshot.timestamp,
	players: snapshot.players.map((player) => ({ ...player }))
});

/**
 * Compares two snapshots to avoid storing redundant chart points.
 * @param {GameSnapshot | undefined} left Previous persisted snapshot.
 * @param {GameSnapshot | null} right Incoming snapshot candidate.
 * @returns {boolean} `true` when player identity/colors/life values are identical.
 */
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

/**
 * Persists one snapshot, enforces retention cap, and clears pending debounce state.
 * @param {GameSnapshot} snapshot Snapshot to append if distinct from latest entry.
 * @returns {void}
 */
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

/**
 * Immediately commits the currently debounced snapshot, if any.
 * @returns {void}
 */
export const flushPendingSnapshot = () => {
	if (pendingSnapshot) {
		commitSnapshot(pendingSnapshot);
	}
};

/**
 * Cancels pending snapshot recording and clears all persisted life history.
 * @returns {void}
 */
export const clearLifeHistory = () => {
	if (recordTimer) {
		clearTimeout(recordTimer);
		recordTimer = null;
	}
	pendingSnapshot = null;
	lifeHistory.set([]);
};
