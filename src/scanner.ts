// Splits Liberty BASIC source into statements, independent of the vscode API.
//
// Comments (' and REM) are removed, string contents are blanked out with spaces
// (so columns stay valid), statements are split on ':', and lines ending in the
// '_' continuation character are joined with the following line.

export interface Statement
{
    /** Line the statement starts on. */
    line: number;
    /** Column of the statement's first character on `line`. */
    column: number;
    /** Last line the statement occupies (differs from `line` for continued lines). */
    endLine: number;
    /** Statement code, trimmed, with string contents blanked and continuations joined. */
    text: string;
}

export interface ScanResult
{
    statements: Statement[];
    /** Lines that contain nothing but a comment. */
    commentLines: number[];
}

const identifierChar = /[A-Za-z0-9.$_]/;
const remRegexp = /^rem(?![A-Za-z0-9.$_])/i;
const labelRegexp = /^\[[A-Za-z_.][A-Za-z0-9_.]*\]/;
const lineNumberRegexp = /^[ \t]*\d+(?=[ \t]|$)/;

export function scan (lines: readonly string[]): ScanResult
{
    const statements: Statement[] = [];
    const commentLines: number[] = [];

    let current: Statement | null = null;
    let continuing = false;

    const finish = (): void =>
    {
        if (current !== null)
        {
            current.text = current.text.trim();
            if (current.text.length > 0)
            {
                statements.push(current);
            }
        }
        current = null;
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1)
    {
        const line = lines[lineIndex];
        let pos = 0;
        let sawCode = false;
        let sawComment = false;

        if (continuing && current !== null)
        {
            current.text += " ";
            current.endLine = lineIndex;
        }
        else
        {
            const lineNumber = line.match(lineNumberRegexp);
            if (lineNumber !== null)
            {
                pos = lineNumber[0].length;
                sawCode = true;
            }
        }
        continuing = false;

        while (pos < line.length)
        {
            const ch = line[pos];

            if (current === null)
            {
                if (ch === " " || ch === "\t")
                {
                    pos += 1;
                    continue;
                }

                const rest = line.slice(pos);
                if (remRegexp.test(rest))
                {
                    sawComment = true;
                    break;
                }

                const label = rest.match(labelRegexp);
                if (label !== null)
                {
                    statements.push({
                        line: lineIndex, column: pos, endLine: lineIndex, text: label[0]
                    });
                    sawCode = true;
                    pos += label[0].length;
                    continue;
                }

                current = { line: lineIndex, column: pos, endLine: lineIndex, text: "" };
            }

            if (ch === "'")
            {
                sawComment = true;
                break;
            }

            sawCode = true;

            if (ch === ":")
            {
                finish();
                pos += 1;
                continue;
            }

            if (ch === "\"")
            {
                const close = line.indexOf("\"", pos + 1);
                const contentEnd = close === -1 ? line.length : close;
                current.text += "\"" + " ".repeat(contentEnd - pos - 1);
                if (close !== -1)
                {
                    current.text += "\"";
                }
                pos = close === -1 ? line.length : close + 1;
                continue;
            }

            current.text += ch;
            pos += 1;
        }

        if (current !== null)
        {
            const trimmed = current.text.trimEnd();
            if (trimmed.endsWith("_") && !identifierChar.test(trimmed.charAt(trimmed.length - 2)))
            {
                current.text = trimmed.slice(0, -1);
                continuing = true;
                continue;
            }
        }

        finish();

        if (sawComment && !sawCode)
        {
            commentLines.push(lineIndex);
        }
    }

    finish();

    return { statements, commentLines };
}
