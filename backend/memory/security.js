const blockedWords = [

    "password",

    "api key",

    "token",

    "otp",

    "credit card",

    "cvv",

    "bank account"

];

export function shouldStore(text) {

    const lower = text.toLowerCase();

    return !blockedWords.some(word => lower.includes(word));

}