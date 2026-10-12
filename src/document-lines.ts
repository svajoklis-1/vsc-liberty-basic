import { TextDocument } from "vscode";

export function documentLines (document: TextDocument): string[]
{
    const lines: string[] = [];
    for (let i = 0; i < document.lineCount; i += 1)
    {
        lines.push(document.lineAt(i).text);
    }
    return lines;
}
