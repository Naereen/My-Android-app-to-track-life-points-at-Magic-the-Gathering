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

/*
 * Compact SDP codec.
 *
 * A pruned + LZ-compressed SDP still weighs 400+ characters, which produces a QR code
 * dense enough (version 16+) to be unreadable by a phone camera filming another screen.
 * Since both peers run this same app, we only exchange the handful of fields that cannot
 * be guessed (ufrag, pwd, fingerprint, setup, host candidates) and rebuild a full SDP on
 * the receiving side. That keeps the payload around 120-180 characters (QR version ~8).
 */

const SETUP_TO_CODE: Record<string, string> = {
	actpass: 'A',
	active: 'a',
	passive: 'p',
	holdconn: 'h'
};
const CODE_TO_SETUP: Record<string, string> = {
	A: 'actpass',
	a: 'active',
	p: 'passive',
	h: 'holdconn'
};

function firstMatch(sdp: string, re: RegExp): string | null {
	const m = sdp.match(re);
	return m ? m[1].trim() : null;
}

/** Splits an SDP into its session header and its `m=application` section. */
function splitSections(sdp: string): { header: string; application: string } {
	const lines = sdp.split(/\r?\n/);
	const header: string[] = [];
	const application: string[] = [];
	let current: 'header' | 'application' | 'other' = 'header';
	for (const line of lines) {
		if (line.startsWith('m=')) {
			current = line.startsWith('m=application') ? 'application' : 'other';
		}
		if (current === 'header') header.push(line);
		else if (current === 'application') application.push(line);
	}
	return { header: header.join('\n'), application: application.join('\n') };
}

function hexToBase64Url(hexWithColons: string): string | null {
	const hex = hexWithColons.replace(/[^0-9a-fA-F]/g, '');
	if (hex.length === 0 || hex.length % 2 !== 0) return null;
	let binary = '';
	for (let i = 0; i < hex.length; i += 2) {
		binary += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToHex(b64url: string): string | null {
	try {
		const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
		const binary = atob(b64);
		const parts: string[] = [];
		for (let i = 0; i < binary.length; i++) {
			parts.push(binary.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase());
		}
		return parts.length ? parts.join(':') : null;
	} catch {
		return null;
	}
}

/** Extracts `ip@port` for every usable UDP host candidate, most-useful first. */
function extractHostCandidates(sdp: string): string[] {
	const seen = new Set<string>();
	const found: string[] = [];
	const re = /^a=candidate:\S+ (\d+) (udp|UDP) \d+ (\S+) (\d+) typ host/gm;
	let m: RegExpExecArray | null;
	while ((m = re.exec(sdp)) !== null) {
		if (m[1] !== '1') continue; // component 1 only (RTP / data channel)
		const key = `${m[3]}@${m[4]}`;
		if (seen.has(key)) continue;
		seen.add(key);
		found.push(key);
	}
	// Prefer private IPv4 addresses: they are the ones that actually work on a LAN/hotspot.
	const score = (c: string) => {
		const host = c.slice(0, c.lastIndexOf('@'));
		if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return 0;
		if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return 1;
		if (host.endsWith('.local')) return 2;
		return 3; // IPv6 and others
	};
	return found.sort((a, b) => score(a) - score(b)).slice(0, 4);
}

/** Builds the compact, pipe-separated representation of an SDP. Returns null if incomplete. */
function encodeCompact(description: RTCSessionDescriptionInit): string | null {
	const sdp = description.sdp ?? '';
	const { header, application } = splitSections(sdp);
	// Firefox puts the fingerprint at session level, Chrome inside the media section.
	const field = (re: RegExp) => firstMatch(application, re) ?? firstMatch(header, re);

	const ufrag = field(/^a=ice-ufrag:(.+)$/m);
	const pwd = field(/^a=ice-pwd:(.+)$/m);
	const fingerprint = field(/^a=fingerprint:(.+)$/m);
	const setup = field(/^a=setup:(.+)$/m);
	if (!ufrag || !pwd || !fingerprint || !setup) return null;

	const [hashAlgo, ...fpRest] = fingerprint.split(/\s+/);
	const fp = hexToBase64Url(fpRest.join(''));
	if (!fp) return null;

	const setupCode = SETUP_TO_CODE[setup];
	if (!setupCode) return null;

	const sctpPort = field(/^a=sctp-port:(\d+)$/m) ?? '5000';
	const candidates = extractHostCandidates(application);

	return [
		'M1',
		description.type === 'answer' ? 'a' : 'o',
		ufrag,
		pwd,
		hashAlgo.replace('sha-', ''),
		fp,
		setupCode,
		sctpPort,
		candidates.join(',')
	].join('|');
}

/** Rebuilds a full, browser-acceptable SDP from the compact representation. */
function decodeCompact(compact: string): RTCSessionDescriptionInit | null {
	const parts = compact.split('|');
	if (parts.length < 9 || parts[0] !== 'M1') return null;
	const [, typeCode, ufrag, pwd, hashSuffix, fp, setupCode, sctpPort, candidateList] = parts;

	const hex = base64UrlToHex(fp);
	const setup = CODE_TO_SETUP[setupCode];
	if (!ufrag || !pwd || !hex || !setup) return null;

	const candidateLines = candidateList
		.split(',')
		.filter(Boolean)
		.map((entry, index) => {
			const at = entry.lastIndexOf('@');
			if (at < 0) return null;
			const host = entry.slice(0, at);
			const port = entry.slice(at + 1);
			if (!host || !/^\d+$/.test(port)) return null;
			return `a=candidate:${index + 1} 1 udp ${2122260223 - index} ${host} ${port} typ host generation 0`;
		})
		.filter((line): line is string => line !== null);

	const lines = [
		'v=0',
		'o=- 1 2 IN IP4 127.0.0.1',
		's=-',
		't=0 0',
		'a=group:BUNDLE 0',
		'a=msid-semantic: WMS',
		'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
		'c=IN IP4 0.0.0.0',
		...candidateLines,
		`a=ice-ufrag:${ufrag}`,
		`a=ice-pwd:${pwd}`,
		'a=ice-options:trickle',
		`a=fingerprint:sha-${hashSuffix} ${hex}`,
		`a=setup:${setup}`,
		'a=mid:0',
		`a=sctp-port:${sctpPort}`,
		'a=max-message-size:262144',
		'a=end-of-candidates'
	];

	return {
		type: typeCode === 'a' ? 'answer' : 'offer',
		sdp: lines.join('\r\n') + '\r\n'
	};
}

/**
 * Serializes a full SDP object (RTCSessionDescriptionInit) to a compact string.
 * The first character marks the encoding: `R` raw compact, `C` compressed compact,
 * `J` legacy compressed JSON (fallback when the SDP cannot be compacted).
 */
export function serializeSdp(description: RTCSessionDescriptionInit): string {
	const compact = encodeCompact(description);
	if (compact) {
		const compressed = LZString.compressToEncodedURIComponent(compact);
		return compressed.length < compact.length ? `C${compressed}` : `R${compact}`;
	}
	const data = { t: description.type, s: pruneSdp(description.sdp ?? '') };
	return `J${LZString.compressToEncodedURIComponent(JSON.stringify(data))}`;
}

/**
 * Deserializes a compact string back to an RTCSessionDescriptionInit object.
 */
export function deserializeSdp(payload: string): RTCSessionDescriptionInit | null {
	try {
		const trimmed = payload.trim();
		const marker = trimmed[0];
		const body = trimmed.slice(1);

		if (marker === 'R') return decodeCompact(body);
		if (marker === 'C') {
			const compact = LZString.decompressFromEncodedURIComponent(body);
			return compact ? decodeCompact(compact) : null;
		}
		if (marker === 'J') {
			const json = LZString.decompressFromEncodedURIComponent(body);
			if (!json) return null;
			const data = JSON.parse(json) as { t: RTCSdpType; s: string };
			if (!data.t || !data.s) return null;
			return { type: data.t, sdp: data.s };
		}
		return null;
	} catch {
		return null;
	}
}
