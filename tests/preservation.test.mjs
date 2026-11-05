import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fontFamilies, formatText } from '../unicode.js';

test('case-folding styles preserve unsupported natural-language characters', () => {
    for (const font of fontFamilies) {
        assert.equal(formatText('é ß α β ρ σ 🇨🇭 ❤️', { fontId: font.id }), 'é ß α β ρ σ 🇨🇭 ❤️', font.id);
    }
});
