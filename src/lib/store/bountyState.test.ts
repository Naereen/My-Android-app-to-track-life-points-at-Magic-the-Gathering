import { describe, expect, it } from 'vitest';
import { bountyMenuState } from './bountyState';

describe('bounty menu in-memory state', () => {
	it('keeps selected bounty values in shared memory', () => {
		const previousState = {
			rewardLevel: bountyMenuState.rewardLevel,
			cards: [...bountyMenuState.cards],
			currentCardIndex: bountyMenuState.currentCardIndex,
			showBack: bountyMenuState.showBack,
			bountyBackImage: bountyMenuState.bountyBackImage,
			errorMsg: bountyMenuState.errorMsg
		};

		bountyMenuState.currentCardIndex = 3;
		bountyMenuState.rewardLevel = 2;
		bountyMenuState.showBack = true;

		const reopenedSnapshot = { ...bountyMenuState };
		expect(reopenedSnapshot.currentCardIndex).toBe(3);
		expect(reopenedSnapshot.rewardLevel).toBe(2);
		expect(reopenedSnapshot.showBack).toBe(true);

		bountyMenuState.rewardLevel = previousState.rewardLevel;
		bountyMenuState.cards = previousState.cards;
		bountyMenuState.currentCardIndex = previousState.currentCardIndex;
		bountyMenuState.showBack = previousState.showBack;
		bountyMenuState.bountyBackImage = previousState.bountyBackImage;
		bountyMenuState.errorMsg = previousState.errorMsg;
	});
});
