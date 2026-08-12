import { describe, expect, it } from 'vitest';
import { getTreacheryRoleTranslationKey } from './treachery';

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
