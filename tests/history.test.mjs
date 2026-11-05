import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EditHistory } from '../history.js';

const doc = text => ({ text, start: text.length, end: text.length });
test('typing groups by time and caret continuity; commands remain separate', () => {
    const history = new EditHistory();
    history.record(doc(''), doc('a'), 'typing', 0);
    history.record(doc('a'), doc('ab'), 'typing', 100);
    history.record(doc('ab'), doc('AB'), null, 200);
    assert.deepEqual(history.undo(), doc('ab'));
    assert.deepEqual(history.undo(), doc(''));
    assert.deepEqual(history.redo(), doc('ab'));
    history.record(doc('ab'), doc('abc'), 'typing', 300);
    assert.equal(history.canRedo, false, 'new edit discards the abandoned branch');
    assert.deepEqual(history.undo(), doc('ab'));
});
test('history bounds retained edits and separates pauses and moved selections', () => {
    const history = new EditHistory();
    history.record(doc(''), doc('a'), 'typing', 0);
    history.record(doc('a'), doc('ab'), 'typing', 1000);
    assert.deepEqual(history.undo(), doc('a'));
    const bounded = new EditHistory();
    for (let i = 0; i < 105; i++) bounded.record(doc(String(i)), doc(String(i + 1)));
    for (let i = 0; i < 100; i++) assert.ok(bounded.undo());
    assert.equal(bounded.undo(), null);
    assert.equal(bounded.canUndo, false);
});
