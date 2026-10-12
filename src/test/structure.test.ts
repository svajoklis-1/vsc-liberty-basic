import { test } from "node:test";
import assert from "node:assert/strict";

import { analyze, Block } from "../structure";

const analyzeSource = (source: string) => analyze(source.split("\n"));

const spans = (blocks: Block[]): string[] =>
    blocks.map((b) => `${b.kind} ${b.startLine}-${b.endLine}`);

test("finds functions and subs, including one-character names", () =>
{
    const { routines } = analyzeSource([
        "function a(x, byref y$)",
        "    a = x",
        "end function",
        "sub b",
        "end sub",
        "function Greet.Name$(who$)",
        "End Function",
        "Sub s : End Sub"
    ].join("\n"));

    assert.deepEqual(
        routines.map((r) => [r.kind, r.name, r.params, r.line, r.nameColumn, r.endLine, r.closed]),
        [
            ["function", "a", "x, byref y$", 0, 9, 2, true],
            ["sub", "b", "", 3, 4, 4, true],
            ["function", "Greet.Name$", "who$", 5, 9, 6, true],
            ["sub", "s", "", 7, 4, 7, true]
        ]
    );
});

test("sub parameters are kept for the outline detail", () =>
{
    const { routines } = analyzeSource("sub mergeFiles first$, second$\nend sub");
    assert.equal(routines[0].params, "first$, second$");
});

test("ignores definitions in comments and strings", () =>
{
    const { routines, labels } = analyzeSource([
        "' sub notReal",
        "rem function notReal(x)",
        "print \"sub notReal: [notALabel]\"",
        "x = 1 ' note: sub notReal"
    ].join("\n"));
    assert.deepEqual(routines, []);
    assert.deepEqual(labels, []);
});

test("END SUB / EXIT SUB do not start routines", () =>
{
    const { routines } = analyzeSource([
        "sub a",
        "    if x then exit sub",
        "end sub"
    ].join("\n"));
    assert.deepEqual(routines.map((r) => r.name), ["a"]);
});

test("labels are scoped to their routine and run until the next label", () =>
{
    const structure = analyzeSource([
        "[main]",          // 0
        "    print 1",     // 1
        "[x]",             // 2
        "    wait",        // 3
        "",                // 4
        "sub handler h$",  // 5
        "[inner]",         // 6
        "    print 2",     // 7
        "end sub",         // 8
        "[after]",         // 9
        "    end"          // 10
    ].join("\n"));

    assert.deepEqual(
        structure.labels.map((l) => [l.name, l.line, l.endLine]),
        [["[main]", 0, 1], ["[x]", 2, 4], ["[after]", 9, 10]]
    );
    assert.deepEqual(
        structure.routines[0].labels.map((l) => [l.name, l.line, l.endLine]),
        [["[inner]", 6, 7]]
    );
});

test("labels used as branch targets are not definitions", () =>
{
    const { labels } = analyzeSource("if x then [a] else [b]\ngoto [c]");
    assert.deepEqual(labels, []);
});

test("a routine without END ends before the next routine", () =>
{
    const { routines } = analyzeSource([
        "sub a",
        "    print 1",
        "sub b",
        "    print 2"
    ].join("\n"));
    assert.deepEqual(routines.map((r) => [r.name, r.endLine, r.closed]), [["a", 1, false], ["b", 3, false]]);
});

test("finds nested blocks", () =>
{
    const { blocks } = analyzeSource([
        "for i = 1 to 10",           // 0
        "    while x < 3",           // 1
        "        x = x + 1",         // 2
        "    wend",                  // 3
        "    if i > 5 then",         // 4
        "        do",                // 5
        "            y = y + 1",     // 6
        "        loop until y > 3",  // 7
        "    else",                  // 8
        "        select case i",     // 9
        "        case 1",            // 10
        "        end select",        // 11
        "    end if",                // 12
        "next i"                     // 13
    ].join("\n"));

    assert.deepEqual(spans(blocks), [
        "for 0-13", "while 1-3", "if 4-12", "do 5-7", "select 9-11"
    ]);
});

test("single-line IF does not open a block", () =>
{
    const { blocks } = analyzeSource([
        "if a then print 1",
        "if a then print 1 else print 2",
        "if a then [skip]",
        "if a then print 1 : print 2",
        "if a then",
        "end if"
    ].join("\n"));
    assert.deepEqual(spans(blocks), ["if 4-5"]);
});

test("DO WHILE and LOOP WHILE pair up", () =>
{
    const { blocks } = analyzeSource("do while a < 3\n    a = a + 1\nloop\ndo\nloop while b");
    assert.deepEqual(spans(blocks), ["do 0-2", "do 3-4"]);
});

test("blocks spanning continuation lines end on the last line", () =>
{
    const { blocks } = analyzeSource("sub a x, _\n    y\nend sub _\n");
    assert.deepEqual(spans(blocks), ["sub 0-3"]);
});

test("unclosed blocks are dropped, closed ones survive", () =>
{
    const { blocks } = analyzeSource([
        "for i = 1 to 3",
        "    if x then",
        "next i"
    ].join("\n"));
    assert.deepEqual(spans(blocks), ["for 0-2"]);
});

test("one-line loops produce zero-length blocks", () =>
{
    const { blocks } = analyzeSource("for i = 1 to 3 : print i : next i");
    assert.deepEqual(spans(blocks), ["for 0-0"]);
});

test("finds runs of comment-only lines", () =>
{
    const { commentRuns } = analyzeSource("' a\n' b\nx = 1\n' c\nrem d\nREM e\nprint 1 ' f");
    assert.deepEqual(commentRuns, [[0, 1], [3, 5]]);
});
