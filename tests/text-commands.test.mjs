import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLineBoundaries, transformList, transformInsertion } from '../text-commands.js';

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

test('list conversion preserves prose, indentation and nested body prefixes', () => {
    assert.equal(transformList('Hello. world', null), 'Hello. world');
    assert.equal(transformList('1. 2. version', null), '2. version');
    assert.equal(transformList('  1. nested\n\tII. other\n \n  a. last', () => '•'), '  • nested\n\t• other\n \n  • last');
    assert.equal(transformList('  • nested', null), '  nested');
    assert.equal(transformList('Hello. world', () => '•'), '• Hello. world');
});

test('committed replacement formats only inserted text and remaps the caret', () => {
    const before = { text: 'keep old tail', start: 5, end: 8 };
    const after = { text: 'keep new tail', start: 8, end: 8 };
    assert.deepEqual(transformInsertion(before, after, s => s.toUpperCase()), { text: 'keep NEW tail', start: 8, end: 8 });
    assert.deepEqual(transformInsertion({ text: 'a', start: 1, end: 1 }, { text: 'ab', start: 2, end: 2 }, s => s === 'b' ? '𝐛' : s), { text: 'a𝐛', start: 3, end: 3 });
});
