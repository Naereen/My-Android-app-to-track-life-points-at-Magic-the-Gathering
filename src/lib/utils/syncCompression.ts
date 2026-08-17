import LZString from 'lz-string';

/**
 * Prunes an SDP string to only keep the essential fields required for WebRTC connection.
 * Removes non-essential lines like bandwidth, timing, and optional attributes to reduce QR code size.
 */
export function pruneSdp(sdp: string): string {
	return sdp
		.split('\n')
		.filter((line) => {
			const trimmed = line.trim();
			// Keep essential SDP lines
			if (trimmed.startsWith('v=')) return true;
			if (trimmed.startsWith('o=')) return true;
			if (trimmed.startsWith('s=')) return true;
			if (trimmed.startsWith('t=')) return true;
			if (trimmed.startsWith('m=')) return true;
			if (trimmed.startsWith('c=')) return true;
			if (trimmed.startsWith('a=ice-ufrag')) return true;
			if (trimmed.startsWith('a=ice-pwd')) return true;
			if (trimmed.startsWith('a=fingerprint')) return true;
			if (trimmed.startsWith('a=setup')) return true;
			if (trimmed.startsWith('a=mid')) return true;
			if (trimmed.startsWith('a=sendrecv')) return true;
			if (trimmed.startsWith('a=recvonly')) return true;
			if (trimmed.startsWith('a=sendonly')) return true;
			if (trimmed.startsWith('a=inactive')) return true;
			if (trimmed.startsWith('a=group')) return true;
			if (trimmed.startsWith('a=msid-semantic')) return true;
			if (trimmed.startsWith('a=candidate')) return true;
			if (trimmed.startsWith('a=sctp-port')) return true;
			if (trimmed.startsWith('a=max-message-size')) return true;
			return false;
		})
		.join('\n');
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
