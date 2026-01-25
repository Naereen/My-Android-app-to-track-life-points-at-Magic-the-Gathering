import { dev } from '$app/environment';

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
