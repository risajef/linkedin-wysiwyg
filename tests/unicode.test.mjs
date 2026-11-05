import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeAscii, formatText } from '../unicode.js';

const plain = { fontId: 'default', bold: false };
test('formatting preserves natural letters, emoji and unrelated combining marks', () => {
    const original = 'Café Zürich naïve straße α β ρ σ 🇨🇭 ❤️ e\u0301 ᴬ ᵃ ①';
    assert.equal(normalizeAscii(original), original);
    assert.equal(formatText(original, plain), original);
    assert.equal(formatText('Café 🇨🇭 ❤️', { ...plain, bold: true }), '𝐂𝐚𝐟é 🇨🇭 ❤️');
    assert.equal(formatText('e\u0301', { ...plain, underline: true }), 'e\u0301\u0332');
});
test('supported decorative letters and editor effects can be removed', () => {
    assert.equal(normalizeAscii('𝐇𝐞𝐥𝐥𝐨 𝟏𝟐𝟑'), 'Hello 123');
    assert.equal(normalizeAscii('a\u0332\u0336 é e\u0301'), 'a é e\u0301');
    assert.equal(formatText('𝐀', { ...plain, bold: true }), '𝐀');
});
