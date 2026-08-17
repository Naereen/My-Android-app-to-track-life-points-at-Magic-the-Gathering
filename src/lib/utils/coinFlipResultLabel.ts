export const getCoinResultShortLabel = (
	shortLabel: string | null | undefined,
	label: string | null | undefined,
	fallback: string
) => {
	const normalizedShortLabel = shortLabel?.trim();
	if (normalizedShortLabel) return normalizedShortLabel;

	const normalizedLabel = (label || fallback).trim();
	return Array.from(normalizedLabel)[0] || Array.from(fallback)[0] || '';
};
