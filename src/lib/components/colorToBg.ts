/**
 * Converts a supported color keyword into a deterministic hex color.
 * @param {string} n Stored color name from player settings.
 * @returns {string} Hex color string; defaults to white for unknown names.
 */
const nameToHex = (n: string) => {
	switch (n.trim()) {
		case 'mud':
			return '#704214';
		case 'metalicgray':
			return '#6e7f80';
		case 'gold':
			return '#FFB700';
		case 'purple':
			return '#6600ff';
		case 'pink':
			return '#ff69b4';
		case 'orange':
			return '#ff8c00';
		case 'lightgreen':
			return '#90ee90';
		case 'blue':
			return '#0000BB';
		case 'black':
			return '#202020';
		case 'red':
			return '#BB0000';
		case 'green':
			return '#00BB00';
		case 'white':
		default:
			return '#ffffff';
	}
};

/**
 * Converts stored color selection into a CSS background value.
 * Supports single colors and comma-separated multi-color gradients.
 * @param {string} c Color token (`red`) or list (`red,blue`).
 * @returns {string} Hex color or `linear-gradient(...)` CSS value.
 */
const colorToBg = (c: string) => {
	if (!c) return nameToHex('white');

	// support gradients encoded as comma-separated color names
	if (c.includes(',')) {
		const parts = c.split(',').map((p) => nameToHex(p));
		// produce a smooth linear gradient, from left bottom to right top
		return `linear-gradient(to right top, ${parts.join(', ')})`;
	}

	// single color name
	return nameToHex(c);
};

export { colorToBg };
