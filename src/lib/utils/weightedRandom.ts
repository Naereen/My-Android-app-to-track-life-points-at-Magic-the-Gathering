export const pickWeightedIndex = (weights: number[], count: number): number => {
	if (count <= 0) return 0;

	const normalized = Array.from({ length: count }, (_, index) => {
		const value = Number(weights[index]);
		if (!Number.isFinite(value) || value <= 0) return 0;
		return value;
	});

	const total = normalized.reduce((sum, value) => sum + value, 0);
	if (total <= 0) {
		return Math.floor(Math.random() * count);
	}

	const random = Math.random() * total;
	let cumulative = 0;
	for (let index = 0; index < normalized.length; index++) {
		cumulative += normalized[index];
		if (random < cumulative) {
			return index;
		}
	}

	return count - 1;
};
