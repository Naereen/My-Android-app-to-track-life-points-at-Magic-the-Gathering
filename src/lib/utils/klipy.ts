// Utils for Klipy GIF search API integration, used in the player data modal when searching for a GIF background. See issue #13.
// https://github.com/Naereen/My-Android-app-to-track-life-points-at-Magic-the-Gathering/issues/13

import { getLocaleFromNavigator } from 'svelte-i18n';

export type KlipyResult = {
    id: string;
    title: string;
    url: string; // GIF URL
    preview?: string;
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
        // These parameters are based on Klipy API docs and examples; adjust as needed
        const page = 1;  // pagination support; can be extended to allow fetching more results
        const per_page = 5;  // number of results per page; adjust based on UI needs and API limits

        // for Klipy analytics; can be any string but should be consistent
        const customer_id = "Naereen's MTG Life Counter";
        // for Klipy analytics; can be dynamic based on user locale if desired
        const country_code = getLocaleFromNavigator();

        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", `Bearer ${key}`);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            // redirect: 'follow', // default is follow, can be set explicitly if needed
        };


        // Klipy API format: use a simple search endpoint. If unavailable, this will fail gracefully.
        const url = `https://api.klipy.com/api/v1/${key}/gifs/search?page=${page}&per_page=${per_page}&customer_id=${customer_id}&locale=${country_code}&q=${encodeURIComponent(q)}`;
        const resp = await fetch(url, requestOptions);
        if (!resp.ok) {
            console.error("Klipy API error", resp.status, await resp.text());
            return [];
        } else {
            console.log("Klipy API success", resp.status);
        }

        const data = await resp.json();

        // Map to KlipyResult; structure depends on API but we try common fields
        // Normalize response: Klipy may return an object or an array.
        let raw = Array.isArray(data?.data?.data) ? data?.data?.data : [];

        console.log("Raw data:", raw);

        const results = (raw as any[]).map((it: any) => ({
            id: it?.id ?? it?.uuid ?? JSON.stringify(it),
            title: it?.title ?? it?.slug ?? q,
            url: it?.file?.hd?.webp?.url ?? it?.file?.hd?.gif?.url ?? it?.file?.hd?.jpg?.url ?? it?.file?.hd?.mp4?.url
                ?? it?.file?.md?.webp?.url ?? it?.file?.md?.gif?.url ?? it?.file?.md?.jpg?.url ?? it?.file?.md?.mp4?.url
                ?? it?.file?.sm?.webp?.url ?? it?.file?.sm?.gif?.url ?? it?.file?.sm?.jpg?.url ?? it?.file?.sm?.mp4?.url
                ?? it?.file?.xs?.webp?.url ?? it?.file?.xs?.gif?.url ?? it?.file?.xs?.jpg?.url ?? it?.file?.xs?.mp4?.url
                ?? null,
        }))
        .map((it: any) => ({
            id: it.id,
            title: it.title,
            url: it.url,
            preview: it.url, // Klipy may not provide a separate preview; using the same URL for simplicity
        }))
        .filter((r: KlipyResult) => true) as KlipyResult[];

        console.log("Klipy search results", results);
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
