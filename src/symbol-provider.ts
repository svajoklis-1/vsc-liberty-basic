import {
    DocumentSymbolProvider,
    TextDocument, CancellationToken,
    ProviderResult,
    DocumentSymbol, SymbolInformation,
    SymbolKind,
    Range,
    Position
} from "vscode";

const labelRegexp = /((^|.*?:)[ \t]*)(\[[a-z._$][a-z._$0-9]+\])/i;

const functionRegexp = /(((^|.*?:)[ \t]*)function[ \t]+)([a-z._$][a-z._$0-9]+)[ \t]*\((.*)\)/i;

const subRegexp = /(((^|.*?:)[ \t]*)sub[ \t]+)([a-z._$][a-z._$0-9]+)[ \t]*(.*?)[ \t]*(:|$)/i;

class LibertyBasicDocumentSymbolProvider implements DocumentSymbolProvider
{
    private matchLabels (document: TextDocument, symbols: DocumentSymbol[])
    {
        const lineCount = document.lineCount;
        for (let i = 0; i < lineCount; i += 1)
        {
            let lineText = document.lineAt(i).text;

            let charactersRemoved = 0;
            let labelMatch = null;
            while (labelMatch = lineText.match(labelRegexp))
            {
                const range = new Range(
                    new Position(i, charactersRemoved + labelMatch[1].length),
                    new Position(i, charactersRemoved + labelMatch[0].length)
                );

                symbols.push(
                    new DocumentSymbol(
                        labelMatch[3],
                        "",
                        SymbolKind.Null,
                        range,
                        range
                    )
                );

                charactersRemoved += labelMatch[0].length;
                lineText = lineText.replace(labelRegexp, "");
            }
        }
    }

    private matchFunctions (document: TextDocument, symbols: DocumentSymbol[])
    {
        const lineCount = document.lineCount;
        for (let i = 0; i < lineCount; i += 1)
        {
            let lineText = document.lineAt(i).text;

            let charactersRemoved = 0;
            let functionMatch = null;
            while (functionMatch = lineText.match(functionRegexp))
            {
                const range = new Range(
                    new Position(i, charactersRemoved + functionMatch[2].length),
                    new Position(i, charactersRemoved + functionMatch[0].length)
                );

                symbols.push(
                    new DocumentSymbol(
                        functionMatch[4],
                        `function (${functionMatch[5]})`,
                        SymbolKind.Function,
                        range,
                        range
                    )
                );

                charactersRemoved += functionMatch[0].length;
                lineText = lineText.replace(functionRegexp, "");
            }
        }
    }

    private matchSubs (document: TextDocument, symbols: DocumentSymbol[])
    {
        const lineCount = document.lineCount;
        for (let i = 0; i < lineCount; i += 1)
        {
            let lineText = document.lineAt(i).text;

            let charactersRemoved = 0;
            let subMatch = null;
            while (subMatch = lineText.match(subRegexp))
            {
                const range = new Range(
                    new Position(i, charactersRemoved + subMatch[2].length),
                    new Position(i, charactersRemoved + subMatch[0].length)
                );

                symbols.push(
                    new DocumentSymbol(
                        subMatch[4],
                        `sub ${subMatch[5]}`,
                        SymbolKind.Function,
                        range,
                        range
                    )
                );

                charactersRemoved += subMatch[0].length;
                lineText = lineText.replace(subRegexp, "");
            }
        }
    }
    
    public provideDocumentSymbols (
        document: TextDocument, token: CancellationToken
    ): ProviderResult<SymbolInformation[] | DocumentSymbol[]>
    {
        const symbols: DocumentSymbol[] = [];

        this.matchLabels(document, symbols);
        this.matchFunctions(document, symbols);
        this.matchSubs(document, symbols);

        return symbols;
    }
}

export default LibertyBasicDocumentSymbolProvider;
