export const getCoinResultInitial = (label: string | null | undefined, fallback: string) => {
	const normalizedLabel = (label || fallback).trim();

	return Array.from(normalizedLabel)[0] || Array.from(fallback)[0] || '';
};
