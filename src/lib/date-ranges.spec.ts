import { describe, expect, it } from 'vitest';
import { get_date_range } from './date-ranges.js';

describe('UTC date ranges', () => {
	it.each([
		['today', '2026-09-07', '2026-09-07'],
		['yesterday', '2026-09-06', '2026-09-06'],
		['this_week', '2026-09-07', '2026-09-07'],
		['last_week', '2026-08-31', '2026-09-06'],
		['this_month', '2026-09-01', '2026-09-07'],
		['last_month', '2026-08-01', '2026-08-31'],
		['last_7_days', '2026-09-01', '2026-09-07'],
		['last_30_days', '2026-08-09', '2026-09-07'],
		['this_year', '2026-01-01', '2026-09-07'],
	])('%s has inclusive bounds', (option, since, until) => {
		expect(
			get_date_range(
				option,
				new Date('2026-09-07T23:30:00Z'),
				'',
				'',
				'',
			),
		).toEqual({ calculated_since: since, calculated_until: until });
	});
	it.each([
		['last_month', '2024-03-01', '2024-02-01', '2024-02-29'],
		['last_month', '2026-01-01', '2025-12-01', '2025-12-31'],
		['this_week', '2026-09-06', '2026-08-31', '2026-09-06'],
		['last_7_days', '2026-01-02', '2025-12-27', '2026-01-02'],
	])('%s handles boundary at %s', (option, date, since, until) => {
		expect(
			get_date_range(
				option,
				new Date(`${date}T00:00:00Z`),
				'',
				'',
				'',
			),
		).toEqual({ calculated_since: since, calculated_until: until });
	});
	it('uses the UTC date even when the clock has a different offset', () => {
		expect(
			get_date_range(
				'today',
				new Date('2026-09-08T01:00:00+02:00'),
				'',
				'',
				'',
			),
		).toEqual({
			calculated_since: '2026-09-07',
			calculated_until: '2026-09-07',
		});
	});
	it('preserves custom ranges and full specified years', () => {
		expect(
			get_date_range(
				'custom',
				new Date(),
				'',
				'2025-12-30',
				'2026-01-03',
			),
		).toEqual({
			calculated_since: '2025-12-30',
			calculated_until: '2026-01-03',
		});
		expect(
			get_date_range('year', new Date(), '2024', '', ''),
		).toEqual({
			calculated_since: '2024-01-01',
			calculated_until: '2024-12-31',
		});
	});
});
