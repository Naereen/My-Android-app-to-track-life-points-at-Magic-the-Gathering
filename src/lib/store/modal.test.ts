import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import '../utils/i18n.js';
import {
	closeHistoryModal,
	handleHistoryModalBackNavigation,
	historyModalData,
	pushHistoryModalHistoryEntry
} from './modal';

describe('history modal browser-back handling', () => {
	beforeEach(() => {
		historyModalData.set({ isOpen: false });
		vi.restoreAllMocks();
		vi.stubGlobal('window', {
			history: {
				state: {},
				pushState: vi.fn(),
				back: vi.fn()
			},
			location: { href: 'http://localhost/' }
		});
	});

	it('pushes a synthetic browser-history entry and closes the modal on back navigation', () => {
		historyModalData.set({ isOpen: true });
		pushHistoryModalHistoryEntry();

		expect(window.history.pushState).toHaveBeenCalledWith(
			expect.objectContaining({ __mtgHistoryModalOpen: true }),
			'',
			window.location.href
		);

		closeHistoryModal();
		expect(window.history.back).toHaveBeenCalledTimes(1);

		handleHistoryModalBackNavigation();
		expect(get(historyModalData).isOpen).toBe(false);
	});
});
