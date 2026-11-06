/* AP Synapse secure Markdown renderer. Loaded after Marked and DOMPurify. */
(() => {
    "use strict";
    const escapeHTML = input => String(input ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    window.apSafeMarkdown = function apSafeMarkdown(markdown) {
        const text = String(markdown ?? "");
        if (!window.marked?.parse || !window.DOMPurify?.sanitize) {
            // Fail closed if a CDN cannot load: do not put arbitrary HTML into the DOM.
            return `<pre class="ap-safe-fallback">${escapeHTML(text)}</pre>`;
        }
        const html = window.marked.parse(text, { gfm: true, breaks: true });
        const safeHTML = window.DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "svg", "math"],
            FORBID_ATTR: ["style"],
            ALLOW_DATA_ATTR: false
        });
        return safeHTML.replace(/<table\b[\s\S]*?<\/table>/gi, table =>
            '<div class="ap-quality-table-scroll" role="region" aria-label="Scrollable table" tabindex="0">' + table + '</div>'
        );
    };
})();
