import { getLocaleFromNavigator } from 'svelte-i18n';


export type KlipyResult = {
    id: string;
    title: string;
    url: string; // gif url
    preview?: string;
    provider?: string;
};

const readKey = async (): Promise<string | null> => {
    try {
        // Prefer vite env variable when building
        // @ts-ignore
        const envKey = import.meta.env?.VITE_KLIPY_API_KEY;
        if (envKey) return envKey;
    } catch {}

    try {
        // Try to fetch a key placed in the app root (e.g. static/klipy_api.key)
        const resp = await fetch('klipy_api.key');
        if (resp.ok) {
            const txt = (await resp.text()).trim();
            if (txt) return txt;
        }
    } catch (e) {
        // ignore
    }

    return null;
};

export const searchGifs = async (q: string): Promise<KlipyResult[]> => {
    const key = await readKey();
    if (!key) return [];

    try {
        const page = 1;
        const per_page = 24;
        // for Klipy analytics; can be any string but should be consistent
        const customer_id = "Naereen's MTG Life Counter";
        // for Klipy analytics; can be dynamic based on user locale if desired
        const country_code = getLocaleFromNavigator();

        // Klipy API format: use a simple search endpoint. If unavailable, this will fail gracefully.
        const url = `https://api.klipy.com/api/v1/${key}/gifs/search?page=${page}&per_page=${per_page}&customer_id=${customer_id}&q=${encodeURIComponent(q)}&locale=${country_code}`;
        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${key}`
            }
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        // Map to KlipyResult; structure depends on API but we try common fields
        const results = (data?.results || data?.data || []).map((it: any) => ({
            id: it.id ?? it.uuid ?? JSON.stringify(it),
            title: it.title ?? it.slug ?? q,
            url: it.media?.gif?.url ?? it.images?.original?.url ?? it.url ?? it.preview?.url ?? null,
            preview: it.preview?.url ?? it.images?.preview?.url ?? null,
            provider: it.source ?? it.provider ?? 'klipy'
        })).filter((r: KlipyResult) => !!r.url) as KlipyResult[];

        return results;
    } catch (err) {
        console.warn('Klipy search failed', err);
        return [];
    }
};

export const searchGifsFallback = async (q: string): Promise<KlipyResult[]> => {
    // Generic fallback that returns empty list; reserved for future providers (Tenor/Giphy)
    return [];
};
