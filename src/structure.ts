// Finds subs, functions, branch labels and block statements in scanned
// Liberty BASIC source. Used by the document symbol and folding providers.

import { scan, Statement } from "./scanner";

export type BlockKind = "sub" | "function" | "if" | "for" | "while" | "do" | "select";

export interface Block
{
    kind: BlockKind;
    startLine: number;
    /** Line of the closing statement (END IF, NEXT, WEND, LOOP, ...). */
    endLine: number;
}

export interface Label
{
    /** Label including its brackets, e.g. "[main]". */
    name: string;
    line: number;
    column: number;
    /** Last line belonging to the label: the line before the next label or routine. */
    endLine: number;
}

export interface Routine
{
    kind: "sub" | "function";
    name: string;
    /** Parameter list as written, without the function's parentheses. */
    params: string;
    line: number;
    nameColumn: number;
    /** Line of END SUB / END FUNCTION, or the last line before the next routine if missing. */
    endLine: number;
    /** Whether END SUB / END FUNCTION was found. */
    closed: boolean;
    /** Branch labels are scoped to the routine they are defined in. */
    labels: Label[];
}

export interface DocumentStructure
{
    routines: Routine[];
    /** Labels in the main program, outside any sub or function. */
    labels: Label[];
    /** Closed multi-line blocks, including subs and functions. */
    blocks: Block[];
    /** Runs of two or more consecutive comment-only lines, as [startLine, endLine]. */
    commentRuns: [number, number][];
}

// Keyword boundary: identifiers may contain letters, digits, dots and '$'.
const kw = (word: string): RegExp => new RegExp(`^${word}(?![A-Za-z0-9.$_])`, "i");

const functionRegexp = /^function[ \t]+([A-Za-z][A-Za-z0-9.]*\$?)[ \t]*\((.*)\)/i;
const subRegexp = /^sub[ \t]+([A-Za-z][A-Za-z0-9.]*\$?)(.*)$/i;
const endRegexp = /^end[ \t]+(sub|function|if|select)(?![A-Za-z0-9.$_])/i;
const blockIfRegexp = /^if(?![A-Za-z0-9.$_]).*(?<![A-Za-z0-9.$#_])then$/i;
const selectRegexp = /^select[ \t]+case(?![A-Za-z0-9.$_])/i;
const labelRegexp = /^\[[A-Za-z_.][A-Za-z0-9_.]*\]$/;

const openers: [RegExp, BlockKind][] = [
    [kw("for"), "for"],
    [kw("while"), "while"],
    [kw("do"), "do"],
    [selectRegexp, "select"],
    [blockIfRegexp, "if"]
];

const closers: [RegExp, BlockKind][] = [
    [kw("next"), "for"],
    [kw("wend"), "while"],
    [kw("loop"), "do"]
];

interface OpenBlock
{
    kind: BlockKind;
    startLine: number;
}

export function analyze (lines: readonly string[]): DocumentStructure
{
    const { statements, commentLines } = scan(lines);
    const lastLine = Math.max(0, lines.length - 1);

    const routines: Routine[] = [];
    const topLabels: Label[] = [];
    const blocks: Block[] = [];
    const stack: OpenBlock[] = [];
    let routine: Routine | null = null;

    const close = (kind: BlockKind, endLine: number): void =>
    {
        for (let i = stack.length - 1; i >= 0; i -= 1)
        {
            if (stack[i].kind === kind)
            {
                blocks.push({ kind, startLine: stack[i].startLine, endLine });
                // Anything opened inside and never closed is dropped.
                stack.length = i;
                return;
            }
        }
    };

    const endRoutine = (endLine: number, closed: boolean): void =>
    {
        if (routine !== null)
        {
            routine.endLine = Math.max(routine.line, endLine);
            routine.closed = closed;
            routine = null;
        }
    };

    for (const statement of statements)
    {
        const text = statement.text;

        if (labelRegexp.test(text))
        {
            const label: Label = {
                name: text, line: statement.line, column: statement.column, endLine: statement.line
            };
            (routine !== null ? routine.labels : topLabels).push(label);
            continue;
        }

        const started = matchRoutine(statement);
        if (started !== null)
        {
            // A missing END SUB / END FUNCTION ends at the next routine.
            endRoutine(statement.line - 1, false);
            stack.length = 0;
            routine = started;
            routines.push(started);
            stack.push({ kind: started.kind, startLine: statement.line });
            continue;
        }

        const end = text.match(endRegexp);
        if (end !== null)
        {
            const kind = end[1].toLowerCase() as BlockKind;
            if (kind === "sub" || kind === "function")
            {
                if (routine !== null && routine.kind === kind)
                {
                    close(kind, statement.endLine);
                    endRoutine(statement.endLine, true);
                }
            }
            else
            {
                close(kind, statement.endLine);
            }
            continue;
        }

        const closer = closers.find(([regexp]) => regexp.test(text));
        if (closer !== undefined)
        {
            close(closer[1], statement.endLine);
            continue;
        }

        const opener = openers.find(([regexp]) => regexp.test(text));
        if (opener !== undefined)
        {
            stack.push({ kind: opener[1], startLine: statement.line });
        }
    }

    endRoutine(lastLine, false);

    setLabelEnds(topLabels, routines.map((r) => r.line), lastLine);
    for (const r of routines)
    {
        setLabelEnds(r.labels, [], r.closed ? r.endLine - 1 : r.endLine);
    }

    blocks.sort((a, b) => a.startLine - b.startLine || b.endLine - a.endLine);

    return { routines, labels: topLabels, blocks, commentRuns: findRuns(commentLines) };
}

function matchRoutine (statement: Statement): Routine | null
{
    const fn = statement.text.match(functionRegexp);
    if (fn !== null)
    {
        return {
            kind: "function",
            name: fn[1],
            params: fn[2].trim(),
            line: statement.line,
            nameColumn: statement.column + statement.text.indexOf(fn[1], "function".length),
            endLine: statement.line,
            closed: false,
            labels: []
        };
    }

    const sub = statement.text.match(subRegexp);
    if (sub !== null)
    {
        return {
            kind: "sub",
            name: sub[1],
            params: sub[2].trim(),
            line: statement.line,
            nameColumn: statement.column + statement.text.indexOf(sub[1], "sub".length),
            endLine: statement.line,
            closed: false,
            labels: []
        };
    }

    return null;
}

/** Each label runs until the line before the next label or boundary line, or until `lastLine`. */
function setLabelEnds (labels: Label[], boundaries: number[], lastLine: number): void
{
    for (let i = 0; i < labels.length; i += 1)
    {
        const label = labels[i];
        let end = lastLine;
        if (i + 1 < labels.length)
        {
            end = Math.min(end, labels[i + 1].line - 1);
        }
        for (const boundary of boundaries)
        {
            if (boundary > label.line)
            {
                end = Math.min(end, boundary - 1);
            }
        }
        label.endLine = Math.max(label.line, end);
    }
}

function findRuns (lines: number[]): [number, number][]
{
    const runs: [number, number][] = [];
    let i = 0;
    while (i < lines.length)
    {
        let j = i;
        while (j + 1 < lines.length && lines[j + 1] === lines[j] + 1)
        {
            j += 1;
        }
        if (j > i)
        {
            runs.push([lines[i], lines[j]]);
        }
        i = j + 1;
    }
    return runs;
}
