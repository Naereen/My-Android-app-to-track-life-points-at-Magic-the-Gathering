import type { SyncAction } from '$lib/types/sync';

type MessageHandler = (action: SyncAction) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'error', error?: string) => void;

const ICE_SERVERS: RTCIceServer[] = [
	// Use only local candidates — no STUN/TURN needed on same LAN/hotspot
];

export class WebRTCManager {
	private peerConnection: RTCPeerConnection | null = null;
	private dataChannel: RTCDataChannel | null = null;
	private onMessage: MessageHandler;
	private onStatusChange: StatusHandler;

	constructor(onMessage: MessageHandler, onStatusChange: StatusHandler) {
		this.onMessage = onMessage;
		this.onStatusChange = onStatusChange;
	}

	/** Creates a new RTCPeerConnection with ICE server config. */
	private createPeer(): RTCPeerConnection {
		const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

		pc.oniceconnectionstatechange = () => {
			if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
				this.onStatusChange('connected');
			} else if (
				pc.iceConnectionState === 'disconnected' ||
				pc.iceConnectionState === 'closed' ||
				pc.iceConnectionState === 'failed'
			) {
				this.onStatusChange('disconnected');
			}
		};

		return pc;
	}

	/** Sets up data channel event handlers. */
	private setupDataChannel(channel: RTCDataChannel) {
		this.dataChannel = channel;

		channel.onopen = () => {
			this.onStatusChange('connected');
		};

		channel.onclose = () => {
			this.onStatusChange('disconnected');
		};

		channel.onerror = (e) => {
			this.onStatusChange('error', String(e));
		};

		channel.onmessage = (event: MessageEvent<string>) => {
			try {
				const action = JSON.parse(event.data) as SyncAction;
				this.onMessage(action);
			} catch {
				// ignore malformed messages
			}
		};
	}

	/**
	 * Host: Creates an offer SDP and waits for all ICE candidates.
	 * Returns the serialized offer (compressed SDP) ready for QR display.
	 */
	async createOffer(): Promise<string> {
		const { serializeSdp } = await import('./syncCompression');
		this.peerConnection = this.createPeer();
		const dc = this.peerConnection.createDataChannel('mtg-sync', { ordered: true });
		this.setupDataChannel(dc);

		const offer = await this.peerConnection.createOffer();
		await this.peerConnection.setLocalDescription(offer);

		// Wait for ICE gathering to complete
		await this.waitForIceComplete(this.peerConnection);

		const localDesc = this.peerConnection.localDescription;
		if (!localDesc) throw new Error('No local description after ICE gathering');
		return serializeSdp(localDesc);
	}

	/**
	 * Guest: Accepts an offer SDP from QR scan, creates answer, waits for ICE.
	 * Returns the serialized answer ready for QR display.
	 */
	async createAnswer(offerPayload: string): Promise<string> {
		const { serializeSdp, deserializeSdp } = await import('./syncCompression');

		const offerDesc = deserializeSdp(offerPayload);
		if (!offerDesc) throw new Error('Invalid offer payload');

		this.peerConnection = this.createPeer();

		this.peerConnection.ondatachannel = (event) => {
			this.setupDataChannel(event.channel);
		};

		await this.peerConnection.setRemoteDescription(offerDesc);
		const answer = await this.peerConnection.createAnswer();
		await this.peerConnection.setLocalDescription(answer);

		// Wait for ICE gathering to complete
		await this.waitForIceComplete(this.peerConnection);

		const localDesc = this.peerConnection.localDescription;
		if (!localDesc) throw new Error('No local description after ICE gathering');
		return serializeSdp(localDesc);
	}

	/**
	 * Host: Finalizes connection by accepting guest's answer SDP from QR scan.
	 */
	async acceptAnswer(answerPayload: string): Promise<void> {
		const { deserializeSdp } = await import('./syncCompression');

		const answerDesc = deserializeSdp(answerPayload);
		if (!answerDesc) throw new Error('Invalid answer payload');
		if (!this.peerConnection) throw new Error('No peer connection');
		await this.peerConnection.setRemoteDescription(answerDesc);
	}

	/**
	 * Sends a sync action to the remote peer via DataChannel.
	 */
	sendAction(action: SyncAction): void {
		if (!this.dataChannel || this.dataChannel.readyState !== 'open') return;
		this.dataChannel.send(JSON.stringify(action));
	}

	/**
	 * Closes the peer connection and data channel.
	 */
	close(): void {
		this.dataChannel?.close();
		this.peerConnection?.close();
		this.dataChannel = null;
		this.peerConnection = null;
	}

	/** Returns true if the data channel is open. */
	get isConnected(): boolean {
		return this.dataChannel?.readyState === 'open';
	}

	/** Waits for ICE candidate gathering to complete (max 5 seconds). */
	private waitForIceComplete(pc: RTCPeerConnection): Promise<void> {
		return new Promise((resolve) => {
			if (pc.iceGatheringState === 'complete') {
				resolve();
				return;
			}
			const timeout = setTimeout(() => resolve(), 5000);
			pc.onicegatheringstatechange = () => {
				if (pc.iceGatheringState === 'complete') {
					clearTimeout(timeout);
					resolve();
				}
			};
		});
	}
}
