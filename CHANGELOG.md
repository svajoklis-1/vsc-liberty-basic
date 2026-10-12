# Change Log

2020-05-15 1.0.0: Initial release of Liberty BASIC extension. Added support for syntax and language configuration.

2020-05-16 1.0.1: Double check all keywords/functions, add some that were missing. Better handling of names at end/start of lines.

2020-05-17 1.0.2: Added outline support for labels, functions and subs.

2020-05-18 1.0.3: Simpler autoindent logic, fixes some bugs.

2020-05-18 1.0.4: Remove wonky autoindent, add some missing keywords.

2020-05-18 1.0.5: Add Liberty BASIC color theme for Liberty BASIC files.

2020-07-05 1.0.7: Added GitHub repo link.

2026-10-13 1.1.0: Modernized the extension and reworked the grammar against the Liberty BASIC 4.5.1 documentation.

- **Requires VS Code 1.100 or newer.**
- **Removed the Liberty BASIC color theme.** Highlighting now uses standard scope names, so it works with any color theme.
- Syntax highlighting:
  - Variables starting with `and`, `or` or `xor` (like `order` or `android`) are no longer partly highlighted as operators.
  - Added `DO`/`LOOP`/`UNTIL`, `ON ERROR`, `NOT`, `MOD` (as an operator), and the `=`, `<>`, `<=`, `>=` and `^` operators.
  - Added file modes and window types after `OPEN ... FOR` (e.g. `window_nf`, `graphics_fs_nsb`), and `STRUCT`/`CALLDLL` types (`long`, `ulong`, `ptr`, ...).
  - Added `EVAL$(`, `POPUPMENU`, `PRINTERDIALOG`, the missing special variables (`WindowWidth`, `BackgroundColor$`, `Err$`, `MouseX`, ...) and Windows constants such as `_WS_VISIBLE`.
  - Added numeric line labels (`10 REM`), `_` line continuation, and numbers such as `.5` and `2.5E-3`.
  - Handles (`#win.button`), handle variables (`#var$`) and dotted names (`winRect.orgX.struct`) are highlighted as whole names.
- Outline:
  - Subs and functions span to their `END SUB`/`END FUNCTION`, with the branch labels inside them nested underneath.
  - Text in comments and strings is no longer mistaken for definitions.
  - One-character names (`sub a`) are now listed.
- Folding for `SUB`, `FUNCTION`, block `IF`, `FOR`, `WHILE`, `DO`, `SELECT CASE`, and runs of comment lines.
- Auto-indent after block openers and outdent on `END ...`, `NEXT`, `WEND`, `LOOP`, `ELSE` and `CASE`.
- Double-click selects whole names, including dots, a trailing `$` and handle `#`.
