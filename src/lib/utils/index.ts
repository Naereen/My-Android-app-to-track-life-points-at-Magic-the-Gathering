import { dev } from '$app/environment';

/**
 * Returns an image URL/source set value for rendering card assets.
 * Optimization is currently disabled, so this function simply returns a local relative path.
 * @param {string} src Source image path.
 * @param {number[]} widths Candidate widths for srcset generation (reserved for future usage).
 * @param {number} quality Target compression quality (reserved for future usage).
 * @returns {string} Relative URL used directly by the client.
 */
export function optimize(src: string, widths = [640, 960, 1280], quality = 90) {
	return './' + src; // XXX: Disable optimization for now
	// if (dev) return src;

	/* Generate a srcset attribute value for Vercel's image optimization */
	/* See https://vercel.com/docs/concepts/edge-network/image-optimization */
	/*
	return widths
		.slice()
		.sort((a, b) => a - b)
		.map((width, i) => {
			const url = `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
			const descriptor = i < widths.length - 1 ? ` ${width}w` : '';
			return url + descriptor;
		})
		.join(', ');
	*/
}
