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

/**
 * Wraps each digit '6' and '9' in the string representation of a number
 * with an underline span, so that 6 and 9 are visually distinguishable.
 * @param {number | string} value The numeric value to format.
 * @returns {string} HTML string with 6/9 digits underlined.
 */
export function formatWithUnderlineSixNine(value: number | string): string {
	return String(value)
		.split('')
		.map((ch) =>
			ch === '6' || ch === '9'
				? `<span style="text-decoration:underline;text-underline-offset:0.1em;">${ch}</span>`
				: ch
		)
		.join('');
}

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
