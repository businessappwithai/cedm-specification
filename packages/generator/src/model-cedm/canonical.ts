/**
 * Canonical text for a CEDM application model.
 *
 * Keys keep the order the document was built in — `raiseModelDocument` builds
 * them in the order an author writes them, and a library entity keeps the
 * order its file uses — and a list of plain values is written on one line, as
 * the library writes its enum values. Saving a model twice gives the same
 * bytes, so a diff between two saves is exactly the change.
 */

import { Document, isScalar, visit } from "yaml";
import type { CedmModelDocument } from "../../../../language/cedm";

export function serializeCedmDocument(document: CedmModelDocument, header?: string): string {
  const yaml = new Document(document);
  visit(yaml, {
    Seq(_key, node) {
      if (node.items.length && node.items.every((item) => isScalar(item))) node.flow = true;
    },
  });
  if (header) yaml.commentBefore = header;
  return yaml.toString({
    lineWidth: 0,
    blockQuote: "literal",
    indentSeq: true,
    flowCollectionPadding: false,
  });
}
