export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Older browsers and denied permissions can still support a user-gesture copy.
    }

    const active = document.activeElement;
    const selection = active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement
        ? [active.selectionStart, active.selectionEnd, active.selectionDirection] : null;
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.setAttribute('aria-label', 'Copy buffer');
    temporary.style.cssText = 'position:fixed;left:-10000px;top:0;';
    try {
        document.body.append(temporary);
        temporary.select();
        return document.execCommand('copy') === true;
    } catch {
        return false;
    } finally {
        temporary.remove();
        active?.focus({ preventScroll: true });
        if (selection) active.setSelectionRange(...selection);
    }
}
