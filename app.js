const ASCII_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ASCII_LOWER = ASCII_UPPER.toLowerCase();
const DIGITS = "0123456789";
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const ZWSP = "\u200B";
const INDENT_CHAR = "  ";
const elements = {
    editor: document.querySelector("#editor"),
    output: document.querySelector("#output"),
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

function buildRangeMap({ upperStart, lowerStart, digitStart }) {
    const map = new Map();

    if (typeof upperStart === "number") {
        for (let index = 0; index < ASCII_UPPER.length; index += 1) {
            map.set(ASCII_UPPER[index], String.fromCodePoint(upperStart + index));
        }
    }

    if (typeof lowerStart === "number") {
        for (let index = 0; index < ASCII_LOWER.length; index += 1) {
            map.set(ASCII_LOWER[index], String.fromCodePoint(lowerStart + index));
        }
    }

    if (typeof digitStart === "number") {
        for (let index = 0; index < DIGITS.length; index += 1) {
            map.set(DIGITS[index], String.fromCodePoint(digitStart + index));
        }
    }

    return map;
}

function buildExplicitMap({ upper = "", lower = "", digits = "", extra = {} }) {
    const map = new Map();

    Array.from(upper).forEach((char, index) => {
        if (ASCII_UPPER[index]) {
            map.set(ASCII_UPPER[index], char);
        }
    });

    Array.from(lower).forEach((char, index) => {
        if (ASCII_LOWER[index]) {
            map.set(ASCII_LOWER[index], char);
        }
    });

    Array.from(digits).forEach((char, index) => {
        if (DIGITS[index]) {
            map.set(DIGITS[index], char);
        }
    });

    Object.entries(extra).forEach(([key, value]) => {
        map.set(key, value);
    });

    return map;
}

function createTransformFromMap(map, { preferUppercase = false, preferLowercase = false } = {}) {
    return (text) => {
        const input = preferUppercase ? text.toUpperCase() : preferLowercase ? text.toLowerCase() : text;

        return Array.from(input)
            .map((char) => {
                if (map.has(char)) {
                    return map.get(char);
                }

                if (preferUppercase && map.has(char.toUpperCase())) {
                    return map.get(char.toUpperCase());
                }

                if (preferLowercase && map.has(char.toLowerCase())) {
                    return map.get(char.toLowerCase());
                }

                return char;
            })
            .join("");
    };
}

function toRoman(value) {
    const numerals = [
        [1000, "M"],
        [900, "CM"],
        [500, "D"],
        [400, "CD"],
        [100, "C"],
        [90, "XC"],
        [50, "L"],
        [40, "XL"],
        [10, "X"],
        [9, "IX"],
        [5, "V"],
        [4, "IV"],
        [1, "I"]
    ];

    let remaining = value;
    let output = "";

    numerals.forEach(([amount, numeral]) => {
        while (remaining >= amount) {
            output += numeral;
            remaining -= amount;
        }
    });

    return output;
}

function toAlphaSequence(index) {
    let working = index + 1;
    let output = "";

    while (working > 0) {
        working -= 1;
        output = String.fromCharCode(97 + (working % 26)) + output;
        working = Math.floor(working / 26);
    }

    return output;
}

function toCircledNumber(value) {
    if (value === 0) {
        return "⓪";
    }

    if (value >= 1 && value <= 20) {
        return String.fromCodePoint(0x2460 + value - 1);
    }

    return `${value}.`;
}

function stripListPrefix(line) {
    return line.replace(
        /^(\s*)(?:(?:[-*•◦▪▸✓◆■→]|\d+[.)]|[A-Za-z]+[.)]|[ivxlcdmIVXLCDM]+[.)]|[①-⑳⓪])\s+)+/,
        "$1"
    );
}

const identityTransform = (text) => text;
const boldSerifMap = buildRangeMap({ upperStart: 0x1d400, lowerStart: 0x1d41a, digitStart: 0x1d7ce });
const boldSansMap = buildRangeMap({ upperStart: 0x1d5d4, lowerStart: 0x1d5ee, digitStart: 0x1d7ec });
const boldItalicSerifMap = buildRangeMap({ upperStart: 0x1d468, lowerStart: 0x1d482 });
const boldItalicSansMap = buildRangeMap({ upperStart: 0x1d63c, lowerStart: 0x1d656 });
const italicSansMap = buildRangeMap({ upperStart: 0x1d608, lowerStart: 0x1d622 });
const boldFrakturMap = buildRangeMap({ upperStart: 0x1d56c, lowerStart: 0x1d586 });
const monospaceMap = buildRangeMap({ upperStart: 0x1d670, lowerStart: 0x1d68a, digitStart: 0x1d7f6 });
const fullwidthMap = buildRangeMap({ upperStart: 0xff21, lowerStart: 0xff41, digitStart: 0xff10 });
const outlinedBlockMap = buildRangeMap({ upperStart: 0x1f130 });

const doubleStruckMap = buildExplicitMap({
    upper: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ",
    lower: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫",
    digits: "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡"
});

const frakturMap = buildExplicitMap({
    upper: "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ",
    lower: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷"
});

const scriptMap = buildExplicitMap({
    upper: "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵",
    lower: "𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏"
});

const boldScriptMap = buildRangeMap({ upperStart: 0x1d4d0, lowerStart: 0x1d4ea });

const circledMap = buildExplicitMap({
    upper: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ",
    lower: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ",
    digits: "⓪①②③④⑤⑥⑦⑧⑨"
});

const smallCapsMap = new Map([
    ["a", "ᴀ"], ["b", "ʙ"], ["c", "ᴄ"], ["d", "ᴅ"], ["e", "ᴇ"], ["f", "ꜰ"],
    ["g", "ɢ"], ["h", "ʜ"], ["i", "ɪ"], ["j", "ᴊ"], ["k", "ᴋ"], ["l", "ʟ"],
    ["m", "ᴍ"], ["n", "ɴ"], ["o", "ᴏ"], ["p", "ᴘ"], ["q", "ǫ"], ["r", "ʀ"],
    ["s", "ꜱ"], ["t", "ᴛ"], ["u", "ᴜ"], ["v", "ᴠ"], ["w", "ᴡ"], ["x", "x"],
    ["y", "ʏ"], ["z", "ᴢ"]
]);

const superscriptMap = new Map([
    ["0", "⁰"], ["1", "¹"], ["2", "²"], ["3", "³"], ["4", "⁴"], ["5", "⁵"],
    ["6", "⁶"], ["7", "⁷"], ["8", "⁸"], ["9", "⁹"], ["a", "ᵃ"], ["b", "ᵇ"],
    ["c", "ᶜ"], ["d", "ᵈ"], ["e", "ᵉ"], ["f", "ᶠ"], ["g", "ᵍ"], ["h", "ʰ"],
    ["i", "ⁱ"], ["j", "ʲ"], ["k", "ᵏ"], ["l", "ˡ"], ["m", "ᵐ"], ["n", "ⁿ"],
    ["o", "ᵒ"], ["p", "ᵖ"], ["q", "𐞥"], ["r", "ʳ"], ["s", "ˢ"], ["t", "ᵗ"],
    ["u", "ᵘ"], ["v", "ᵛ"], ["w", "ʷ"], ["x", "ˣ"], ["y", "ʸ"], ["z", "ᶻ"],
    ["A", "ᴬ"], ["B", "ᴮ"], ["C", "ꟲ"], ["D", "ᴰ"], ["E", "ᴱ"], ["F", "ꟳ"],
    ["G", "ᴳ"], ["H", "ᴴ"], ["I", "ᴵ"], ["J", "ᴶ"], ["K", "ᴷ"], ["L", "ᴸ"],
    ["M", "ᴹ"], ["N", "ᴺ"], ["O", "ᴼ"], ["P", "ᴾ"], ["Q", "ꟴ"], ["R", "ᴿ"],
    ["S", "ˢ"], ["T", "ᵀ"], ["U", "ᵁ"], ["V", "ⱽ"], ["W", "ᵂ"], ["X", "ˣ"],
    ["Y", "𐞲"], ["Z", "ᶻ"]
]);

const subscriptMap = new Map([
    ["0", "₀"], ["1", "₁"], ["2", "₂"], ["3", "₃"], ["4", "₄"], ["5", "₅"],
    ["6", "₆"], ["7", "₇"], ["8", "₈"], ["9", "₉"], ["a", "ₐ"], ["e", "ₑ"],
    ["h", "ₕ"], ["i", "ᵢ"], ["j", "ⱼ"], ["k", "ₖ"], ["l", "ₗ"], ["m", "ₘ"],
    ["n", "ₙ"], ["o", "ₒ"], ["p", "ₚ"], ["r", "ᵣ"], ["s", "ₛ"], ["t", "ₜ"],
    ["u", "ᵤ"], ["v", "ᵥ"], ["x", "ₓ"]
]);

const fauxGreekMap = new Map([
    ["A", "Λ"], ["B", "ß"], ["C", "Ͼ"], ["D", "Ð"], ["E", "Σ"], ["F", "Ғ"],
    ["G", "Ɠ"], ["H", "Ή"], ["I", "I"], ["J", "Ϳ"], ["K", "Κ"], ["L", "ᄂ"],
    ["M", "Μ"], ["N", "Ɲ"], ["O", "Θ"], ["P", "Ρ"], ["Q", "Ω"], ["R", "Ʀ"],
    ["S", "Ƨ"], ["T", "Ƭ"], ["U", "Ʊ"], ["V", "Ѵ"], ["W", "Ψ"], ["X", "Χ"],
    ["Y", "Υ"], ["Z", "Ζ"]
]);

const fauxCyrillicMap = new Map([
    ["a", "α"], ["b", "ь"], ["c", "ϲ"], ["d", "ԁ"], ["e", "є"], ["f", "ƒ"],
    ["g", "ց"], ["h", "н"], ["i", "ι"], ["j", "ј"], ["k", "к"], ["l", "ℓ"],
    ["m", "м"], ["n", "и"], ["o", "σ"], ["p", "ρ"], ["q", "զ"], ["r", "г"],
    ["s", "ѕ"], ["t", "т"], ["u", "υ"], ["v", "ν"], ["w", "ω"], ["x", "х"],
    ["y", "у"], ["z", "ᴢ"]
]);

const fontFamilies = [
    {
        id: "default",
        label: "Default",
        description: "Plain ASCII text. This is the only font that allows strike and underline toggles.",
        sample: "This is a test",
        regularTransform: identityTransform,
        boldTransform: createTransformFromMap(boldSerifMap),
        allowsEffects: true
    },
    {
        id: "boldSans",
        label: "Bold (sans)",
        description: "Standalone sans bold style.",
        sample: "𝗧𝗵𝗶𝘀 𝗶𝘀 𝗮 𝘁𝗲𝘀𝘁",
        regularTransform: createTransformFromMap(boldSansMap),
        allowsEffects: false
    },
    {
        id: "boldItalicSerif",
        label: "Italic Bold (serif)",
        description: "Standalone serif bold italic style.",
        sample: "𝑻𝒉𝒊𝒔 𝒊𝒔 𝒂 𝒕𝒆𝒔𝒕",
        regularTransform: createTransformFromMap(boldItalicSerifMap),
        allowsEffects: false
    },
    {
        id: "italicSans",
        label: "Italic (sans)",
        description: "Modern italic style with an available bold variant.",
        sample: "𝘛𝘩𝘪𝘴 𝘪𝘴 𝘢 𝘵𝘦𝘴𝘵",
        regularTransform: createTransformFromMap(italicSansMap),
        boldTransform: createTransformFromMap(boldItalicSansMap),
        allowsEffects: false
    },
    {
        id: "doubleStruck",
        label: "Double-Struck",
        description: "Classic blackboard style.",
        sample: "𝕋𝕙𝕚𝕤 𝕚𝕤 𝕒 𝕥𝕖𝕤𝕥",
        regularTransform: createTransformFromMap(doubleStruckMap),
        allowsEffects: false
    },
    {
        id: "fraktur",
        label: "Fraktur",
        description: "Decorative blackletter text with a bold variant.",
        sample: "𝔗𝔥𝔦𝔰 𝔦𝔰 𝔞 𝔱𝔢𝔰𝔱",
        regularTransform: createTransformFromMap(frakturMap),
        boldTransform: createTransformFromMap(boldFrakturMap),
        allowsEffects: false
    },
    {
        id: "script",
        label: "Script",
        description: "Light script lettering with a bold variant.",
        sample: "𝒯𝒽𝒾𝓈 𝒾𝓈 𝒶 𝓉𝑒𝓈𝓉",
        regularTransform: createTransformFromMap(scriptMap),
        boldTransform: createTransformFromMap(boldScriptMap),
        allowsEffects: false
    },
    {
        id: "monospace",
        label: "Monospace",
        description: "Technical fixed-width lettering.",
        sample: "𝚃𝚑𝚒𝚜 𝚒𝚜 𝚊 𝚝𝚎𝚜𝚝",
        regularTransform: createTransformFromMap(monospaceMap),
        allowsEffects: false
    },
    {
        id: "fullwidth",
        label: "Fullwidth",
        description: "Wide spacing for punchy lines.",
        sample: "Ｔｈｉｓ ｉｓ ａ ｔｅｓｔ",
        regularTransform: createTransformFromMap(fullwidthMap),
        allowsEffects: false
    },
    {
        id: "smallCaps",
        label: "Small Caps",
        description: "Compact uppercase-style lettering.",
        sample: "ᴛʜɪꜱ ɪꜱ ᴀ ᴛᴇꜱᴛ",
        regularTransform: createTransformFromMap(smallCapsMap, { preferLowercase: true }),
        allowsEffects: false
    },
    {
        id: "circled",
        label: "Circled",
        description: "Enclosed letters for playful emphasis.",
        sample: "Ⓣⓗⓘⓢ ⓘⓢ ⓐ ⓣⓔⓢⓣ",
        regularTransform: createTransformFromMap(circledMap),
        allowsEffects: false
    },
    {
        id: "outlinedBlocks",
        label: "Outlined Blocks",
        description: "Squared uppercase letters.",
        sample: "🄷🄴🄰🄳🄻🄸🄽🄴",
        regularTransform: createTransformFromMap(outlinedBlockMap, { preferUppercase: true }),
        allowsEffects: false
    },
    {
        id: "superscript",
        label: "Superscript",
        description: "Raised baseline for lighter callouts.",
        sample: "ᵀʰⁱˢ ⁱˢ ᵃ ᵗᵉˢᵗ",
        regularTransform: createTransformFromMap(superscriptMap),
        allowsEffects: false
    },
    {
        id: "subscript",
        label: "Subscript",
        description: "Lowered baseline for subtle tags.",
        sample: "ₜₕᵢₛ ᵢₛ ₐ ₜₑₛₜ",
        regularTransform: createTransformFromMap(subscriptMap, { preferLowercase: true }),
        allowsEffects: false
    },
    {
        id: "fauxGreek",
        label: "Faux Greek",
        description: "Greek-like glyph swaps for titles.",
        sample: "ƬΉIƧ IƧ Λ ƬΣƧƬ",
        regularTransform: createTransformFromMap(fauxGreekMap, { preferUppercase: true }),
        allowsEffects: false
    },
    {
        id: "fauxCyrillic",
        label: "Faux Cyrillic",
        description: "Mixed glyph substitutions with a rougher look.",
        sample: "тнιѕ ιѕ α тєѕт",
        regularTransform: createTransformFromMap(fauxCyrillicMap, { preferLowercase: true }),
        allowsEffects: false
    }
];

const lists = [
    {
        id: "bullets",
        label: "Bullets",
        sample: "• First\n• Second",
        formatter: () => "•"
    },
    {
        id: "hollowBullets",
        label: "Hollow bullets",
        sample: "◦ First\n◦ Second",
        formatter: () => "◦"
    },
    {
        id: "checks",
        label: "Checks",
        sample: "✓ First\n✓ Second",
        formatter: () => "✓"
    },
    {
        id: "arrows",
        label: "Arrows",
        sample: "▸ First\n▸ Second",
        formatter: () => "▸"
    },
    {
        id: "squares",
        label: "Squares",
        sample: "▪ First\n▪ Second",
        formatter: () => "▪"
    },
    {
        id: "numbers",
        label: "Numbered",
        sample: "1. First\n2. Second",
        formatter: (index) => `${index + 1}.`
    },
    {
        id: "alphaLower",
        label: "Alpha",
        sample: "a. First\nb. Second",
        formatter: (index) => `${toAlphaSequence(index)}.`
    },
    {
        id: "romanUpper",
        label: "Roman",
        sample: "I. First\nII. Second",
        formatter: (index) => `${toRoman(index + 1)}.`
    },
    {
        id: "circledNumbers",
        label: "Circled",
        sample: "① First\n② Second",
        formatter: (index) => toCircledNumber(index + 1)
    },
    {
        id: "clearList",
        label: "Clear markers",
        sample: "First\nSecond",
        formatter: null
    }
];

const fontLookup = new Map(fontFamilies.map((font) => [font.id, font]));
const listLookup = new Map(lists.map((list) => [list.id, list]));
const reverseLookup = new Map();

[
    boldSerifMap,
    boldSansMap,
    boldItalicSerifMap,
    boldItalicSansMap,
    italicSansMap,
    boldFrakturMap,
    monospaceMap,
    fullwidthMap,
    outlinedBlockMap,
    doubleStruckMap,
    frakturMap,
    scriptMap,
    boldScriptMap,
    circledMap,
    smallCapsMap,
    superscriptMap,
    subscriptMap,
    fauxGreekMap,
    fauxCyrillicMap
].forEach((map) => {
    map.forEach((value, key) => {
        if (!reverseLookup.has(value)) {
            reverseLookup.set(value, key);
        }
    });
});

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

function normalizeAscii(text) {
    let output = "";

    for (const char of text) {
        if (char === ZWSP || char === "\uFE0F") {
            continue;
        }

        const codePoint = char.codePointAt(0);
        if (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) {
            output += String.fromCharCode(65 + codePoint - 0x1f1e6);
            continue;
        }

        output += reverseLookup.get(char) ?? char;
    }

    return output.normalize("NFKD").replace(COMBINING_MARKS, "");
}

function applyEffectSet(text, effects) {
    return Array.from(text)
        .map((char) => {
            if (/\s/.test(char)) {
                return char;
            }

            const base = char.replace(COMBINING_MARKS, "");
            let marks = "";

            if (effects.strike) {
                marks += "\u0336";
            }

            if (effects.underline) {
                marks += "\u0332";
            }

            if (effects.doubleUnderline) {
                marks += "\u0333";
            }

            return base + marks;
        })
        .join("");
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

function formatText(text, state = formatState) {
    const normalized = normalizeAscii(text);
    const font = fontLookup.get(state.fontId) ?? fontLookup.get(defaultFormatState.fontId);
    const transform = state.bold && font.boldTransform ? font.boldTransform : font.regularTransform;
    let output = transform(normalized);

    if (font.allowsEffects) {
        output = applyEffectSet(output, state);
    }

    return output;
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
        replaceRange(selectionState.start, selectionState.end, formatText(getSelectedText()));
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
    elements.output.value = value;
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
        elements.output.focus({ preventScroll: true });
        elements.output.select();
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
        insertAtSelection(formatText(event.data));
    });

    elements.editor.addEventListener("paste", (event) => {
        if (isPlainMode()) {
            return;
        }

        event.preventDefault();
        const pastedText = event.clipboardData.getData("text/plain");
        insertAtSelection(formatText(pastedText));
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
    renderStyleToolbar();
    renderListToolbar();
    cacheDynamicElements();
    bindEvents();
    syncSelectionState();
    updateView();
    updateControlState();
}

init();