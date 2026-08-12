export type ScryfallCard = {
	id: string;
	name: string;
	set_name?: string;
	artist?: string;
	image?: string | null;
	cardImage?: string | null;
};

export type ScryfallEmblemFace = {
	name: string;
	image: string | null;
	oracleText?: string;
	typeLine?: string;
};

export type ScryfallEmblemCard = {
	id: string;
	name: string;
	set_name?: string;
	scryfall_uri?: string;
	faces: ScryfallEmblemFace[];
};

// Scryfall is the canonical remote source for card art and emblem-like cards.
// This adapter keeps the rest of the app insulated from API shape differences.

/**
 * Performs an HTTP GET request and decodes the Scryfall JSON payload.
 * @param {string} url Absolute Scryfall API URL.
 * @returns {Promise<any>} Parsed JSON body.
 * @throws {Error} Throws when the HTTP response status is not successful.
 */
async function fetchJson(url: string) {
	// Centralizing the fetch/JSON step makes error handling consistent across card queries.
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Scryfall error ${res.status}`);
	return res.json();
}

/**
 * Maps a raw Scryfall card object to the app emblem/dungeon structure.
 * Handles single-face cards and multi-face cards while keeping the best available image URL.
 * @param {any} c Raw Scryfall card object.
 * @returns {ScryfallEmblemCard | null} Normalized card or `null` when mandatory data is missing.
 */
function normalizeEmblemCard(c: any): ScryfallEmblemCard | null {
	// Emblem-like cards can be single-faced or multi-faced; this normalizer collapses both
	// into the same modal-friendly structure used by the UI.
	if (!c || !c.id || !c.name) return null;

	const faces: ScryfallEmblemFace[] = [];

	if (Array.isArray(c.card_faces) && c.card_faces.length > 0) {
		for (const face of c.card_faces) {
			const image =
				face?.image_uris?.large || face?.image_uris?.normal || face?.image_uris?.small || null;
			faces.push({
				name: face?.name || c.name,
				image,
				oracleText: face?.oracle_text || '',
				typeLine: face?.type_line || ''
			});
		}
	} else {
		const image = c.image_uris?.large || c.image_uris?.normal || c.image_uris?.small || null;
		faces.push({
			name: c.name,
			image,
			oracleText: c.oracle_text || '',
			typeLine: c.type_line || ''
		});
	}

	const cardsWithImage = faces.filter((face) => !!face.image);
	if (cardsWithImage.length === 0) return null;

	return {
		id: c.id,
		name: c.name,
		set_name: c.set_name,
		scryfall_uri: c.scryfall_uri,
		faces
	};
}

/**
 * Searches Scryfall cards for generic picker UI (art + full card images).
 * @param {string} query Scryfall query syntax entered by the user.
 * @param {number} limit Maximum number of cards returned to the UI.
 * @returns {Promise<ScryfallCard[]>} Normalized list, or an empty list on network/API failures.
 */
export async function searchCards(query: string, limit = 256): Promise<ScryfallCard[]> {
	if (!query || query.trim().length === 0) return [];
	// `unique=art` prevents duplicate art entries from cluttering the picker.
	const q = encodeURIComponent(query);
	const url = `https://api.scryfall.com/cards/search?q=${q}&order=released&unique=art`;
	try {
		const data = await fetchJson(url);
		if (!data || !data.data) return [];

		const cards = data.data.slice(0, limit).map((c: any) => {
			let image: string | null = null;
			let cardImage: string | null = null;
			if (c.image_uris) {
				image = c.image_uris.art_crop || c.image_uris.large || c.image_uris.normal || null;
				cardImage = c.image_uris.large || c.image_uris.normal || c.image_uris.small || null;
			} else if (c.card_faces && c.card_faces.length > 0) {
				const face = c.card_faces[0];
				image = (face.image_uris && (face.image_uris.art_crop || face.image_uris.large)) || null;
				cardImage =
					(face.image_uris &&
						(face.image_uris.large || face.image_uris.normal || face.image_uris.small)) ||
					null;
			}

			return {
				id: c.id,
				name: c.name,
				set_name: c.set_name,
				artist: c.artist,
				cardImage: cardImage,
				image: image
			} as ScryfallCard;
		});

		return cards;
	} catch (err) {
		console.warn('Scryfall search failed', err);
		return [];
	}
}

/**
 * Fetches one random card matching a Scryfall query and normalizes it to card-list format.
 * @param {string} query Scryfall random query syntax.
 * @param {number} limit Maximum number of normalized items (kept for API parity with searchCards).
 * @returns {Promise<ScryfallCard[]>} Usually a one-item array; empty list when fetch fails.
 */
export async function randomCards(query: string, limit = 256): Promise<ScryfallCard[]> {
	if (!query || query.trim().length === 0) return [];
	// Random results are normalized into the same array shape as search results so the
	// modal can reuse one rendering path for both flows.
	const q = encodeURIComponent(query);
	const url = `https://api.scryfall.com/cards/random?q=${q}&unique=art`;
	try {
		const data = await fetchJson(url);

		// The /cards/random endpoint returns a single card object (not a { data: [] } list).
		// Normalize the response to an array of cards so callers can treat it like searchCards.
		let rawCards: any[] = [];
		if (data) {
			if (Array.isArray(data.data)) rawCards = data.data;
			else rawCards = [data];
		}

		if (rawCards.length === 0) return [];

		const cards = rawCards.slice(0, limit).map((c: any) => {
			let image: string | null = null;
			let cardImage: string | null = null;
			if (c.image_uris) {
				image = c.image_uris.art_crop || c.image_uris.large || c.image_uris.normal || null;
				cardImage = c.image_uris.large || c.image_uris.normal || c.image_uris.small || null;
			} else if (c.card_faces && c.card_faces.length > 0) {
				const face = c.card_faces[0];
				image = (face.image_uris && (face.image_uris.art_crop || face.image_uris.large)) || null;
				cardImage =
					(face.image_uris &&
						(face.image_uris.large || face.image_uris.normal || face.image_uris.small)) ||
					null;
			}

			return {
				id: c.id,
				name: c.name,
				set_name: c.set_name,
				artist: c.artist,
				cardImage: cardImage,
				image: image
			} as ScryfallCard;
		});

		return cards;
	} catch (err) {
		console.warn('Scryfall search failed', err);
		return [];
	}
}

/**
 * Searches emblem/dungeon cards and normalizes results for emblem and vanguard modals.
 * @param {string} query Free-text or advanced Scryfall query.
 * @param {number} limit Maximum number of returned items.
 * @param {'emblem' | 'dungeon' | 'none'} filter Additional type filtering strategy.
 * @returns {Promise<ScryfallEmblemCard[]>} Matching normalized cards, or empty list on failure.
 */
export async function searchEmblemCards(
	query: string,
	limit = 60,
	filter: 'emblem' | 'dungeon' | 'none' = 'emblem'
): Promise<ScryfallEmblemCard[]> {
	const clean = query?.trim() ?? '';
	// The composed query intentionally narrows to emblem/dungeon-style cards because the UI
	// needs mechanics, not arbitrary spells that happen to match the search text.

	let composed = clean;
	if (filter === 'emblem') {
		composed =
			clean.length > 0 ? `(${clean}) (t:emblem or t:dungeon)` : '(type:emblem -type:dungeon)';
	} else if (filter === 'dungeon') {
		composed =
			clean.length > 0
				? `(${clean}) t:dungeon -t:planeswalker unique:card`
				: 't:dungeon -t:planeswalker unique:card -(set:oafr or set:oclb)';
	}

	if (!composed || composed.trim().length === 0) return [];

	const q = encodeURIComponent(composed);
	const url = `https://api.scryfall.com/cards/search?q=${q}&order=released&unique=prints`;

	try {
		const data = await fetchJson(url);
		if (!data || !Array.isArray(data.data)) return [];

		const mapped = data.data
			.slice(0, limit)
			.map((c: any) => normalizeEmblemCard(c))
			.filter((card: ScryfallEmblemCard | null): card is ScryfallEmblemCard => card !== null);

		return mapped;
	} catch (err) {
		console.warn('Scryfall emblem search failed', err);
		return [];
	}
}

/**
 * Searches paper Vanguard cards from Scryfall and converts them to emblem-card shape.
 * @param {string} query Optional user query appended to the vanguard filter.
 * @param {number} limit Maximum number of cards returned.
 * @returns {Promise<ScryfallEmblemCard[]>} Vanguard cards ready for modal selection.
 */
export async function searchVanguardCards(
	query: string,
	limit = 120
): Promise<ScryfallEmblemCard[]> {
	const clean = query?.trim() ?? '';
	// Paper-only vanguards avoid digital-only printings and keep the modal aligned with the
	// physical variant of the game.
	const composed = clean.length > 0 ? `(${clean}) t:vanguard game:paper` : 't:vanguard game:paper';

	if (!composed || composed.trim().length === 0) return [];

	const q = encodeURIComponent(composed);
	const url = `https://api.scryfall.com/cards/search?q=${q}&order=name&unique=cards`;

	try {
		const data = await fetchJson(url);
		if (!data || !Array.isArray(data.data)) return [];

		const mapped = data.data
			.slice(0, limit)
			.map((c: any) => normalizeEmblemCard(c))
			.filter((card: ScryfallEmblemCard | null): card is ScryfallEmblemCard => card !== null);

		return mapped;
	} catch (err) {
		console.warn('Scryfall vanguard search failed', err);
		return [];
	}
}

/**
 * Fetches a specific card by set code and collector number (used by preset shortcuts).
 * @param {string} setCode Scryfall set identifier (e.g. `otj`, `mh3`).
 * @param {string} collectorNumber Collector number inside the set.
 * @returns {Promise<ScryfallEmblemCard | null>} Normalized card or `null` when unavailable.
 */
export async function fetchCardBySetCollector(
	setCode: string,
	collectorNumber: string
): Promise<ScryfallEmblemCard | null> {
	if (!setCode || !collectorNumber) return null;

	// Preset shortcuts use set/collector lookups because they stay stable even when card
	// names are ambiguous or transliterated across locales.

	const set = encodeURIComponent(setCode.trim().toLowerCase());
	const cn = encodeURIComponent(collectorNumber.trim());
	const url = `https://api.scryfall.com/cards/${set}/${cn}`;

	try {
		const data = await fetchJson(url);
		return normalizeEmblemCard(data);
	} catch (err) {
		console.warn('Scryfall preset fetch failed', err);
		return null;
	}
}

/**
 * Searches Scryfall for Planechase Plane and Phenomenon cards (paper, black border).
 * Uses the canonical Planechase query: `(t:plane or t:phenomenon) game:paper border:black`.
 * @param {string} query Optional extra search terms to narrow the results.
 * @param {number} limit Maximum number of cards returned.
 * @returns {Promise<ScryfallEmblemCard[]>} Normalized list, or empty list on failure.
 */
export async function searchPlaneCards(query: string, limit = 200): Promise<ScryfallEmblemCard[]> {
	const clean = query?.trim() ?? '';
	const base = '(t:plane or t:phenomenon) game:paper border:black';
	const composed = clean.length > 0 ? `(${clean}) ${base}` : base;

	const q = encodeURIComponent(composed);
	const url = `https://api.scryfall.com/cards/search?q=${q}&order=name&unique=cards`;

	try {
		const data = await fetchJson(url);
		if (!data || !Array.isArray(data.data)) return [];

		const mapped = data.data
			.slice(0, limit)
			.map((c: any) => normalizeEmblemCard(c))
			.filter((card: ScryfallEmblemCard | null): card is ScryfallEmblemCard => card !== null);

		return mapped;
	} catch (err) {
		console.warn('Scryfall plane search failed', err);
		return [];
	}
}

export default {
	searchCards,
	randomCards,
	searchEmblemCards,
	searchVanguardCards,
	searchPlaneCards,
	fetchCardBySetCollector
};
