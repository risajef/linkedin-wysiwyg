// Selections use the textarea contract: start inclusive, end exclusive.
export function getLineBoundaries(text, start, end) {
    const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    const lastSelected = end > start ? end - 1 : start;
    const nextNewline = text.indexOf('\n', lastSelected);
    return { start: lineStart, end: nextNewline === -1 ? text.length : nextNewline };
}

export function parseListLine(line) {
    const indent = line.match(/^[ \t]*/)[0];
    const content = line.slice(indent.length);
    const marker = content.match(/^(?:[-*•◦▪▸✓◆■→]|\d+[.)]|[A-Za-z][.)]|[IVXLCDM]+[.)]|[①-⑳⓪])[ \t]+/);
    const token = marker?.[0].trim().slice(0, -1);
    if (/^[IVXLCDM]{2,}$/.test(token ?? "")
        && !/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(token)) {
        return { indent, body: content };
    }
    // Strip one recognized marker only; repeated prefixes may be body text.
    return { indent, body: marker ? content.slice(marker[0].length) : content };
}

export function transformList(block, formatter) {
    let index = 0;
    return block.split('\n').map(line => {
        if (!line.trim()) return line;
        const { indent, body } = parseListLine(line);
        return indent + (formatter ? `${formatter(index++)} ` : '') + body;
    }).join('\n');
}

// Format the committed insertion only, retaining the surrounding document.
export function transformInsertion(before, after, transform) {
    let start = before.start;
    let suffix = before.text.slice(before.end);
    if (!after.text.startsWith(before.text.slice(0, start)) || !after.text.endsWith(suffix)
        || after.text.length < start + suffix.length) {
        // Some replacements (autocorrect/drop) affect more than the old selection.
        const oldChars = Array.from(before.text);
        const newChars = Array.from(after.text);
        let prefixCount = 0, suffixCount = 0;
        while (prefixCount < Math.min(oldChars.length, newChars.length)
            && oldChars[prefixCount] === newChars[prefixCount]) prefixCount++;
        while (suffixCount < Math.min(oldChars.length, newChars.length) - prefixCount
            && oldChars.at(-1 - suffixCount) === newChars.at(-1 - suffixCount)) suffixCount++;
        start = newChars.slice(0, prefixCount).join('').length;
        suffix = suffixCount ? newChars.slice(-suffixCount).join('') : '';
    }
    const end = after.text.length - suffix.length;
    const inserted = after.text.slice(start, end);
    const formatted = transform(inserted);
    const offset = position => position <= start ? position
        : position >= end ? position + formatted.length - inserted.length
        : start + transform(inserted.slice(0, position - start)).length;
    return { text: after.text.slice(0, start) + formatted + suffix, start: offset(after.start), end: offset(after.end) };
}
