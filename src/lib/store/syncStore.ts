import { writable, get } from 'svelte/store';
import type { SyncAction, SyncState } from '$lib/types/sync';
import { players, setPlayerLifeAbsolute, setPlayerPoison } from './player';
import { appSettings } from './appSettings';
import { appState } from './appState';
import { turnTimer } from './turnTimer';
import { globalGameTimer } from './globalGameTimer';
import { resetLifeTotals } from './player';

let manager: import('$lib/utils/webrtcManager').WebRTCManager | null = null;

/** Guards against re-broadcasting a change that we just received from the peer. */
let applyingRemote = false;
let unsubscribers: (() => void)[] = [];
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;
let lastBroadcastPayload = '';
let lastTimerSignature = '';
let lastTimerBroadcastAt = 0;

/** Coalesces bursts of local updates (e.g. holding the +1 button) into one message. */
const BROADCAST_DEBOUNCE_MS = 120;

/** Both peers tick locally, so timers only need a periodic drift correction. */
const TIMER_RESYNC_INTERVAL_MS = 15000;

/** Turn/game progression fields; menu and UI flags stay device-local. */
const SYNCED_APP_STATE_KEYS = [
	'currentTurn',
	'turnCount',
	'startingPlayerIndex',
	'dayNightCycleEnabled',
	'dayNightPhase'
] as const;

/**
 * Settings that describe the shared game and must be identical on every device.
 * Device-local preferences (haptics, sounds, locale, stream mode…) are deliberately excluded.
 */
const SYNCED_SETTINGS_KEYS = [
	'playerCount',
	'startingLifeTotal',
	'customStartingLifeTotal',
	'allowNegativeLife',
	'threePlayerLayout',
	'fourPlayerLayout',
	'sixPlayerLayout',
	'eightPlayerLayout',
	'vanguardModeEnabled',
	'treacheryModeEnabled',
	'shogunVariantEnabled',
	'bountyModeEnabled',
	'enableAcornMode',
	'enableTicketMode',
	'turnTimerEnabled',
	'turnTimerDuration',
	'globalGameTimerEnabled',
	'globalGameTimerDuration'
] as const;

const initialSyncState: SyncState = {
	status: 'disconnected',
	role: null,
	peerId: null,
	error: null
};

export const syncState = writable<SyncState>(initialSyncState);

/** Unique peer ID for this session (generated once per page load). */
export const localPeerId = crypto.randomUUID();

function makeAction(type: SyncAction['type'], payload: Record<string, unknown>): SyncAction {
	return {
		id: crypto.randomUUID(),
		timestamp: Date.now(),
		sourcePlayerId: localPeerId,
		targetPlayerId: 'all',
		type,
		payload
	};
}

function pickSyncedSettings(settings: Record<string, unknown>): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const key of SYNCED_SETTINGS_KEYS) {
		if (key in settings) picked[key] = settings[key];
	}
	return picked;
}

function pickSyncedAppState(state: Record<string, unknown>): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const key of SYNCED_APP_STATE_KEYS) {
		if (key in state) picked[key] = state[key];
	}
	return picked;
}

/** The whole shared game state: every player field plus the game-defining settings. */
function buildGameStatePayload(): Record<string, unknown> {
	return {
		players: get(players),
		settings: pickSyncedSettings(get(appSettings) as unknown as Record<string, unknown>),
		appState: pickSyncedAppState(get(appState) as unknown as Record<string, unknown>)
	};
}

function buildTimerPayload() {
	const turn = get(turnTimer);
	const global = get(globalGameTimer);
	return {
		turn: {
			remaining: turn.remaining,
			total: turn.total,
			running: turn.running,
			playerIndex: turn.playerIndex
		},
		global: { remaining: global.remaining, total: global.total, running: global.running }
	};
}

/** Identifies discrete timer events; plain ticking does not change it. */
function timerSignature(payload: ReturnType<typeof buildTimerPayload>): string {
	return JSON.stringify([
		payload.turn.running,
		payload.turn.total,
		payload.turn.playerIndex,
		payload.global.running,
		payload.global.total
	]);
}

/**
 * Broadcasts the timers on discrete events (start/pause/reset/turn change) and, while
 * they merely tick down on both sides, only every {@link TIMER_RESYNC_INTERVAL_MS}.
 */
function broadcastTimers(force = false) {
	if (!manager?.isConnected) return;
	const payload = buildTimerPayload();
	const signature = timerSignature(payload);
	const now = Date.now();
	if (
		!force &&
		signature === lastTimerSignature &&
		now - lastTimerBroadcastAt < TIMER_RESYNC_INTERVAL_MS
	) {
		return;
	}
	lastTimerSignature = signature;
	lastTimerBroadcastAt = now;
	sendSyncAction(makeAction('TIMER_STATE', payload));
}

function onTimerChange() {
	if (applyingRemote) return;
	broadcastTimers();
}

function broadcastGameState() {
	if (!manager?.isConnected) return;
	const payload = buildGameStatePayload();
	const serialized = JSON.stringify(payload);
	if (serialized === lastBroadcastPayload) return;
	lastBroadcastPayload = serialized;
	sendSyncAction(makeAction('GAME_STATE', payload));
}

function scheduleBroadcast() {
	if (applyingRemote || !manager?.isConnected) return;
	if (broadcastTimer) clearTimeout(broadcastTimer);
	broadcastTimer = setTimeout(() => {
		broadcastTimer = null;
		broadcastGameState();
	}, BROADCAST_DEBOUNCE_MS);
}

/**
 * Watches the shared stores and broadcasts the full game state on every local change.
 * Diffing at the store level (rather than hooking each mutation site) covers all input paths.
 */
function startBroadcasting() {
	stopBroadcasting();
	lastBroadcastPayload = JSON.stringify(buildGameStatePayload());
	unsubscribers = [
		players.subscribe(scheduleBroadcast),
		appSettings.subscribe(scheduleBroadcast),
		appState.subscribe(scheduleBroadcast),
		turnTimer.subscribe(onTimerChange),
		globalGameTimer.subscribe(onTimerChange)
	];
}

function stopBroadcasting() {
	if (broadcastTimer) clearTimeout(broadcastTimer);
	broadcastTimer = null;
	for (const unsubscribe of unsubscribers) unsubscribe();
	unsubscribers = [];
}

function applyGameState(payload: Record<string, unknown>) {
	const incomingPlayers = payload.players;
	if (Array.isArray(incomingPlayers) && incomingPlayers.every((p) => typeof p?.id === 'number')) {
		players.set(incomingPlayers as App.Player.Data[]);
	}

	const incomingSettings = payload.settings;
	if (incomingSettings && typeof incomingSettings === 'object') {
		const allowed = pickSyncedSettings(incomingSettings as Record<string, unknown>);
		appSettings.update((current) => ({ ...current, ...allowed }));
	}

	const incomingAppState = payload.appState;
	if (incomingAppState && typeof incomingAppState === 'object') {
		const allowed = pickSyncedAppState(incomingAppState as Record<string, unknown>);
		appState.update((current) => ({ ...current, ...allowed }));
	}
}

function applyTimerState(payload: Record<string, unknown>) {
	const turn = payload.turn as
		| { remaining: number; total: number; running: boolean; playerIndex: number | null }
		| undefined;
	if (turn && typeof turn.remaining === 'number') {
		turnTimer.applyRemoteState(turn);
	}

	const global = payload.global as
		| { remaining: number; total: number; running: boolean }
		| undefined;
	if (global && typeof global.remaining === 'number') {
		globalGameTimer.applyRemoteState(global);
	}
}

/**
 * Dispatches a received SyncAction to the appropriate store mutation.
 */
function applyRemoteAction(action: SyncAction) {
	applyingRemote = true;
	try {
		switch (action.type) {
			case 'GAME_STATE': {
				applyGameState(action.payload);
				break;
			}
			case 'TIMER_STATE': {
				applyTimerState(action.payload);
				break;
			}
			case 'CHANGE_LIFE': {
				const { playerId, lifeTotal } = action.payload as { playerId: number; lifeTotal: number };
				setPlayerLifeAbsolute(playerId, lifeTotal);
				break;
			}
			case 'CHANGE_POISON': {
				const { playerId, amount } = action.payload as { playerId: number; amount: number };
				setPlayerPoison(playerId, amount);
				break;
			}
			case 'RESET_GAME': {
				resetLifeTotals(true);
				break;
			}
			default:
				break;
		}
	} finally {
		applyingRemote = false;
		// Prevents echoing back the state we just adopted.
		lastBroadcastPayload = JSON.stringify(buildGameStatePayload());
		lastTimerSignature = timerSignature(buildTimerPayload());
		lastTimerBroadcastAt = Date.now();
	}
}

/**
 * Sends a SyncAction to the connected peer and returns true if sent.
 */
export function sendSyncAction(action: SyncAction): boolean {
	if (!manager || !manager.isConnected) return false;
	manager.sendAction(action);
	return true;
}

/**
 * Immediately pushes the full game state to the peer.
 */
export function sendFullStateSync() {
	lastBroadcastPayload = '';
	broadcastGameState();
	broadcastTimers(true);
}

/**
 * Host: Initializes WebRTC manager and generates offer SDP payload.
 * Returns compressed SDP string for QR display.
 */
export async function initHostSync(): Promise<string> {
	const { WebRTCManager } = await import('$lib/utils/webrtcManager');
	manager?.close();
	manager = new WebRTCManager(applyRemoteAction, handleStatusChange);
	syncState.update((s) => ({ ...s, status: 'offering', role: 'host', error: null }));
	const offer = await manager.createOffer();
	return offer;
}

/**
 * Guest: Scans host's QR code, creates answer SDP payload for display.
 */
export async function initGuestSync(offerPayload: string): Promise<string> {
	const { WebRTCManager } = await import('$lib/utils/webrtcManager');
	manager?.close();
	manager = new WebRTCManager(applyRemoteAction, handleStatusChange);
	syncState.update((s) => ({ ...s, status: 'answering', role: 'guest', error: null }));
	const answer = await manager.createAnswer(offerPayload);
	return answer;
}

/**
 * Host: Scans guest's answer QR code to complete the WebRTC handshake.
 */
export async function acceptGuestAnswer(answerPayload: string): Promise<void> {
	if (!manager) throw new Error('No WebRTC manager. Call initHostSync first.');
	await manager.acceptAnswer(answerPayload);
	syncState.update((s) => ({ ...s, status: 'connecting' }));
}

/**
 * Disconnects the current peer connection.
 */
export function disconnectSync() {
	stopBroadcasting();
	manager?.close();
	manager = null;
	syncState.set(initialSyncState);
}

function handleStatusChange(status: 'connected' | 'disconnected' | 'error', error?: string) {
	const role = get(syncState).role;
	console.info('[sync] status', status, error ?? '');
	syncState.update((s) => ({
		...s,
		status,
		error: error ?? null
	}));
	if (status === 'connected') {
		startBroadcasting();
		// Only the host pushes its state, otherwise both peers would overwrite each other.
		if (role === 'host') sendFullStateSync();
	} else {
		stopBroadcasting();
	}
}
