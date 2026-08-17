import { describe, it, expect } from 'vitest';
import {
	pruneSdp,
	compressSdp,
	decompressSdp,
	serializeSdp,
	deserializeSdp
} from './syncCompression';

const SAMPLE_SDP = `v=0
o=- 1234567890 1 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 10.0.0.1
a=ice-ufrag:audio123
a=ice-pwd:audio-password
a=fingerprint:sha-256 11:22:33
a=setup:actpass
a=mid:audio
a=candidate:9 1 UDP 2122260223 10.0.0.1 40000 typ host
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 0.0.0.0
a=ice-ufrag:abc1
a=ice-pwd:supersecretpassword12345678
a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
a=setup:actpass
a=mid:0
a=sctp-port:5000
a=candidate:1 1 UDP 2122260223 192.168.1.100 54400 typ host
a=candidate:2 1 UDP 1686052607 203.0.113.1 54401 typ srflx raddr 192.168.1.100 rport 54400
b=AS:30
a=rtcp-mux
`;

describe('syncCompression', () => {
	it('pruneSdp keeps essential lines', () => {
		const pruned = pruneSdp(SAMPLE_SDP);
		expect(pruned).toContain('v=0');
		expect(pruned).toContain('m=application 9 UDP/DTLS/SCTP webrtc-datachannel');
		expect(pruned).toContain('a=ice-ufrag:abc1');
		expect(pruned).toContain('a=ice-pwd:supersecretpassword12345678');
		expect(pruned).toContain('a=fingerprint');
		expect(pruned).toContain('a=setup:actpass');
		expect(pruned).toContain('a=sctp-port:5000');
	});

	it('pruneSdp removes non-essential lines', () => {
		const pruned = pruneSdp(SAMPLE_SDP);
		expect(pruned).not.toContain('a=group:BUNDLE 0');
		expect(pruned).not.toContain('m=audio');
		expect(pruned).not.toContain('c=IN IP4 10.0.0.1');
		expect(pruned).not.toContain('a=ice-ufrag:audio123');
		expect(pruned).not.toContain('a=ice-pwd:audio-password');
		expect(pruned).not.toContain('a=mid:audio');
		expect(pruned).not.toContain('typ srflx');
		expect(pruned).not.toContain('b=AS:30');
		expect(pruned).not.toContain('a=rtcp-mux');
	});

	it('pruneSdp keeps host candidates only in the application section', () => {
		const pruned = pruneSdp(SAMPLE_SDP);
		expect(pruned).toContain('a=candidate:1 1 UDP 2122260223 192.168.1.100 54400 typ host');
		expect(pruned).not.toContain('a=candidate:9 1 UDP 2122260223 10.0.0.1 40000 typ host');
		expect(pruned).not.toContain('a=candidate:2 1 UDP 1686052607 203.0.113.1 54401 typ srflx');
	});

	it('compressSdp produces a non-empty string', () => {
		const compressed = compressSdp(SAMPLE_SDP);
		expect(compressed.length).toBeGreaterThan(0);
	});

	it('decompressSdp roundtrips compressSdp', () => {
		const compressed = compressSdp(SAMPLE_SDP);
		const decompressed = decompressSdp(compressed);
		expect(decompressed).not.toBeNull();
		// The decompressed value is the pruned version, not the original
		expect(decompressed).toContain('a=ice-ufrag:abc1');
	});

	it('decompressSdp returns null or empty string for invalid input', () => {
		const result = decompressSdp('!!!invalid!!!');
		// lz-string may return null or a garbage string; either way it should not be a valid SDP
		if (result !== null) {
			expect(result).not.toContain('a=ice-ufrag');
		} else {
			expect(result).toBeNull();
		}
	});

	it('serializeSdp / deserializeSdp roundtrip', () => {
		const desc: RTCSessionDescriptionInit = { type: 'offer', sdp: SAMPLE_SDP };
		const serialized = serializeSdp(desc);
		expect(serialized).toBeTruthy();
		const deserialized = deserializeSdp(serialized);
		expect(deserialized).not.toBeNull();
		expect(deserialized?.type).toBe('offer');
		expect(deserialized?.sdp).toContain('a=ice-ufrag:abc1');
	});

	it('serializeSdp produces a QR-friendly payload and rebuilds a usable SDP', () => {
		const desc: RTCSessionDescriptionInit = { type: 'offer', sdp: SAMPLE_SDP };
		const serialized = serializeSdp(desc);
		expect(serialized.length).toBeLessThan(200);

		const rebuilt = deserializeSdp(serialized);
		expect(rebuilt?.sdp).toContain('a=ice-pwd:supersecretpassword12345678');
		expect(rebuilt?.sdp).toContain('a=setup:actpass');
		expect(rebuilt?.sdp).toContain('a=sctp-port:5000');
		expect(rebuilt?.sdp).toContain('a=fingerprint:sha-256 AA:BB:CC:DD');
		expect(rebuilt?.sdp).toContain('192.168.1.100 54400 typ host');
		expect(rebuilt?.sdp).not.toContain('203.0.113.1');
	});

	it('deserializeSdp returns null for garbage input', () => {
		expect(deserializeSdp('notvalid')).toBeNull();
	});
});
