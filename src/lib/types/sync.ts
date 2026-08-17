export type SyncActionType =
	| 'CHANGE_LIFE'
	| 'CHANGE_POISON'
	| 'CHANGE_COMMANDER_DAMAGE'
	| 'SET_MONARCH'
	| 'SET_INITIATIVE'
	| 'RESET_GAME'
	| 'GAME_STATE'
	| 'TIMER_STATE'
	| 'FULL_STATE_SYNC';

export interface SyncAction {
	id: string;
	timestamp: number;
	sourcePlayerId: string;
	targetPlayerId: string;
	type: SyncActionType;
	payload: Record<string, unknown>;
}

export type SyncConnectionStatus =
	| 'disconnected'
	| 'offering'
	| 'answering'
	| 'connecting'
	| 'connected'
	| 'error';

export type SyncRole = 'host' | 'guest';

export interface SyncState {
	status: SyncConnectionStatus;
	role: SyncRole | null;
	peerId: string | null;
	error: string | null;
}
