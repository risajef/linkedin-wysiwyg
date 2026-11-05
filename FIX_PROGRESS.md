# Review fix progress

Review baseline: `8553ad5`, 2026-11-05. Finding numbers refer to the parent's `LINKEDIN_WYSIWYG_REVIEW.md`. Each numbered finding is addressed in its own subrepo commit; its implementation, regression coverage and this log travel together. The parent website and its committed submodule pointer are outside this work.

| Finding | Status | Change and verification |
| --- | --- | --- |
| 1. Startup / DOM contract | Complete | Removed obsolete output field dependency, restored Clear editor, validated required elements. Chromium smoke test covers startup, typing, counts, clipboard and clearing without page errors. |
| 2. Text preservation | Complete | Extracted pure Unicode rules. Removed broad normalization and ambiguous reverse maps; accents, natural letters, flags, selectors and unrelated combining marks survive. Only editor effects are stripped. One-way styles are disclosed. Pure regression cases and Chromium smoke pass. |
| 3. Undo / redo | Complete | Added bounded document transactions with text and selection, grouped typing, redo invalidation, keyboard shortcuts and visible Undo/Redo controls. Formatting, list edits, normalization and clear use the same history. Chromium verifies formatting recovery, redo, clear recovery, grouping and branching. |
| 4. Line boundaries | Complete | Extracted line-boundary command with exclusive selection ends and valid empty-line ranges. Pure edge cases and Chromium list/indent checks pass, including undo. |
| 5. List parsing | Complete | Pure list parsing separates indentation and body, removes one narrow marker, preserves prose, and keeps indentation before replacement markers. Empty Clear markers no longer inserts sample content. Pure and Chromium checks pass. Ambiguous multi-letter alphabetic prefixes are deliberately preserved (including generated labels after z). |
| 6. Clipboard outcomes | Pending | |
| 7. Selection / typing state | Pending | |
| 8. Composition / input methods | Pending | |
| 9. Accessible controls | Pending | |
| 10. Runtime verification | Pending | |
| 11. Hosting / presentation | Pending | |

Browser tests currently run with `node --test tests/editor.test.mjs` (Puppeteer is available through the workspace). Standalone dependency setup and CI will be added with finding 10. On hosts requiring it, `CHROME_NO_SANDBOX=1` explicitly opts into running the test browser without its sandbox; this is not the default.
