import { describe, expect, it } from 'vitest';
import de from './de.json';
import es from './es.json';
import itLocale from './it.json';
import pt from './pt.json';

describe('history_stats_open_button translations', () => {
	it('defines localized strings for es, it, de and pt', () => {
		expect(es.history_stats_open_button).toBe('📊 Estadísticas multi-partida');
		expect(itLocale.history_stats_open_button).toBe('📊 Statistiche multi-partita');
		expect(de.history_stats_open_button).toBe('📊 Spielübergreifende Statistiken');
		expect(pt.history_stats_open_button).toBe('📊 Estatísticas de múltiplas partidas');
	});
});
