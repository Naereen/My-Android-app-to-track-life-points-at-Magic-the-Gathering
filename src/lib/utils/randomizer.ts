export const getRandomizerResultTranslationKey = (
	type?: string,
	result?: number
): 'coin_result_head' | 'coin_result_tail' | null => {
	if (type !== 'd2') return null;
	if (result === 1) return 'coin_result_head';
	if (result === 2) return 'coin_result_tail';
	return null;
};
