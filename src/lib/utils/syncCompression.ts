import LZString from 'lz-string';

/**
 * Prunes an SDP string to only keep the essential fields required for WebRTC connection.
 * For local Wi-Fi / hotspot sync, keep only session-level v=/o=/s=/t=/c= lines plus the
 * m=application section fields required for the data channel, including host ICE candidates only.
 */
export function pruneSdp(sdp: string): string {
	let currentSection: 'session' | 'application' | 'other' = 'session';
	const keptLines: string[] = [];

	for (const line of sdp.split(/\r?\n/)) {
		const trimmed = line.trim();

		if (trimmed.startsWith('v=')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('o=')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('s=')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('t=')) {
			keptLines.push(trimmed);
			continue;
		}

		if (trimmed.startsWith('m=')) {
			currentSection = trimmed.startsWith('m=application') ? 'application' : 'other';
			if (currentSection === 'application') {
				keptLines.push(trimmed);
			}
			continue;
		}

		if (currentSection === 'session') {
			if (trimmed.startsWith('c=')) {
				keptLines.push(trimmed);
			}
			continue;
		}

		if (currentSection !== 'application') continue;

		if (trimmed.startsWith('c=')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=ice-ufrag')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=ice-pwd')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=fingerprint')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=setup')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=mid')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=sctp-port')) {
			keptLines.push(trimmed);
			continue;
		}
		if (trimmed.startsWith('a=candidate:') && trimmed.includes(' typ host')) {
			keptLines.push(trimmed);
		}
	}

	return keptLines.join('\n');
}

/**
 * Compresses a pruned SDP string using LZ-String for compact QR code encoding.
 */
export function compressSdp(sdp: string): string {
	const pruned = pruneSdp(sdp);
	return LZString.compressToEncodedURIComponent(pruned);
}

/**
 * Decompresses an LZ-String compressed SDP payload back to a full SDP string.
 */
export function decompressSdp(compressed: string): string | null {
	return LZString.decompressFromEncodedURIComponent(compressed);
}

/**
 * Serializes a full SDP object (RTCSessionDescriptionInit) to a compact string.
 */
export function serializeSdp(description: RTCSessionDescriptionInit): string {
	const data = {
		t: description.type,
		s: pruneSdp(description.sdp ?? '')
	};
	return LZString.compressToEncodedURIComponent(JSON.stringify(data));
}

/**
 * Deserializes a compact string back to an RTCSessionDescriptionInit object.
 */
export function deserializeSdp(payload: string): RTCSessionDescriptionInit | null {
	try {
		const json = LZString.decompressFromEncodedURIComponent(payload);
		if (!json) return null;
		const data = JSON.parse(json) as { t: RTCSdpType; s: string };
		if (!data.t || !data.s) return null;
		return { type: data.t, sdp: data.s };
	} catch {
		return null;
	}
}
