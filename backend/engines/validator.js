export function validateResponse(text) {

    if (!text || text.trim().length === 0) {

        return "I'm sorry, I couldn't generate a response.";

    }

    let response = text.trim();

    // Remove excessive blank lines
    response = response.replace(/\n{3,}/g, "\n\n");

    // Remove trailing spaces
    response = response.replace(/[ \t]+$/gm, "");

    return response;

}