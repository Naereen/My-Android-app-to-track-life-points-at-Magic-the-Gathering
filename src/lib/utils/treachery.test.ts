import { describe, expect, it } from 'vitest';
import {
	getRequiredTreacheryRoleCounts,
	getTreacheryImageCandidates,
	getTreacheryRoleTranslationKey
} from './treachery';

describe('treachery role translation keys', () => {
	it('uses the shogun leader label only for the shogun variant', () => {
		expect(getTreacheryRoleTranslationKey('leader', false)).toBe('treachery_role_leader');
		expect(getTreacheryRoleTranslationKey('leader', true)).toBe('shogun_role_leader');
	});

	it('keeps the shared translation keys for the other roles', () => {
		expect(getTreacheryRoleTranslationKey('assassin', true)).toBe('treachery_role_assassin');
		expect(getTreacheryRoleTranslationKey('guardian', false)).toBe('treachery_role_guardian');
		expect(getTreacheryRoleTranslationKey(null, false)).toBeNull();
	});
});

describe('treachery role counts', () => {
	it('returns the expected role distribution for supported player counts', () => {
		expect(getRequiredTreacheryRoleCounts(4)).toEqual({
			leader: 1,
			traitor: 1,
			assassin: 2,
			guardian: 0
		});
		expect(getRequiredTreacheryRoleCounts(5)).toEqual({
			leader: 1,
			traitor: 1,
			assassin: 2,
			guardian: 1
		});
		expect(getRequiredTreacheryRoleCounts(6)).toEqual({
			leader: 1,
			traitor: 1,
			assassin: 3,
			guardian: 1
		});
	});

	it('returns null for unsupported player counts', () => {
		expect(getRequiredTreacheryRoleCounts(3)).toBeNull();
		expect(getRequiredTreacheryRoleCounts(7)).toBeNull();
	});
});

describe('treachery image candidate generation', () => {
	it('builds URL candidates across encoding variants and name normalizations', () => {
		const candidates = getTreacheryImageCandidates(7, 'leader', "Æther's Rage", 'aethers-rage');

		expect(candidates).toContain(
			"https://mtgtreachery.net/images/cards/en/trd/007%20-%20Leader%20-%20%C3%86ther's%20Rage.jpg"
		);
		expect(candidates).toContain(
			"https://mtgtreachery.net/images/cards/en/trd/007%20-%20Leader%20-%20AEther's%20Rage.jpg"
		);
		expect(candidates).toContain(
			'https://mtgtreachery.net/images/cards/en/trd/007 - Leader - Aethers Rage.jpg'
		);
	});

	it('returns no candidates for invalid card identifiers', () => {
		expect(getTreacheryImageCandidates(Number.NaN, 'traitor', 'Hidden Agenda', 'hidden-agenda')).toEqual(
			[]
		);
	});
});
