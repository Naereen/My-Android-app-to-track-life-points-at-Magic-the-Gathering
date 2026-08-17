const UINT32_MAX = 0xffffffff;
const UINT32_RANGE = UINT32_MAX + 1;

const getCrypto = (): Crypto => {
	const cryptoApi = globalThis.crypto;
	if (!cryptoApi?.getRandomValues) {
		throw new Error('Secure random generation is unavailable: crypto.getRandomValues is missing.');
	}
	return cryptoApi;
};

export const secureRandomInt = (min: number, max: number): number => {
	if (!Number.isInteger(min) || !Number.isInteger(max)) {
		throw new RangeError('secureRandomInt expects integer bounds.');
	}
	if (min > max) {
		throw new RangeError('secureRandomInt expects min <= max.');
	}

	const range = max - min + 1;
	if (range <= 0 || range > UINT32_RANGE) {
		throw new RangeError('secureRandomInt range must be between 1 and 2^32.');
	}

	const maxUnbiased = Math.floor(UINT32_RANGE / range) * range;
	const buffer = new Uint32Array(1);

	do {
		getCrypto().getRandomValues(buffer);
	} while (buffer[0] >= maxUnbiased);

	return min + (buffer[0] % range);
};

export const secureRandomFloat = (): number => {
	const buffer = new Uint32Array(1);
	getCrypto().getRandomValues(buffer);
	return buffer[0] / UINT32_RANGE;
};

export const secureShuffle = <T>(array: T[]): T[] => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = secureRandomInt(0, i);
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

export const rollDie = (sides: number): number => {
	if (!Number.isInteger(sides) || sides <= 0) {
		throw new RangeError('rollDie expects a positive integer number of sides.');
	}
	return secureRandomInt(1, sides);
};

export const flipCoin = (): boolean => secureRandomInt(0, 1) === 1;
