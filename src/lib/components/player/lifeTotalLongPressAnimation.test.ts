import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '../../../..');

const readRepoFile = (relativePath: string) =>
	readFileSync(resolve(repoRoot, relativePath), 'utf-8');

describe('long-press life total animation wiring', () => {
	it('defines the vibration animation class and keyframes in global CSS', () => {
		const css = readRepoFile('src/app.css');
		expect(css).toContain('.life-total-longpress-vibrate');
		expect(css).toContain('@keyframes life-total-longpress-vibrate');
	});

	it('vibration keyframes use standalone translate property (not transform: translateX) to preserve element rotation', () => {
		const css = readRepoFile('src/app.css');
		// Extract the keyframes block
		const keyframesStart = css.indexOf('@keyframes life-total-longpress-vibrate');
		expect(keyframesStart).toBeGreaterThan(-1);
		const keyframesBlock = css.slice(keyframesStart, css.indexOf('}', css.indexOf('}', keyframesStart) + 1) + 1);
		// Must use standalone `translate` property so that `transform: rotate()` from
		// orientation classes (e.g. `-rotate-180` for `orientation === 'left'`) is not overridden.
		expect(keyframesBlock).toContain('translate:');
		expect(keyframesBlock).not.toContain('transform: translateX');
	});

	it('applies vibration class on long-press +10/-10 steps in vertical player UI', () => {
		const vertical = readRepoFile('src/lib/components/player/PlayerVertical.svelte');
		expect(vertical).toContain('class:life-total-longpress-vibrate={lifeTotalVibrate}');
		expect(vertical).toContain('const applyLongPressLifeStep');
	});

	it('applies vibration class on long-press +10/-10 steps in horizontal player UI', () => {
		const horizontal = readRepoFile('src/lib/components/player/PlayerHorizontal.svelte');
		expect(horizontal).toContain('class:life-total-longpress-vibrate={lifeTotalVibrate}');
		expect(horizontal).toContain('const applyLongPressLifeStep');
	});
});
