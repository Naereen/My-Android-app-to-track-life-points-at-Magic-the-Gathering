export type ScryfallCard = {
	id: string;
	name: string;
	set_name?: string;
	artist?: string;
	image?: string | null;
	cardImage?: string | null;
};

async function fetchJson(url: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Scryfall error ${res.status}`);
	return res.json();
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

export default { searchCards, randomCards };
