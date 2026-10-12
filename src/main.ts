import * as vscode from 'vscode';

import LibertyBasicDocumentSymbolProvider from "./symbol-provider";
import LibertyBasicFoldingRangeProvider from "./folding-provider";
import { registerRunCommands } from "./run-commands";

const selector: vscode.DocumentSelector = { language: "libertybasic" };

export function activate (ctx: vscode.ExtensionContext): void
{
    ctx.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            selector,
            new LibertyBasicDocumentSymbolProvider(),
            { label: "Liberty BASIC" }
        ),
        vscode.languages.registerFoldingRangeProvider(
            selector,
            new LibertyBasicFoldingRangeProvider()
        )
    );

    registerRunCommands(ctx);
}
