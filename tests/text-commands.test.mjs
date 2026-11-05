import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLineBoundaries } from '../text-commands.js';

test('line selection excludes the line at an exclusive end boundary', () => {
    assert.deepEqual(getLineBoundaries('a\nb\nc', 0, 2), { start: 0, end: 1 });
    assert.deepEqual(getLineBoundaries('a\nb\nc', 0, 3), { start: 0, end: 3 });
    assert.deepEqual(getLineBoundaries('a\nb\nc', 2, 2), { start: 2, end: 3 });
});
test('empty lines at either document boundary produce valid ranges', () => {
    assert.deepEqual(getLineBoundaries('\nalpha', 0, 0), { start: 0, end: 0 });
    assert.deepEqual(getLineBoundaries('alpha\n', 6, 6), { start: 6, end: 6 });
    assert.deepEqual(getLineBoundaries('', 0, 0), { start: 0, end: 0 });
});
