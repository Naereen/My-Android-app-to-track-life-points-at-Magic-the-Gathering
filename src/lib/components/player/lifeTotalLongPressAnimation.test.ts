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
