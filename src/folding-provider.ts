import {
    FoldingRangeProvider,
    TextDocument,
    FoldingRange,
    FoldingRangeKind
} from "vscode";

import { analyze } from "./structure";
import { documentLines } from "./document-lines";

class LibertyBasicFoldingRangeProvider implements FoldingRangeProvider
{
    public provideFoldingRanges (document: TextDocument): FoldingRange[]
    {
        const structure = analyze(documentLines(document));
        const ranges: FoldingRange[] = [];

        // Keep the closing line (END SUB, NEXT, WEND, ...) visible when folded.
        for (const block of structure.blocks)
        {
            if (block.endLine - 1 > block.startLine)
            {
                ranges.push(new FoldingRange(block.startLine, block.endLine - 1));
            }
        }

        for (const [start, end] of structure.commentRuns)
        {
            ranges.push(new FoldingRange(start, end, FoldingRangeKind.Comment));
        }

        return ranges;
    }
}

export default LibertyBasicFoldingRangeProvider;
