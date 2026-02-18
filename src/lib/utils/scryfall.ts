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

async function fetchJson(url: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Scryfall error ${res.status}`);
	return res.json();
}

function normalizeEmblemCard(c: any): ScryfallEmblemCard | null {
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

export async function searchCards(query: string, limit = 256): Promise<ScryfallCard[]> {
	if (!query || query.trim().length === 0) return [];
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
				cardImage = (face.image_uris && (face.image_uris.large || face.image_uris.normal || face.image_uris.small)) || null;
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

export async function randomCards(query: string, limit = 256): Promise<ScryfallCard[]> {
	if (!query || query.trim().length === 0) return [];
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
				cardImage = (face.image_uris && (face.image_uris.large || face.image_uris.normal || face.image_uris.small)) || null;
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

export async function searchEmblemCards(
	query: string,
	limit = 60,
	filter: 'emblem' | 'dungeon' | 'none' = 'emblem'
): Promise<ScryfallEmblemCard[]> {
	const clean = query?.trim() ?? '';

	let composed = clean;
	if (filter === 'emblem') {
		composed = clean.length > 0 ? `(${clean}) (t:emblem or t:dungeon)` : '(type:emblem -type:dungeon)';
	} else if (filter === 'dungeon') {
		composed = clean.length > 0 ? `(${clean}) t:dungeon unique:card` : 't:dungeon unique:card -(set:oafr or set:oclb)';
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

export async function searchVanguardCards(
	query: string,
	limit = 120
): Promise<ScryfallEmblemCard[]> {
	const clean = query?.trim() ?? '';
	const composed =
		clean.length > 0 ? `(${clean}) t:vanguard game:paper` : 't:vanguard game:paper';

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

export async function fetchCardBySetCollector(
	setCode: string,
	collectorNumber: string
): Promise<ScryfallEmblemCard | null> {
	if (!setCode || !collectorNumber) return null;

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

export default {
	searchCards,
	randomCards,
	searchEmblemCards,
	searchVanguardCards,
	fetchCardBySetCollector
};
