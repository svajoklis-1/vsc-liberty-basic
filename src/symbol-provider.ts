import {
    DocumentSymbolProvider,
    TextDocument,
    DocumentSymbol,
    SymbolKind,
    Range
} from "vscode";

import { analyze, Label, Routine } from "./structure";
import { documentLines } from "./document-lines";

function lineRange (document: TextDocument, startLine: number, endLine: number): Range
{
    return new Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
}

function labelSymbol (document: TextDocument, label: Label): DocumentSymbol
{
    return new DocumentSymbol(
        label.name,
        "",
        SymbolKind.Key,
        lineRange(document, label.line, label.endLine),
        new Range(label.line, label.column, label.line, label.column + label.name.length)
    );
}

function routineSymbol (document: TextDocument, routine: Routine): DocumentSymbol
{
    const detail = routine.kind === "function"
        ? `function (${routine.params})`
        : `sub ${routine.params}`.trimEnd();

    const symbol = new DocumentSymbol(
        routine.name,
        detail,
        SymbolKind.Function,
        lineRange(document, routine.line, routine.endLine),
        new Range(
            routine.line, routine.nameColumn,
            routine.line, routine.nameColumn + routine.name.length
        )
    );
    symbol.children = routine.labels.map((label) => labelSymbol(document, label));
    return symbol;
}

class LibertyBasicDocumentSymbolProvider implements DocumentSymbolProvider
{
    public provideDocumentSymbols (document: TextDocument): DocumentSymbol[]
    {
        const structure = analyze(documentLines(document));

        const symbols = [
            ...structure.labels.map((label) => labelSymbol(document, label)),
            ...structure.routines.map((routine) => routineSymbol(document, routine))
        ];
        symbols.sort((a, b) => a.range.start.line - b.range.start.line);
        return symbols;
    }
}

export default LibertyBasicDocumentSymbolProvider;
