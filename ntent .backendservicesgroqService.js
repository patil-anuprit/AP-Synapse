[35mbackend/database/db.js[m[36m:[m[32m6[m[36m:[m    connectionString: [1;31mprocess.env[m.DATABASE_URL,
[35mbackend/database/db.js[m[36m:[m[32m14[m[36m:[m    if (![1;31mprocess.env[m.DATABASE_URL) {
[35mbackend/package-lock.json[m[36m:[m[32m18[m[36m:[m        "[1;31mgroq[m-sdk": "^1.3.0",
[35mbackend/package-lock.json[m[36m:[m[32m1009[m[36m:[m      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvO[1;31mgroQ[mOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
[35mbackend/package-lock.json[m[36m:[m[32m1714[m[36m:[m    "node_modules/[1;31mgroq[m-sdk": {
[35mbackend/package-lock.json[m[36m:[m[32m1716[m[36m:[m      "resolved": "https://registry.npmjs.org/[1;31mgroq[m-sdk/-/[1;31mgroq[m-sdk-1.3.0.tgz",
[35mbackend/package-lock.json[m[36m:[m[32m1720[m[36m:[m        "[1;31mgroq[m-sdk": "bin/cli"
[35mbackend/package-lock.json[m[36m:[m[32m2818[m[36m:[m      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvO[1;31mgroQ[mOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
[35mbackend/package.json[m[36m:[m[32m17[m[36m:[m    "[1;31mgroq[m-sdk": "^1.3.0",
[35mbackend/server.js[m[36m:[m[32m61[m[36m:[m    [1;31mprocess.env[m.GOOGLE_CLIENT_ID
[35mbackend/server.js[m[36m:[m[32m65[m[36m:[mconst PORT = [1;31mprocess.env[m.PORT || 5000;
[35mbackend/server.js[m[36m:[m[32m638[m[36m:[m- [1;31mGroq[m
[35mbackend/server.js[m[36m:[m[32m1192[m[36m:[m            audience: [1;31mprocess.env[m.GOOGLE_CLIENT_ID
[35mbackend/server.js[m[36m:[m[32m1310[m[36m:[m            [1;31mprocess.env[m.BREVO_API_KEY &&
[35mbackend/server.js[m[36m:[m[32m1311[m[36m:[m            [1;31mprocess.env[m.BREVO_SENDER_EMAIL
[35mbackend/server.js[m[36m:[m[32m1314[m[36m:[m            Boolean([1;31mprocess.env[m.BREVO_SENDER_EMAIL),
[35mbackend/server.js[m[36m:[m[32m1316[m[36m:[m            Boolean([1;31mprocess.env[m.BREVO_REPLY_TO_EMAIL)
[35mbackend/services/deepseekService.js[m[36m:[m[32m5[m[36m:[mif (![1;31mprocess.env[m.DEEPSEEK_API_KEY) {
[35mbackend/services/deepseekService.js[m[36m:[m[32m25[m[36m:[m                    `Bearer ${[1;31mprocess.env[m.DEEPSEEK_API_KEY}`
[35mbackend/services/deepseekService.js[m[36m:[m[32m30[m[36m:[m                    [1;31mprocess.env[m.DEEPSEEK_MODEL ||
[35mbackend/services/emailService.js[m[36m:[m[32m8[m[36m:[m    apiKey: [1;31mprocess.env[m.BREVO_API_KEY,
[35mbackend/services/emailService.js[m[36m:[m[32m17[m[36m:[m        [1;31mprocess.env[m.BREVO_SENDER_NAME ||
[35mbackend/services/emailService.js[m[36m:[m[32m21[m[36m:[m        [1;31mprocess.env[m.BREVO_SENDER_EMAIL ||
[35mbackend/services/emailService.js[m[36m:[m[32m26[m[36m:[m    [1;31mprocess.env[m.BREVO_REPLY_TO_EMAIL
[35mbackend/services/emailService.js[m[36m:[m[32m29[m[36m:[m                [1;31mprocess.env[m.BREVO_REPLY_TO_EMAIL,
[35mbackend/services/emailService.js[m[36m:[m[32m32[m[36m:[m                [1;31mprocess.env[m.BREVO_REPLY_TO_NAME ||
[35mbackend/services/emailService.js[m[36m:[m[32m44[m[36m:[m    if (![1;31mprocess.env[m.BREVO_API_KEY) {
[35mbackend/services/emailService.js[m[36m:[m[32m905[m[36m:[m        [1;31mprocess.env[m.BREVO_API_KEY &&
[35mbackend/services/emailService.js[m[36m:[m[32m906[m[36m:[m        [1;31mprocess.env[m.BREVO_SENDER_EMAIL
[35mbackend/services/geminiImageService.js[m[36m:[m[32m6[m[36m:[mif (![1;31mprocess.env[m.GEMINI_API_KEY) {
[35mbackend/services/geminiImageService.js[m[36m:[m[32m11[m[36m:[m    apiKey: [1;31mprocess.env[m.GEMINI_API_KEY
[35mbackend/services/geminiImageService.js[m[36m:[m[32m26[m[36m:[m            [1;31mprocess.env[m.GEMINI_IMAGE_MODEL ||
[35mbackend/services/geminiService.js[m[36m:[m[32m6[m[36m:[mif (![1;31mprocess.env[m.GEMINI_API_KEY) {
[35mbackend/services/geminiService.js[m[36m:[m[32m11[m[36m:[m    [1;31mprocess.env[m.GEMINI_API_KEY
[35mbackend/services/geminiService.js[m[36m:[m[32m23[m[36m:[m        model: [1;31mprocess.env[m.GEMINI_MODEL || "gemini-3.6-flash"
[35mbackend/services/groqService.js[m[36m:[m[32m1[m[36m:[mimport [1;31mGroq[m from "[1;31mgroq[m-sdk";
[35mbackend/services/groqService.js[m[36m:[m[32m6[m[36m:[mif (![1;31mprocess.env[m.[1;31mGROQ[m_API_KEY) {
[35mbackend/services/groqService.js[m[36m:[m[32m7[m[36m:[m    throw new Error("Missing [1;31mGROQ[m_API_KEY");
[35mbackend/services/groqService.js[m[36m:[m[32m10[m[36m:[mconst [1;31mgroq[m = new [1;31mGroq[m({
[35mbackend/services/groqService.js[m[36m:[m[32m11[m[36m:[m    apiKey: [1;31mprocess.env[m.[1;31mGROQ[m_API_KEY
[35mbackend/services/groqService.js[m[36m:[m[32m22[m[36m:[m        console.log("📤 Sending request to [1;31mGroq[m...");
[35mbackend/services/groqService.js[m[36m:[m[32m26[m[36m:[m        const stream = await [1;31mgroq[m.[1;31mchat.completions[m.create({
[35mbackend/services/groqService.js[m[36m:[m[32m29[m[36m:[m                [1;31mprocess.env[m.[1;31mGROQ[m_MODEL ||
[35mbackend/services/groqService.js[m[36m:[m[32m42[m[36m:[m            `⚡ [1;31mGroq[m stream accepted in ${
[35mbackend/services/groqService.js[m[36m:[m[32m51[m[36m:[m        console.error("❌ [1;31mGROQ[m ERROR");
[35mbackend/services/openrouterService.js[m[36m:[m[32m5[m[36m:[mif (![1;31mprocess.env[m.OPENROUTER_API_KEY) {
[35mbackend/services/openrouterService.js[m[36m:[m[32m25[m[36m:[m                    `Bearer ${[1;31mprocess.env[m.OPENROUTER_API_KEY}`,
[35mbackend/services/router.js[m[36m:[m[32m1[m[36m:[mimport { createStream as [1;31mgroq[m } from "./[1;31mgroq[mService.js";
[35mbackend/services/router.js[m[36m:[m[32m226[m[36m:[m    // [1;31mGROQ[m → GEMINI → DEEPSEEK → OPENROUTER
[35mbackend/services/router.js[m[36m:[m[32m234[m[36m:[m    const [1;31mgroq[mStream =
[35mbackend/services/router.js[m[36m:[m[32m236[m[36m:[m            "[1;31mGroq[m",
[35mbackend/services/router.js[m[36m:[m[32m237[m[36m:[m            [1;31mgroq[m,
[35mbackend/services/router.js[m[36m:[m[32m241[m[36m:[m    if ([1;31mgroq[mStream) {
[35mbackend/services/router.js[m[36m:[m[32m242[m[36m:[m        return [1;31mgroq[mStream;
[35mbackend/services/stabilityImageService.js[m[36m:[m[32m7[m[36m:[m    if (![1;31mprocess.env[m.STABILITY_API_KEY) {
[35mbackend/services/stabilityImageService.js[m[36m:[m[32m31[m[36m:[m                    `Bearer ${[1;31mprocess.env[m.STABILITY_API_KEY}`,
[35mbackend/services/webSources.js[m[36m:[m[32m38[m[36m:[m        [1;31mprocess.env[m.TAVILY_API_KEY;
[35mbackend/test-tavily.js[m[36m:[m[32m3[m[36m:[mconsole.log("Tavily key loaded:", Boolean([1;31mprocess.env[m.TAVILY_API_KEY));
[35mbackend/test-tavily.js[m[36m:[m[32m11[m[36m:[m        api_key: [1;31mprocess.env[m.TAVILY_API_KEY,
