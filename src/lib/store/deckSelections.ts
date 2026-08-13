export type SavedDeckSelection = {
	name: string;
	setCodes: string[];
};

export const normalizeSetCodes = (setCodes: string[]): string[] =>
	Array.from(new Set((setCodes ?? []).map((code) => code.trim().toUpperCase()).filter(Boolean)));

export const getSavedDeckSelections = (
	savedSelections?: SavedDeckSelection[] | null
): SavedDeckSelection[] =>
	Array.isArray(savedSelections)
		? savedSelections
				.map((selection) => ({
					name: selection?.name?.trim?.() ?? '',
					setCodes: normalizeSetCodes(selection?.setCodes ?? [])
				}))
				.filter((selection) => selection.name.length > 0 && selection.setCodes.length > 0)
		: [];

export const upsertSavedDeckSelection = (
	savedSelections: SavedDeckSelection[] | undefined,
	name: string,
	setCodes: string[]
): SavedDeckSelection[] => {
	const normalizedName = name.trim();
	const normalizedSetCodes = normalizeSetCodes(setCodes);
	if (!normalizedName || normalizedSetCodes.length === 0) {
		return getSavedDeckSelections(savedSelections);
	}

	return [
		{ name: normalizedName, setCodes: normalizedSetCodes },
		...getSavedDeckSelections(savedSelections).filter(
			(selection) => selection.name !== normalizedName
		)
	];
};

export const removeSavedDeckSelection = (
	savedSelections: SavedDeckSelection[] | undefined,
	name: string
): SavedDeckSelection[] =>
	getSavedDeckSelections(savedSelections).filter((selection) => selection.name !== name.trim());
