import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface RegExpConfig { pattern: string; flags?: string }

// language-configuration.json is JSONC; it only uses whole-line // comments.
const config = JSON.parse(
    readFileSync(join(__dirname, "..", "..", "language-configuration.json"), "utf8")
        .replace(/^\s*\/\/.*$/gm, "")
);

const toRegExp = (value: string | RegExpConfig): RegExp =>
    typeof value === "string" ? new RegExp(value) : new RegExp(value.pattern, value.flags);

const increase = toRegExp(config.indentationRules.increaseIndentPattern);
const decrease = toRegExp(config.indentationRules.decreaseIndentPattern);
const word = toRegExp(config.wordPattern);

test("indents after block openers", () =>
{
    for (const line of [
        "sub greet who$", "Function f(x)", "if a > b then", "  IF a THEN ' note",
        "else", "for i = 1 to 10", "while x < 3", "do", "do while x", "select case x", "case 1, 2", "case else"
    ])
    {
        assert.match(line, increase, line);
    }
});

test("does not indent after single-line statements", () =>
{
    for (const line of [
        "if a then print 1", "if a then [label]", "end sub", "exit for", "x = 1",
        "' sub commented", "done = 1", "do.count = 1", "format$ = 1", "fortune = 3", "sub"
    ])
    {
        assert.doesNotMatch(line, increase, line);
    }
});

test("outdents block closers", () =>
{
    for (const line of [
        "end sub", "End Function", "  end if", "end select", "next", "next i", "wend",
        "loop", "loop until x > 3", "else", "case 2"
    ])
    {
        assert.match(line, decrease, line);
    }
});

test("does not outdent other lines", () =>
{
    for (const line of ["end", "endless = 1", "next.value = 2", "casement = 1", "print else$", "elsewhere = 1"])
    {
        assert.doesNotMatch(line, decrease, line);
    }
});

test("words include dots, $ and handle #", () =>
{
    const words = (text: string): string[] => text.match(new RegExp(word.source, "g")) ?? [];
    assert.deepEqual(words("user.first$ = left$(#win.tb, 2.5)"), ["user.first$", "left$", "#win.tb", "2.5"]);
    assert.deepEqual(words("stylebits #w, _WS_VISIBLE, 0"), ["stylebits", "#w", "_WS_VISIBLE", "0"]);
});
