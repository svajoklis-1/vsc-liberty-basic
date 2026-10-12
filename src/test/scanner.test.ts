import { test } from "node:test";
import assert from "node:assert/strict";

import { scan } from "../scanner";

const texts = (source: string): string[] =>
    scan(source.split("\n")).statements.map((s) => s.text);

test("splits statements on colons", () =>
{
    assert.deepEqual(texts("a = 1 : b = 2:c = 3"), ["a = 1", "b = 2", "c = 3"]);
});

test("removes apostrophe and REM comments", () =>
{
    assert.deepEqual(texts("print 1 ' note: here"), ["print 1"]);
    assert.deepEqual(texts("REM whole line: comment"), []);
    assert.deepEqual(texts("x = 1 : rem trailing: comment"), ["x = 1"]);
    assert.deepEqual(texts("rem"), []);
});

test("REM is only a comment at the start of a statement", () =>
{
    assert.deepEqual(texts("remainder = 5"), ["remainder = 5"]);
    assert.deepEqual(texts("rem.x = 5"), ["rem.x = 5"]);
});

test("blanks string contents, keeping columns", () =>
{
    const result = scan(["print \"a: 'b\" : x = 1"]);
    assert.deepEqual(result.statements.map((s) => s.text), ["print \"     \"", "x = 1"]);
    assert.equal(result.statements[1].column, 16);
});

test("unterminated string runs to the end of the line", () =>
{
    assert.deepEqual(texts("print \"abc: def\nx = 1"), ["print \"        ", "x = 1"].map((t) => t.trim()));
});

test("joins continuation lines", () =>
{
    const result = scan([
        "calldll #u, \"GetWindowRect\", _",
        "    hMain as long, _ ' comment",
        "    result as long",
        "print 1"
    ]);
    assert.equal(result.statements.length, 2);
    assert.equal(result.statements[0].line, 0);
    assert.equal(result.statements[0].endLine, 2);
    assert.match(result.statements[0].text, /^calldll #u, ".*",\s+hMain as long,\s+result as long$/);
    assert.equal(result.statements[1].line, 3);
});

test("underscores inside names are not continuations", () =>
{
    assert.deepEqual(texts("open t$ for window_\nprint 1").length, 2);
});

test("labels at statement start become their own statements", () =>
{
    const result = scan(["  [main] print 1", "if x then [skip]"]);
    assert.deepEqual(result.statements.map((s) => s.text), ["[main]", "print 1", "if x then [skip]"]);
    assert.equal(result.statements[0].column, 2);
});

test("skips numeric line labels", () =>
{
    assert.deepEqual(texts("10 REM count\n20 for x = 1 to 10\n30 next x"), ["for x = 1 to 10", "next x"]);
});

test("reports comment-only lines", () =>
{
    const result = scan(["' a", "  rem b", "x = 1 ' c", "", "10 rem d"]);
    assert.deepEqual(result.commentLines, [0, 1]);
});
