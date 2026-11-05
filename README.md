# LinkedIn WYSIWYG

A local Unicode post formatter. Write a draft, style selected text or set a style for future typing, and copy the plain-text result. The preview is illustrative; it does not reproduce LinkedIn's rendering or validate its current limits.

## Run and host

Serve this directory with a static HTTP server, for example:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/`. Native ES modules require HTTP hosting rather than opening `index.html` as a local file. Deploy `index.html`, `styles.css` and all five root JavaScript files together. No application build, runtime npm dependency, backend, external font or parent-site theme is required. Relative module and stylesheet URLs allow hosting at the root or under a subdirectory.

Clipboard API copying needs a secure context (HTTPS or localhost) and browser permission. If copying fails, the editor offers manual selection. An embedding host may need to permit `clipboard-write` on its iframe. Draft processing stays in the browser; no LinkedIn login or publishing integration is present.

## Editing contracts

- Selection commands affect selected text or selected lines. A selection ending at the next line's beginning excludes that next line.
- With no selection, style controls set future typing. Styling a selection does not change that typing mode. Remove formatting resets future typing to plain text.
- Undo/Redo restore text and selection. Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y redo. Buttons also expose both commands. Adjacent typing within 750 ms groups together; history retains at most 100 transactions in memory. Reloading discards the draft and its history.
- Supported decorative alphabets can be converted back; editor underline/strike marks can be removed. Accents, natural-language letters, emoji selectors and unrelated combining marks are preserved. Unsupported characters pass through unchanged.
- Small caps, circled, superscript, subscript and faux alphabets are one-way conversions. They can merge distinct source letters or use real language characters, so automatic reversal would guess their origin. Uppercase-only styles also discard original ASCII letter case. Use Undo or keep the original draft if that distinction matters.
- Clear markers removes one recognized bullet, numeric, single-letter alphabetic or canonical uppercase Roman prefix. It preserves indentation and following body text. Ambiguous multi-letter alphabetic prefixes (including generated labels after `z`) are preserved; remove these manually rather than risk deleting prose.
- Character count means user-perceived characters (Unicode grapheme clusters), including spaces and newlines. Words are whitespace-separated and lines are newline-separated. These counts do not claim to implement LinkedIn's current acceptance rules.
- IME composition remains native until commit. Committed typing, paste, replacement and drop insertion are then styled. The editor does not rewrite active composition text.

Use a modern browser with ES modules, private class fields and `Intl.Segmenter`. Tests currently exercise Chromium; other engines and physical input devices need manual verification.

## Verify

Node 22.12+ is required for the development tools:

```sh
npm ci
npm run test:install-browser
npm test
```

`npm run test:unit` checks pure Unicode rules, text commands and history without launching a browser. `npm run test:browser` runs real editor interactions against a temporary localhost server and fails on page exceptions. Puppeteer and its browser are development tools only; the lockfile pins the install. Browser tests exercise accessible control names, keyboard activation, real clipboard success, simulated copy failures, undo/redo, selection boundaries, Chromium's IME protocol, paste and replacement events.

On a disposable CI runner or another host that cannot run Chromium's sandbox, explicitly opt in with `CHROME_NO_SANDBOX=1 npm test`. The default keeps the browser sandbox enabled. `PUPPETEER_CACHE_DIR` can select a writable browser-cache location; use the same value for browser installation and tests. The subrepo workflow checks changes without deploying anything.

Before expanding browser support, manually check physical CJK/accent composition, mobile keyboards, dictation, drag/drop, OS-level undo menus, screen readers and the resulting paste into LinkedIn. Automated CDP composition checks do not replace those device checks.

## Source boundaries

| File | Responsibility |
| --- | --- |
| `unicode.js` | Style registry, conservative normalization, effects, selection inspection and grapheme counts. |
| `text-commands.js` | Pure line ranges, list conversion and committed insertion transformation. |
| `history.js` | Bounded document transactions, typing grouping, undo and redo. |
| `clipboard.js` | Browser copy API and checked fallback with cleanup. |
| `app.js` | Validated DOM wiring, selection/typing state, rendering and input lifecycle. |

Progress against the architecture review is recorded in [FIX_PROGRESS.md](FIX_PROGRESS.md). Each numbered finding has its own commit. No parent-site deployment or committed submodule-pointer update is part of these fixes.
