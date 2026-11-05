import { fontFamilies, fontLookup, lists, listLookup, normalizeAscii, applyEffectSet, formatText } from "./unicode.js";

const INDENT_CHAR = "  ";
const elements = {
    editor: document.querySelector("#editor"),
    preview: document.querySelector("#preview"),
    styleToolbar: document.querySelector("#style-toolbar"),
    listToolbar: document.querySelector("#list-toolbar"),
    charCount: document.querySelector("#char-count"),
    wordCount: document.querySelector("#word-count"),
    lineCount: document.querySelector("#line-count"),
    normalizeText: document.querySelector("#normalize-text"),
    clearEditor: document.querySelector("#clear-editor"),
    copyButtons: document.querySelectorAll("#copy-output"),
    toast: document.querySelector("#toast")
};

function stripListPrefix(line) {
    return line.replace(
        /^(\s*)(?:(?:[-*•◦▪▸✓◆■→]|\d+[.)]|[A-Za-z]+[.)]|[ivxlcdmIVXLCDM]+[.)]|[①-⑳⓪])\s+)+/,
        "$1"
    );
}

const defaultFormatState = {
    fontId: "default",
    bold: false,
    strike: false,
    underline: false,
    doubleUnderline: false
};

let formatState = { ...defaultFormatState };
let selectionState = { start: 0, end: 0 };
let selectedListId = lists[0].id;
let toastTimer = 0;

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function getCurrentFont() {
    return fontLookup.get(formatState.fontId) ?? fontLookup.get(defaultFormatState.fontId);
}

function hasSelection() {
    return selectionState.end > selectionState.start;
}

function getSelectedText() {
    return elements.editor.value.slice(selectionState.start, selectionState.end);
}

function isPlainMode(state = formatState) {
    return state.fontId === "default" && !state.bold && !state.strike && !state.underline && !state.doubleUnderline;
}

function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = window.setTimeout(() => {
        elements.toast.classList.remove("visible");
    }, 1800);
}

function sanitizeFormatState(nextState) {
    const font = fontLookup.get(nextState.fontId) ?? fontLookup.get(defaultFormatState.fontId);
    const sanitized = {
        fontId: font.id,
        bold: Boolean(nextState.bold),
        strike: Boolean(nextState.strike),
        underline: Boolean(nextState.underline),
        doubleUnderline: Boolean(nextState.doubleUnderline)
    };

    if (!font.boldTransform) {
        sanitized.bold = false;
    }

    if (sanitized.underline && sanitized.doubleUnderline) {
        sanitized.underline = false;
    }

    if (!font.allowsEffects) {
        sanitized.strike = false;
        sanitized.underline = false;
        sanitized.doubleUnderline = false;
    }

    return sanitized;
}

function buildModeLabel() {
    const font = getCurrentFont();
    const parts = [font.label];

    if (formatState.bold && font.boldTransform) {
        parts.push("Bold");
    }

    if (formatState.strike) {
        parts.push("Strike");
    }

    if (formatState.underline) {
        parts.push("Underline");
    }

    if (formatState.doubleUnderline) {
        parts.push("Double underline");
    }

    if (parts.length === 1 && parts[0] === "Default") {
        return "Plain";
    }

    return parts.join(" + ");
}

function canEnableBold() {
    const font = getCurrentFont();
    if (!font.boldTransform) {
        return false;
    }

    if (!hasSelection()) {
        return true;
    }

    const selectedText = normalizeAscii(getSelectedText());
    return font.boldTransform(selectedText) !== selectedText;
}

function getBoldToggleExample() {
    return formatText(
        "Aa",
        sanitizeFormatState({
            ...formatState,
            bold: true,
            strike: false,
            underline: false,
            doubleUnderline: false
        })
    );
}

function updateToggleButton(button, isActive, isDisabled) {
    if (!button) {
        return;
    }

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = isDisabled;
}

function updateControlState() {
    if (!elements.fontSelect) {
        return;
    }

    const font = getCurrentFont();
    const selectedList = listLookup.get(selectedListId) ?? lists[0];
    const boldDisabled = !formatState.bold && !canEnableBold();
    const effectDisabled = !font.allowsEffects;

    elements.fontSelect.value = formatState.fontId;
    elements.listSelect.value = selectedList.id;
    elements.boldToggle.textContent = getBoldToggleExample();
    elements.strikeToggle.textContent = applyEffectSet("Aa", { strike: true, underline: false, doubleUnderline: false });
    elements.underlineToggle.textContent = applyEffectSet("Aa", { strike: false, underline: true, doubleUnderline: false });
    elements.doubleUnderlineToggle.textContent = applyEffectSet("Aa", { strike: false, underline: false, doubleUnderline: true });
    elements.decreaseIndentButton.disabled = !shouldOutdentSelection();

    updateToggleButton(elements.boldToggle, formatState.bold, boldDisabled);
    updateToggleButton(elements.strikeToggle, formatState.strike, effectDisabled);
    updateToggleButton(elements.underlineToggle, formatState.underline, effectDisabled);
    updateToggleButton(elements.doubleUnderlineToggle, formatState.doubleUnderline, effectDisabled);
}

function syncSelectionState() {
    selectionState = {
        start: elements.editor.selectionStart,
        end: elements.editor.selectionEnd
    };
    updateControlState();
}

function restoreSelection() {
    elements.editor.focus({ preventScroll: true });
    elements.editor.setSelectionRange(selectionState.start, selectionState.end);
}

function replaceRange(start, end, replacement, selectionMode = "select") {
    elements.editor.focus({ preventScroll: true });
    elements.editor.setSelectionRange(start, end);
    elements.editor.setRangeText(replacement, start, end, selectionMode);
    syncSelectionState();
    updateView();
}

function insertAtSelection(text) {
    const start = elements.editor.selectionStart;
    const end = elements.editor.selectionEnd;
    replaceRange(start, end, text, "end");
}

function resolveToastMessage(message) {
    return typeof message === "function" ? message() : message;
}

function applyFormattingChange(nextPartialState, messages) {
    formatState = sanitizeFormatState({ ...formatState, ...nextPartialState });
    updateControlState();

    if (hasSelection()) {
        replaceRange(selectionState.start, selectionState.end, formatText(getSelectedText(), formatState));
        showToast(resolveToastMessage(messages.selection));
        return;
    }

    restoreSelection();
    showToast(resolveToastMessage(messages.mode));
}

function getListOptionExample(list) {
    if (!list.formatter) {
        return "∅";
    }

    return list.formatter(0);
}

function getFontOptionLabel(font) {
    return font.regularTransform(normalizeAscii(font.label));
}

function getSelectedLineRange() {
    return getLineBoundaries(selectionState.start, hasSelection() ? selectionState.end : selectionState.start);
}

function shouldOutdentLines(lines) {
    return lines.length > 0 && lines.every((line) => line.startsWith(INDENT_CHAR));
}

function shouldOutdentSelection() {
    const { start, end } = getSelectedLineRange();
    return shouldOutdentLines(elements.editor.value.slice(start, end).split("\n"));
}

function getLineBoundaries(start, end) {
    const value = elements.editor.value;

    if (!value) {
        return { start: 0, end: 0 };
    }

    const lineStart = Math.max(value.lastIndexOf("\n", Math.max(0, start - 1)) + 1, 0);
    const lineEndIndex = value.indexOf("\n", end);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

    return { start: lineStart, end: lineEnd };
}

function applyList(listId) {
    const list = listLookup.get(listId);
    if (!list) {
        return;
    }

    if (!elements.editor.value.trim()) {
        const seedLines = ["First point", "Second point", "Third point"];
        const seeded = seedLines
            .map((line, index) => {
                if (!list.formatter) {
                    return line;
                }

                return `${list.formatter(index)} ${line}`;
            })
            .join("\n");

        replaceRange(0, 0, seeded, "end");
        showToast(`${list.label} inserted.`);
        return;
    }

    const { start, end } = getSelectedLineRange();
    const block = elements.editor.value.slice(start, end);
    const lines = block.split("\n");
    let visibleIndex = 0;

    const transformed = lines
        .map((line) => {
            if (!line.trim()) {
                return line;
            }

            const cleanLine = stripListPrefix(line);
            if (!list.formatter) {
                return cleanLine;
            }

            const marker = list.formatter(visibleIndex);
            visibleIndex += 1;
            return `${marker} ${cleanLine}`;
        })
        .join("\n");

    replaceRange(start, end, transformed);
    showToast(`${list.label} applied.`);
}

function increaseIndentSelection() {
    const { start, end } = getSelectedLineRange();
    const block = elements.editor.value.slice(start, end);
    const lines = block.split("\n");
    const transformed = lines
        .map((line) => `${INDENT_CHAR}${line}`)
        .join("\n");

    replaceRange(start, end, transformed);
    showToast("Indent increased.");
}

function decreaseIndentSelection() {
    const { start, end } = getSelectedLineRange();
    const block = elements.editor.value.slice(start, end);
    const lines = block.split("\n");

    if (!shouldOutdentLines(lines)) {
        restoreSelection();
        showToast("No indent to remove.");
        return;
    }

    const transformed = lines
        .map((line) => line.slice(INDENT_CHAR.length))
        .join("\n");

    replaceRange(start, end, transformed);
    showToast("Indent decreased.");
}

function updateCounts(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = text ? text.split("\n").length : 1;

    elements.charCount.textContent = String(text.length);
    elements.wordCount.textContent = String(words);
    elements.lineCount.textContent = String(lines);
}

function updateView() {
    const value = elements.editor.value;
    const display = value || "Your post preview will appear here.";

    elements.preview.textContent = display;
    updateCounts(value);
}

function renderStyleToolbar() {
    elements.styleToolbar.innerHTML = `
    <section class="tool-group compact-controls">
      <div class="tool-group-header">
        <div>
          <h3>Formatting</h3>
        </div>
      </div>
      <div class="control-row">
        <label class="control-field control-field-wide" for="font-select">
          <span class="field-label">Fonts</span>
          <select id="font-select" class="control-select">
            ${fontFamilies
            .map(
                (font) => `<option value="${font.id}">${escapeHtml(getFontOptionLabel(font))}</option>`
            )
            .join("")}
          </select>
        </label>
        <button id="bold-toggle" class="format-toggle" type="button" aria-pressed="false">𝐀𝐚</button>
        <button id="strike-toggle" class="format-toggle" type="button" aria-pressed="false">A̶a̶</button>
        <button id="underline-toggle" class="format-toggle" type="button" aria-pressed="false">A̲a̲</button>
        <button id="double-underline-toggle" class="format-toggle" type="button" aria-pressed="false">A̳a̳</button>
      </div>
    </section>
  `;
}

function renderListToolbar() {
    elements.listToolbar.innerHTML = `
    <section class="tool-group compact-controls">
      <div class="tool-group-header">
        <div>
          <h3>Lists</h3>
                    <p>Pick a marker style, then apply it or adjust indent on the selected lines.</p>
        </div>
      </div>
      <div class="list-row">
        <label class="control-field control-field-wide" for="list-select">
          <span class="field-label">List style</span>
          <select id="list-select" class="control-select">
            ${lists
            .map(
                (list) => `<option value="${list.id}">${escapeHtml(getListOptionExample(list))} ${escapeHtml(list.label)}</option>`
            )
            .join("")}
          </select>
        </label>
        <button id="apply-list" class="secondary-action compact-action" type="button">Apply list</button>
                <button id="increase-indent" class="secondary-action compact-action indent-action" type="button" aria-label="Increase indent" title="Increase indent">⇥</button>
                <button id="decrease-indent" class="secondary-action compact-action indent-action" type="button" aria-label="Decrease indent" title="Decrease indent">⇤</button>
      </div>
    </section>
  `;
}

function cacheDynamicElements() {
    elements.fontSelect = document.querySelector("#font-select");
    elements.boldToggle = document.querySelector("#bold-toggle");
    elements.strikeToggle = document.querySelector("#strike-toggle");
    elements.underlineToggle = document.querySelector("#underline-toggle");
    elements.doubleUnderlineToggle = document.querySelector("#double-underline-toggle");
    elements.listSelect = document.querySelector("#list-select");
    elements.applyList = document.querySelector("#apply-list");
    elements.increaseIndentButton = document.querySelector("#increase-indent");
    elements.decreaseIndentButton = document.querySelector("#decrease-indent");
}

async function copyOutput() {
    const text = elements.editor.value;

    if (!text) {
        showToast("Nothing to copy yet.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard.");
        restoreSelection();
        return;
    } catch {
        elements.editor.focus({ preventScroll: true });
        elements.editor.select();
        document.execCommand("copy");
        restoreSelection();
        showToast("Copied to clipboard.");
    }
}

function normalizeCurrentText() {
    if (hasSelection()) {
        replaceRange(selectionState.start, selectionState.end, normalizeAscii(getSelectedText()));
        showToast("Formatting removed from selection.");
        return;
    }

    elements.editor.value = normalizeAscii(elements.editor.value);
    syncSelectionState();
    updateView();
    showToast("Formatting removed from all text.");
}

function bindToolbarEvents() {
    [
        elements.boldToggle,
        elements.strikeToggle,
        elements.underlineToggle,
        elements.doubleUnderlineToggle,
        elements.applyList,
        elements.increaseIndentButton,
        elements.decreaseIndentButton
    ].forEach((button) => {
        button.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });
    });

    elements.fontSelect.addEventListener("change", (event) => {
        const font = fontLookup.get(event.target.value);
        if (!font) {
            return;
        }

        applyFormattingChange(
            { fontId: font.id },
            {
                selection: `${font.label} applied to selection.`,
                mode: () => `Format set to ${buildModeLabel()}.`
            }
        );
    });

    elements.boldToggle.addEventListener("click", () => {
        if (elements.boldToggle.disabled) {
            return;
        }

        const nextBold = !formatState.bold;
        applyFormattingChange(
            { bold: nextBold },
            {
                selection: nextBold ? "Bold applied to selection." : "Bold removed from selection.",
                mode: nextBold ? "Bold enabled for new text." : "Bold disabled for new text."
            }
        );
    });

    elements.strikeToggle.addEventListener("click", () => {
        if (elements.strikeToggle.disabled) {
            return;
        }

        const nextStrike = !formatState.strike;
        applyFormattingChange(
            { strike: nextStrike },
            {
                selection: nextStrike ? "Strike applied to selection." : "Strike removed from selection.",
                mode: nextStrike ? "Strike enabled for new text." : "Strike disabled for new text."
            }
        );
    });

    elements.underlineToggle.addEventListener("click", () => {
        if (elements.underlineToggle.disabled) {
            return;
        }

        const nextUnderline = !formatState.underline;
        applyFormattingChange(
            { underline: nextUnderline, doubleUnderline: nextUnderline ? false : formatState.doubleUnderline },
            {
                selection: nextUnderline ? "Underline applied to selection." : "Underline removed from selection.",
                mode: nextUnderline ? "Underline enabled for new text." : "Underline disabled for new text."
            }
        );
    });

    elements.doubleUnderlineToggle.addEventListener("click", () => {
        if (elements.doubleUnderlineToggle.disabled) {
            return;
        }

        const nextDoubleUnderline = !formatState.doubleUnderline;
        applyFormattingChange(
            { doubleUnderline: nextDoubleUnderline, underline: nextDoubleUnderline ? false : formatState.underline },
            {
                selection: nextDoubleUnderline
                    ? "Double underline applied to selection."
                    : "Double underline removed from selection.",
                mode: nextDoubleUnderline ? "Double underline enabled for new text." : "Double underline disabled for new text."
            }
        );
    });

    elements.listSelect.addEventListener("change", (event) => {
        selectedListId = event.target.value;
        updateControlState();
    });

    elements.applyList.addEventListener("click", () => {
        applyList(selectedListId);
    });

    elements.increaseIndentButton.addEventListener("click", () => {
        increaseIndentSelection();
    });

    elements.decreaseIndentButton.addEventListener("click", () => {
        decreaseIndentSelection();
    });
}

function bindEditorEvents() {
    elements.editor.addEventListener("input", () => {
        syncSelectionState();
        updateView();
    });

    ["click", "keyup", "select", "focus", "mouseup"].forEach((eventName) => {
        elements.editor.addEventListener(eventName, syncSelectionState);
    });

    elements.editor.addEventListener("beforeinput", (event) => {
        if (isPlainMode() || event.inputType !== "insertText" || !event.data) {
            return;
        }

        event.preventDefault();
        insertAtSelection(formatText(event.data, formatState));
    });

    elements.editor.addEventListener("paste", (event) => {
        if (isPlainMode()) {
            return;
        }

        event.preventDefault();
        const pastedText = event.clipboardData.getData("text/plain");
        insertAtSelection(formatText(pastedText, formatState));
    });
}

function bindEvents() {
    bindToolbarEvents();
    bindEditorEvents();

    elements.normalizeText.addEventListener("click", () => {
        normalizeCurrentText();
    });

    elements.clearEditor.addEventListener("click", () => {
        elements.editor.value = "";
        formatState = { ...defaultFormatState };
        syncSelectionState();
        updateView();
        updateControlState();
        showToast("Editor cleared.");
    });

    elements.copyButtons.forEach((button) => {
        button.addEventListener("click", () => {
            copyOutput();
        });
    });
}

function init() {
    for (const [name, element] of Object.entries(elements)) {
        if (!element || (element instanceof NodeList && element.length === 0)) {
            throw new Error(`Missing required UI element: ${name}`);
        }
    }
    renderStyleToolbar();
    renderListToolbar();
    cacheDynamicElements();
    bindEvents();
    syncSelectionState();
    updateView();
    updateControlState();
}

init();