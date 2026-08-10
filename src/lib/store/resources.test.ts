import { beforeEach, describe, expect, it, vi } from 'vitest';

const { playGameplaySound } = vi.hoisted(() => ({
	playGameplaySound: vi.fn()
}));

vi.mock('$lib/utils/gameplaySound', () => ({
	playGameplaySound
}));

import { resourceCounter, setResource } from './resources';

describe('resource sounds', () => {
	beforeEach(() => {
		playGameplaySound.mockReset();
		resourceCounter.set({
			white: 0,
			blue: 0,
			black: 0,
			red: 0,
			green: 0,
			waste: 0,
			storm: 0
		});
	});

	it('plays a status-up sound when a resource count increases', () => {
		setResource('storm', 1);

		expect(playGameplaySound).toHaveBeenCalledWith('statusUp');
	});

	it('plays a status-down sound when a resource count decreases', () => {
		setResource('storm', 1);
		playGameplaySound.mockReset();

		setResource('storm', 0);

		expect(playGameplaySound).toHaveBeenCalledWith('statusDown');
	});
});
