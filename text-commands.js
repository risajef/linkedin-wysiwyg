// Selections use the textarea contract: start inclusive, end exclusive.
export function getLineBoundaries(text, start, end) {
    const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
    const lastSelected = end > start ? end - 1 : start;
    const nextNewline = text.indexOf('\n', lastSelected);
    return { start: lineStart, end: nextNewline === -1 ? text.length : nextNewline };
}
