import { test } from "node:test";
import assert from "node:assert/strict";

import { buildLaunchCommand, LaunchSettings } from "../launch";

const defaults: LaunchSettings = {
    executablePath: "C:\\LB\\liberty.exe",
    executableWrapper: [],
    minimizeEditor: false,
    exitWhenFinished: false
};

const file = "C:\\My Programs\\prog.bas";

test("run, debug and tokenize use the documented switches", () =>
{
    assert.deepEqual(buildLaunchCommand(defaults, "run", file),
        { command: "C:\\LB\\liberty.exe", args: ["-R", file] });
    assert.deepEqual(buildLaunchCommand(defaults, "debug", file),
        { command: "C:\\LB\\liberty.exe", args: ["-D", file] });
    assert.deepEqual(buildLaunchCommand(defaults, "tokenize", file),
        { command: "C:\\LB\\liberty.exe", args: ["-T", "-A", file] });
});

test("optional switches come after the mode and before the file", () =>
{
    const settings = { ...defaults, minimizeEditor: true, exitWhenFinished: true };
    assert.deepEqual(buildLaunchCommand(settings, "run", file).args, ["-R", "-A", "-M", file]);
    assert.deepEqual(buildLaunchCommand(settings, "tokenize", file).args, ["-T", "-A", "-M", file]);
});

test("a wrapper command goes in front of the executable", () =>
{
    const settings = { ...defaults, executablePath: "/opt/lb/liberty.exe", executableWrapper: ["wine"] };
    assert.deepEqual(buildLaunchCommand(settings, "run", "/home/me/prog.bas"),
        { command: "wine", args: ["/opt/lb/liberty.exe", "-R", "/home/me/prog.bas"] });

    const python = { ...defaults, executablePath: "fake_liberty.py", executableWrapper: ["py", "-3"] };
    assert.deepEqual(buildLaunchCommand(python, "debug", file),
        { command: "py", args: ["-3", "fake_liberty.py", "-D", file] });
});

test("blank wrapper entries are ignored", () =>
{
    const settings = { ...defaults, executableWrapper: ["", "  "] };
    assert.equal(buildLaunchCommand(settings, "run", file).command, "C:\\LB\\liberty.exe");
});
