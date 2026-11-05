import assert from 'node:assert/strict';
import { test } from 'node:test';
import { transformList } from '../text-commands.js';

test('Roman marker detection preserves words made from Roman numeral letters', () => {
    assert.equal(transformList('CIVIL. society', null), 'CIVIL. society');
    assert.equal(transformList('II. second', null), 'second');
});
