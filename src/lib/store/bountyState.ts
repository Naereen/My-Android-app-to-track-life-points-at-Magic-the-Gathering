export type BountyCard = { name: string; oracleText: string; imageUri: string };

export const bountyMenuState: {
	rewardLevel: number;
	cards: BountyCard[];
	currentCardIndex: number;
	showBack: boolean;
	bountyBackImage: string;
	errorMsg: string;
} = {
	rewardLevel: 1,
	cards: [],
	currentCardIndex: 0,
	showBack: false,
	bountyBackImage: '',
	errorMsg: ''
};
