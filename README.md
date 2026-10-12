# liberty-basic

## Features

This extension aims to add support for Liberty BASIC in Visual Studio Code.

It adds:
- syntax highlighting for Liberty BASIC 4.5.1
- outline of subs, functions and branch labels
- code folding for subs, functions, loops, `IF` and `SELECT CASE` blocks
- auto-indent for block statements
- **Run Program**, **Debug Program** and **Make TKN File** commands that start Liberty BASIC on the current file

## Running programs

Set `libertybasic.executablePath` to your `liberty.exe` (the first run will ask for it), then use the ▶ button in the editor title bar or the `Liberty BASIC:` commands in the command palette. The file is saved first and opened by Liberty BASIC with its `-R` (run), `-D` (debug) or `-T` (make TKN) command-line switch. Program output and errors appear in Liberty BASIC's own windows.

Settings:
- `libertybasic.executablePath`: absolute path to `liberty.exe`
- `libertybasic.executableWrapper`: a command to start it through, e.g. `["wine"]` on Linux or macOS
- `libertybasic.minimizeEditor` (`-M`) and `libertybasic.exitWhenFinished` (`-A`): registered version of Liberty BASIC only

## Help needed?

If you have any issues visit Liberty BASIC forums at https://libertybasiccom.proboards.com/

## Latest release notes

### 1.1.1

Added **Run Program**, **Debug Program** and **Make TKN File** commands that start Liberty BASIC on the current file. See [Running programs](#running-programs).

### 1.1.0

The extension has been modernized and requires VS Code 1.100 or newer. Highlighting was reworked against the Liberty BASIC 4.5.1 documentation and now works with any color theme. The bundled Liberty BASIC theme has been removed. The outline now nests labels under their subs and functions, and folding and auto-indent were added.

More at: https://marketplace.visualstudio.com/items/vytenis-narusis.liberty-basic/changelog

## Disclaimer

This project is in no way associated with the official Liberty BASIC team or project.

## Links

Liberty BASIC homepage - https://www.libertybasic.com/

Liberty BASIC forums - https://libertybasiccom.proboards.com/