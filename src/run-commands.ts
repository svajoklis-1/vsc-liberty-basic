import * as vscode from "vscode";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, isAbsolute } from "node:path";

import { buildLaunchCommand, LaunchCommand, LaunchMode, LaunchSettings } from "./launch";

const section = "libertybasic";

function readSettings (): LaunchSettings
{
    const config = vscode.workspace.getConfiguration(section);
    return {
        executablePath: config.get<string>("executablePath", "").trim(),
        executableWrapper: config.get<string[]>("executableWrapper", []),
        minimizeEditor: config.get<boolean>("minimizeEditor", false),
        exitWhenFinished: config.get<boolean>("exitWhenFinished", false)
    };
}

/** Lets the user pick LIBERTY.EXE; returns true if a path was saved. */
async function askForExecutable (message: string): Promise<boolean>
{
    const browse = "Browse...";
    const openSettings = "Open Settings";
    const choice = await vscode.window.showErrorMessage(message, browse, openSettings);

    if (choice === browse)
    {
        const picked = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: "Use for Liberty BASIC",
            filters: { "Programs": ["exe"], "All files": ["*"] }
        });
        if (picked !== undefined && picked.length > 0)
        {
            await vscode.workspace.getConfiguration(section)
                .update("executablePath", picked[0].fsPath, vscode.ConfigurationTarget.Global);
            return true;
        }
    }
    else if (choice === openSettings)
    {
        await vscode.commands.executeCommand("workbench.action.openSettings", `${section}.executablePath`);
    }
    return false;
}

async function resolveSettings (): Promise<LaunchSettings | undefined>
{
    for (;;)
    {
        const settings = readSettings();
        let problem: string | undefined;

        if (settings.executablePath === "")
        {
            problem = "Set the path to Liberty BASIC (liberty.exe) to run programs.";
        }
        else if (!isAbsolute(settings.executablePath))
        {
            problem = `The Liberty BASIC path must be absolute: ${settings.executablePath}`;
        }
        else if (!existsSync(settings.executablePath))
        {
            problem = `Liberty BASIC was not found at ${settings.executablePath}`;
        }

        if (problem === undefined)
        {
            return settings;
        }
        if (!await askForExecutable(problem))
        {
            return undefined;
        }
    }
}

/** Saves the document if needed (LB reads the file from disk) and returns its path. */
async function savedFilePath (uri: vscode.Uri | undefined): Promise<string | undefined>
{
    const document = uri !== undefined
        ? await vscode.workspace.openTextDocument(uri)
        : vscode.window.activeTextEditor?.document;

    if (document === undefined || document.languageId !== "libertybasic")
    {
        vscode.window.showErrorMessage("Open a Liberty BASIC file to run it.");
        return undefined;
    }

    let fileUri = document.uri;
    if (document.isUntitled || document.isDirty)
    {
        const saved = await vscode.workspace.save(document.uri);
        if (saved === undefined)
        {
            return undefined;
        }
        fileUri = saved;
    }

    if (fileUri.scheme !== "file")
    {
        vscode.window.showErrorMessage("Liberty BASIC can only run files saved on this computer.");
        return undefined;
    }
    return fileUri.fsPath;
}

function start (launch: LaunchCommand, cwd: string): Promise<void>
{
    return new Promise((resolve, reject) =>
    {
        const child = spawn(launch.command, launch.args, { cwd, detached: true, stdio: "ignore" });
        child.once("error", reject);
        child.once("spawn", () =>
        {
            child.unref();
            resolve();
        });
    });
}

async function launchFile (log: vscode.LogOutputChannel, mode: LaunchMode, uri: vscode.Uri | undefined)
{
    const filePath = await savedFilePath(uri);
    if (filePath === undefined)
    {
        return;
    }

    const settings = await resolveSettings();
    if (settings === undefined)
    {
        return;
    }

    const launch = buildLaunchCommand(settings, mode, filePath);
    const cwd = dirname(filePath);
    log.info(`Starting in ${cwd}: ${JSON.stringify([launch.command, ...launch.args])}`);

    try
    {
        await start(launch, cwd);
        vscode.window.setStatusBarMessage(`Started Liberty BASIC: ${basename(filePath)}`, 3000);
    }
    catch (error)
    {
        const message = error instanceof Error ? error.message : String(error);
        log.error(`Failed to start: ${message}`);
        vscode.window.showErrorMessage(`Could not start Liberty BASIC: ${message}`);
    }
}

export function registerRunCommands (ctx: vscode.ExtensionContext): void
{
    const log = vscode.window.createOutputChannel("Liberty BASIC", { log: true });

    const commands: [string, LaunchMode][] = [
        ["libertybasic.run", "run"],
        ["libertybasic.debug", "debug"],
        ["libertybasic.makeTkn", "tokenize"]
    ];

    ctx.subscriptions.push(
        log,
        ...commands.map(([id, mode]) => vscode.commands.registerCommand(
            id, (uri?: vscode.Uri) => launchFile(log, mode, uri)
        ))
    );
}
