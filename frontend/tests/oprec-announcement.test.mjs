import assert from 'node:assert/strict';
import test from 'node:test';
import { countdownParts, fromWibInput, toWibInput, formatAnnouncementDate } from '../src/lib/oprecAnnouncement.mjs';

test('countdown handles second, minute, day and expiry boundaries without negative digits', () => {
  const values = (ms) => countdownParts(ms).map(([value]) => value);
  assert.deepEqual(values(90061000), [1, 1, 1, 1]);
  assert.deepEqual(values(60000), [0, 0, 1, 0]);
  assert.deepEqual(values(1), [0, 0, 0, 1]);
  for (const ms of [0, -1, NaN]) assert.deepEqual(values(ms), [0, 0, 0, 0]);
});
test('schedule converts WIB explicitly independent of browser timezone', () => {
  assert.equal(fromWibInput('2026-10-01T13:00'), '2026-10-01T06:00:00.000Z');
  assert.equal(toWibInput('2026-10-01T06:00:00Z'), '2026-10-01T13:00');
  assert.equal(toWibInput(null), '');
  assert.match(formatAnnouncementDate('2026-10-01T06:00:00Z'), /13[.:]00 WIB/);
  assert.throws(() => fromWibInput('not-a-date'));
});
