"""Stand-in for LIBERTY.EXE, for checking the extension's Run/Debug/Make TKN commands
without Liberty BASIC installed.

It parses its command line the way LB 4.5.1 documents its switches
("Using a Different Code Editor" in the help), then reports what it received in a
window and appends the same report to fake_liberty.log next to this script.

Use it from VS Code user settings (pythonw avoids an extra console window):

    "libertybasic.executableWrapper": ["pythonw"],
    "libertybasic.executablePath": "D:\\path\\to\\test\\fake-liberty\\fake_liberty.py"

Set FAKE_LIBERTY_NO_GUI=1 to print the report instead of opening a window.
Exit code is 0 when everything looks right, 1 when there are problems.
"""

import datetime
import os
import sys

SWITCHES = {
    "-R": "run a BAS file on startup",
    "-D": "debug a BAS file on startup",
    "-T": "make a TKN file from a BAS file (registered version only)",
    "-A": "exit LB when the BAS file completes (registered version only)",
    "-M": "minimize the LB editor on startup (registered version only)",
}
MODES = ("-R", "-D", "-T")

LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fake_liberty.log")


def raw_command_line():
    """The command line exactly as Windows passed it, quotes included."""
    if sys.platform != "win32":
        return None
    import ctypes
    get_command_line = ctypes.windll.kernel32.GetCommandLineW
    get_command_line.restype = ctypes.c_wchar_p
    return get_command_line()


def analyze(args):
    lines = []
    problems = []

    switches = [a for a in args if a.startswith("-")]
    files = [a for a in args if not a.startswith("-")]

    lines.append("Switches:")
    for switch in switches:
        meaning = SWITCHES.get(switch.upper())
        if meaning is None:
            problems.append(f"Unknown switch {switch}")
            meaning = "UNKNOWN"
        lines.append(f"  {switch}  {meaning}")
    if not switches:
        lines.append("  (none)")

    modes = [s.upper() for s in switches if s.upper() in MODES]
    if len(modes) != 1:
        problems.append(f"Expected exactly one of -R, -D, -T; got {modes or 'none'}")

    seen_file_arg = False
    for i, arg in enumerate(args):
        if not arg.startswith("-"):
            seen_file_arg = True
        elif seen_file_arg:
            problems.append(f"Switch {arg} comes after the file name (argument {i + 1})")

    lines.append("")
    if len(files) != 1:
        problems.append(f"Expected exactly one file argument, got {len(files)}: {files}")
    for path in files:
        lines.append(f"File: {path}")
        if not os.path.isabs(path):
            lines.append(f"  (relative; resolves to {os.path.abspath(path)})")
        if " " in path:
            lines.append("  Note: path contains spaces. It arrived as one argument here, but"
                         " check with real LB that it accepts quoted paths.")
        if not path.lower().endswith(".bas"):
            problems.append(f"File does not end in .bas: {path}")
        if not os.path.isfile(path):
            problems.append(f"File does not exist: {path}")
            continue

        stat = os.stat(path)
        age = datetime.datetime.now().timestamp() - stat.st_mtime
        lines.append(f"  {stat.st_size} bytes, saved {age:.1f} seconds ago")
        with open(path, encoding="latin-1") as source:
            head = [line.rstrip("\r\n") for _, line in zip(range(5), source)]
        lines.append("  First lines:")
        lines.extend(f"    | {line}" for line in head)

    return lines, problems


def build_report():
    args = sys.argv[1:]
    lines, problems = analyze(args)

    header = [
        f"fake_liberty.py at {datetime.datetime.now():%Y-%m-%d %H:%M:%S}",
        f"Working directory: {os.getcwd()}",
    ]
    raw = raw_command_line()
    if raw is not None:
        header.append(f"Raw command line: {raw}")
    header.append(f"Arguments: {args}")
    header.append("")

    footer = ["", "Problems:" if problems else "No problems found."]
    footer.extend(f"  - {problem}" for problem in problems)

    return "\n".join(header + lines + footer), not problems


def show_window(report, ok):
    import tkinter
    from tkinter import scrolledtext

    root = tkinter.Tk()
    root.title("fake Liberty BASIC: " + ("OK" if ok else "PROBLEMS"))
    text = scrolledtext.ScrolledText(root, width=110, height=28, font=("Consolas", 10))
    text.insert("1.0", report)
    text.configure(state="disabled", background="#e8f5e9" if ok else "#ffebee")
    text.pack(fill="both", expand=True)
    tkinter.Button(root, text="Close", command=root.destroy).pack(pady=6)
    root.mainloop()


def main():
    report, ok = build_report()

    with open(LOG_PATH, "a", encoding="utf-8") as log:
        log.write(report + "\n" + "-" * 80 + "\n")

    if os.environ.get("FAKE_LIBERTY_NO_GUI") == "1":
        print(report)
    else:
        try:
            show_window(report, ok)
        except Exception:  # no tkinter or no display: fall back to the console
            print(report)

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
