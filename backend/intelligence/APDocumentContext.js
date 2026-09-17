import {
    chunkText
} from "./APTextChunker.js";
import {
    rankTextItems
} from "./APRetrieval.js";

export function buildDocumentChunks(
    documents = []
) {
    const chunks = [];

    for (
        const document of documents
    ) {
        const id =
            String(
                document?.id ||
                document?.name ||
                "document"
            );

        const title =
            String(
                document?.title ||
                document?.name ||
                id
            );

        const parts =
            chunkText(
                document?.text ||
                ""
            );

        parts.forEach(
            (
                text,
                index
            ) => {
                chunks.push({
                    id:
                        id +
                        ":" +
                        index,
                    documentId:
                        id,
                    title,
                    text,
                    chunkIndex:
                        index
                });
            }
        );
    }

    return chunks;
}

export function retrieveDocumentContext(
    query,
    documents = [],
    {
        topK = 4
    } = {}
) {
    return rankTextItems(
        query,
        buildDocumentChunks(
            documents
        ),
        {
            topK,
            getText:
                item =>
                    item.title +
                    " " +
                    item.text
        }
    );
}
