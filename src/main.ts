import * as vscode from 'vscode';
import { createReadStream } from 'fs';

import LibertyBasicDocumentSymbolProvider from "./symbol-provider";

export function activate (ctx: vscode.ExtensionContext): void
{
    // registerSymbolProvider(DocumentSelector, DocumentSymbolProvider, metaData)

    /* ctx.subscriptions.push(vscode.languages.registerXProvider(MODE?, new Provider())) */

    ctx.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            { language: "libertybasic" },
            new LibertyBasicDocumentSymbolProvider(),
            { label: "Liberty BASIC" }
        )
    );
}
