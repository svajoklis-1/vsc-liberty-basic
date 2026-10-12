// Builds the command line for starting LIBERTY.EXE on a .bas file, independent
// of the vscode API. Switches are documented in the LB 4.5.1 help under
// "Using a Different Code Editor":
//   -R  run a BAS file on startup
//   -D  debug a BAS file on startup
//   -T  make a TKN file from a BAS file (registered version only)
//   -A  exit LB when the BAS file completes (registered version only)
//   -M  minimize the LB editor on startup (registered version only)

export type LaunchMode = "run" | "debug" | "tokenize";

export interface LaunchSettings
{
    /** Path to LIBERTY.EXE (or a stand-in). */
    executablePath: string;
    /** Command to start the executable through, e.g. ["wine"]. Empty to start it directly. */
    executableWrapper: readonly string[];
    /** Pass -M. */
    minimizeEditor: boolean;
    /** Pass -A. */
    exitWhenFinished: boolean;
}

export interface LaunchCommand
{
    command: string;
    args: string[];
}

export function buildLaunchCommand (
    settings: LaunchSettings, mode: LaunchMode, filePath: string
): LaunchCommand
{
    const switches: string[] = [];

    switch (mode)
    {
        case "run":
            switches.push("-R");
            break;
        case "debug":
            switches.push("-D");
            break;
        case "tokenize":
            // Making a TKN file has no reason to leave LB open afterwards.
            switches.push("-T", "-A");
            break;
    }

    if (settings.exitWhenFinished && !switches.includes("-A"))
    {
        switches.push("-A");
    }
    if (settings.minimizeEditor)
    {
        switches.push("-M");
    }

    const args = [...switches, filePath];

    const wrapper = settings.executableWrapper.filter((part) => part.trim().length > 0);
    if (wrapper.length > 0)
    {
        return { command: wrapper[0], args: [...wrapper.slice(1), settings.executablePath, ...args] };
    }
    return { command: settings.executablePath, args };
}
