const ASCII_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ASCII_LOWER = ASCII_UPPER.toLowerCase();
const DIGITS = "0123456789";
const EFFECT_MARKS = /[\u0332\u0333\u0336]/g;

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
        const input = text;

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
].forEach((map) => {
    map.forEach((value, key) => {
        if (!reverseLookup.has(value)) {
            reverseLookup.set(value, key);
        }
    });
});

// Only reverse the explicitly supported decorative alphabets above. Never
// transliterate natural-language letters, compatibility characters or emoji.
function normalizeAscii(text) {
    return Array.from(text.replace(EFFECT_MARKS, ""), char => reverseLookup.get(char) ?? char).join("");
}

function applyEffectSet(text, effects) {
    const marks = (effects.strike ? "\u0336" : "")
        + (effects.underline ? "\u0332" : "")
        + (effects.doubleUnderline ? "\u0333" : "");
    const segments = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text);
    return Array.from(segments, ({ segment }) => /\s/.test(segment) ? segment : segment + marks).join("");
}

function formatText(text, state) {
    const font = fontLookup.get(state.fontId) ?? fontLookup.get("default");
    const transform = state.bold && font.boldTransform ? font.boldTransform : font.regularTransform;
    const output = transform(normalizeAscii(text));
    return font.allowsEffects ? applyEffectSet(output, state) : output;
}

export { fontFamilies, fontLookup, lists, listLookup, normalizeAscii, applyEffectSet, formatText };
