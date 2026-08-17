import { writable, get } from 'svelte/store';
import type { SyncAction, SyncState } from '$lib/types/sync';
import { players, setPlayerLifeAbsolute, setPlayerPoison } from './player';
import { appSettings } from './appSettings';
import { resetLifeTotals } from './player';

let manager: import('$lib/utils/webrtcManager').WebRTCManager | null = null;

/** Guards against re-broadcasting a change that we just received from the peer. */
let applyingRemote = false;
let unsubscribePlayers: (() => void) | null = null;
let lastSnapshot = new Map<number, { life: number; poison: number }>();

const initialSyncState: SyncState = {
	status: 'disconnected',
	role: null,
	peerId: null,
	error: null
};

export const syncState = writable<SyncState>(initialSyncState);

/** Unique peer ID for this session (generated once per page load). */
export const localPeerId = crypto.randomUUID();

function snapshotPlayers(list: App.Player.Data[]) {
	const map = new Map<number, { life: number; poison: number }>();
	for (const player of list) {
		map.set(player.id, { life: player.lifeTotal, poison: Number(player.poison ?? 0) });
	}
	return map;
}

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

/**
 * Watches the players store and broadcasts every local life/poison change to the peer.
 * Diffing the store (rather than hooking each mutation site) covers all input paths.
 */
function startBroadcasting() {
	stopBroadcasting();
	lastSnapshot = snapshotPlayers(get(players));
	unsubscribePlayers = players.subscribe((list) => {
		const next = snapshotPlayers(list);
		if (!applyingRemote && manager?.isConnected) {
			for (const [id, value] of next) {
				const previous = lastSnapshot.get(id);
				if (!previous) continue;
				if (previous.life !== value.life) {
					sendSyncAction(makeAction('CHANGE_LIFE', { playerId: id, lifeTotal: value.life }));
				}
				if (previous.poison !== value.poison) {
					sendSyncAction(makeAction('CHANGE_POISON', { playerId: id, amount: value.poison }));
				}
			}
		}
		lastSnapshot = next;
	});
}

function stopBroadcasting() {
	unsubscribePlayers?.();
	unsubscribePlayers = null;
}

/**
 * Dispatches a received SyncAction to the appropriate store mutation.
 * Used for both incoming remote actions and local echo when sending.
 */
function applyRemoteAction(action: SyncAction) {
	applyingRemote = true;
	try {
		switch (action.type) {
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
			case 'FULL_STATE_SYNC': {
				const { lifeTotals, poisonTotals } = action.payload as {
					lifeTotals: { playerId: number; lifeTotal: number }[];
					poisonTotals: { playerId: number; amount: number }[];
				};
				for (const lt of lifeTotals) {
					setPlayerLifeAbsolute(lt.playerId, lt.lifeTotal);
				}
				for (const pt of poisonTotals) {
					setPlayerPoison(pt.playerId, pt.amount);
				}
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
		lastSnapshot = snapshotPlayers(get(players));
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
 * Builds and sends a FULL_STATE_SYNC action based on current store values.
 */
export function sendFullStateSync() {
	const currentPlayers = get(players);
	const playerCount = get(appSettings).playerCount;
	const activePlayers = currentPlayers.slice(0, playerCount);

	const lifeTotals = activePlayers.map((p) => ({ playerId: p.id, lifeTotal: p.lifeTotal }));
	const poisonTotals = activePlayers.map((p) => ({
		playerId: p.id,
		amount: Number(p.poison ?? 0)
	}));

	sendSyncAction(makeAction('FULL_STATE_SYNC', { lifeTotals, poisonTotals }));
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
