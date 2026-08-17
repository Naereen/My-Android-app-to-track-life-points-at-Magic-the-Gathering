import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const localesDir = join(process.cwd(), 'src', 'locales');

const readLocale = (fileName: string) =>
	JSON.parse(readFileSync(join(localesDir, fileName), 'utf-8')) as Record<string, string>;

describe('locale files', () => {
	it('keep all non-English locales in sync with English keys', () => {
		const englishKeys = Object.keys(readLocale('en.json'));
		const localeFiles = readdirSync(localesDir)
			.filter((fileName) => fileName.endsWith('.json') && fileName !== 'en.json')
			.sort();

		for (const localeFile of localeFiles) {
			const localeKeys = new Set(Object.keys(readLocale(localeFile)));
			const missingKeys = englishKeys.filter((key) => !localeKeys.has(key));

			expect(missingKeys, `${localeFile} is missing English translation keys`).toEqual([]);
		}
	});
});
