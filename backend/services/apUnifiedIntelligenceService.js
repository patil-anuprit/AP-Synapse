import { createAPUnifiedStream } from "../intelligence/index.js";

export async function createStream(messages) {
    return createAPUnifiedStream(messages);
}
