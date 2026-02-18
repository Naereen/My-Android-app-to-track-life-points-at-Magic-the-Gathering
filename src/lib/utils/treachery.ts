import type { ScryfallEmblemCard } from './scryfall';

export type TreacheryRole = 'leader' | 'guardian' | 'assassin' | 'traitor';

type TreacheryCatalogJson = Record<TreacheryRole, Array<{ id: number; slug: string; name: string }>>;

export type TreacheryCatalogEntry = {
	id: number;
	slug: string;
	name: string;
	role: TreacheryRole;
};

export type TreacheryCard = ScryfallEmblemCard & {
	cardId: number;
	slug: string;
	role: TreacheryRole;
	rarity?: string;
	oracleRaw?: string;
};

const TREACHERY_ORACLE_URL = 'https://mtgtreachery.net/rules/oracle/';
const TREACHERY_CATALOG_URL = '/treachery-card-names.json';
const TREACHERY_IMAGE_BASE_URL = 'https://mtgtreachery.net/images/cards/en/trd/';

let cachedCatalog: TreacheryCatalogEntry[] | null = null;
let catalogPromise: Promise<TreacheryCatalogEntry[]> | null = null;

const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

const roleOrder: TreacheryRole[] = ['leader', 'guardian', 'assassin', 'traitor'];

const roleLabelForImage = (role: TreacheryRole): string => {
	switch (role) {
		case 'leader':
			return 'Leader';
		case 'guardian':
			return 'Guardian';
		case 'assassin':
			return 'Assassin';
		case 'traitor':
			return 'Traitor';
		default:
			return 'Leader';
	}
};

const buildTreacheryImageUrl = (
	cardId: number,
	role: TreacheryRole,
	cardName: string,
	strategy: 'encode-all' | 'space-only' | 'raw' = 'encode-all'
): string | null => {
	const idNum = Number(cardId);
	if (!Number.isFinite(idNum)) return null;

	const idPart = String(Math.trunc(idNum)).padStart(3, '0');
	const rolePart = roleLabelForImage(role);
	const safeName = normalizeWhitespace(cardName);
	const fileName = `${idPart} - ${rolePart} - ${safeName}.jpg`;

	if (strategy === 'raw') {
		return `${TREACHERY_IMAGE_BASE_URL}${fileName}`;
	}

	if (strategy === 'space-only') {
		return `${TREACHERY_IMAGE_BASE_URL}${fileName.replace(/ /g, '%20')}`;
	}

	return `${TREACHERY_IMAGE_BASE_URL}${encodeURIComponent(fileName)}`;
};

const slugToName = (slug: string) =>
	normalizeWhitespace(
		slug
			.split('-')
			.filter(Boolean)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ')
	);

const nameVariants = (name: string, slug: string): string[] => {
	const base = normalizeWhitespace(name);
	const apostropheNormalized = base.replace(/[’‘`´]/g, "'");
	const noApostrophe = apostropheNormalized.replace(/[']/g, '');
	const aeExpanded = apostropheNormalized.replace(/Æ/g, 'AE').replace(/æ/g, 'ae');
	const aeExpandedNoApostrophe = aeExpanded.replace(/[']/g, '');
	const asciiLike = aeExpandedNoApostrophe.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
	const slugName = slugToName(slug);

	const variants = [
		base,
		apostropheNormalized,
		noApostrophe,
		aeExpanded,
		aeExpandedNoApostrophe,
		asciiLike,
		slugName
	].map((value) => normalizeWhitespace(value));

	return Array.from(new Set(variants.filter((value) => value.length > 0)));
};

export const getTreacheryImageCandidates = (
	cardId: number,
	role: TreacheryRole,
	cardName: string,
	slug: string
): string[] => {
	const candidates: string[] = [];
	const strategies: Array<'encode-all' | 'space-only' | 'raw'> = ['encode-all', 'space-only', 'raw'];

	for (const variant of nameVariants(cardName, slug)) {
		for (const strategy of strategies) {
			const built = buildTreacheryImageUrl(cardId, role, variant, strategy);
			if (built) candidates.push(built);
		}
	}

	return Array.from(new Set(candidates));
};

const normalizeTreacheryCard = (entry: TreacheryCatalogEntry): TreacheryCard => {
	const cleanName = normalizeWhitespace(entry.name);
	const slug = entry.slug;
	const role = entry.role;
	const typeLine = `Identity — ${roleLabelForImage(role)}`;
	const imageCandidates = getTreacheryImageCandidates(entry.id, role, cleanName, slug);
	const image = imageCandidates[0] ?? null;

	return {
		id: `treachery:${slug}`,
		cardId: entry.id,
		slug,
		role,
		name: cleanName,
		set_name: 'MTG Treachery',
		scryfall_uri: `${TREACHERY_ORACLE_URL}?card=${slug}`,
		faces: [
			{
				name: cleanName,
				image,
				oracleText: '',
				typeLine
			}
		]
	};
};

export const getRequiredTreacheryRoleCounts = (playerCount: number) => {
	switch (playerCount) {
		case 4:
			return { leader: 1, traitor: 1, assassin: 2, guardian: 0 } as const;
		case 5:
			return { leader: 1, traitor: 1, assassin: 2, guardian: 1 } as const;
		case 6:
			return { leader: 1, traitor: 1, assassin: 3, guardian: 1 } as const;
		default:
			return null;
	}
};

export const loadTreacheryCatalog = async (): Promise<TreacheryCatalogEntry[]> => {
	if (cachedCatalog) return cachedCatalog;
	if (catalogPromise) return catalogPromise;

	catalogPromise = (async () => {
		try {
			const res = await fetch(TREACHERY_CATALOG_URL);
			if (!res.ok) return [];
			const json = (await res.json()) as TreacheryCatalogJson;
			const entries: TreacheryCatalogEntry[] = [];
			for (const role of roleOrder) {
				for (const card of json[role] ?? []) {
					const cardId = Number((card as any).id);
					if (!Number.isFinite(cardId)) {
						continue;
					}
					entries.push({
						id: cardId,
						slug: card.slug,
						name: normalizeWhitespace(card.name),
						role
					});
				}
			}
			cachedCatalog = entries;
			return entries;
		} catch (error) {
			console.warn('Failed to load treachery card catalog', error);
			return [];
		} finally {
			catalogPromise = null;
		}
	})();

	return catalogPromise;
};

export const searchTreacheryCards = async (
	query: string,
	limit = 80
): Promise<TreacheryCatalogEntry[]> => {
	const allCards = await loadTreacheryCatalog();
	const clean = normalizeWhitespace(query || '').toLowerCase();
	if (!clean) return allCards.slice(0, limit);

	return allCards
		.filter((card) => card.name.toLowerCase().includes(clean) || card.slug.includes(clean))
		.slice(0, limit);
};

export const fetchTreacheryCardBySlug = async (
	entry: TreacheryCatalogEntry
): Promise<TreacheryCard> => {
	return normalizeTreacheryCard(entry);
};
