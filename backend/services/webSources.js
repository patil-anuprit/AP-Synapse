// ============================================================
// AP SYNAPSE — WEB SOURCES ENGINE — TAVILY
// ============================================================

function cleanQuery(query) {
    return String(query || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);
}

function isUsefulQuery(query) {
    if (!query) return false;

    const q = query.toLowerCase();

    const casualPatterns = [
        /^hi$/,
        /^hello$/,
        /^hey$/,
        /^thanks$/,
        /^thank you$/,
        /^ok$/,
        /^okay$/,
        /^bye$/,
        /^good morning$/,
        /^good night$/,
        /^who are you$/,
        /^what are you$/
    ];

    return !casualPatterns.some(pattern => pattern.test(q));
}


function isNewsQuery(query) {
    return (
        !/\bofficial primary source\b/i.test(query) &&
        /\b(news|headlines|breaking|updates?|developments|announcements)\b/i.test(query)
    );
}


export async function searchWebSources(query) {

    const TAVILY_API_KEY =
        process.env.TAVILY_API_KEY;

    query = cleanQuery(query);

    console.log("🔎 TAVILY QUERY:", query);
    console.log(
        "🔑 TAVILY KEY LOADED:",
        Boolean(TAVILY_API_KEY)
    );

    if (!isUsefulQuery(query)) {
        return [];
    }

    if (!TAVILY_API_KEY) {
        console.warn("⚠️ TAVILY_API_KEY missing.");
        return [];
    }

    try {

        
const response = await fetch(
    "https://api.tavily.com/search",
    {
        method: "POST",

        signal: AbortSignal.timeout(4500),

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query,
            topic: isNewsQuery(query) ? "news" : "general",
            search_depth: "basic",
            
            max_results: 5,
            include_published_date: true,
            include_answer: false,

            include_images: false,
            
            include_raw_content:
                /\bofficial primary source\b/i.test(query)
                    ? "markdown"
                    : false

        })
    }
);


        const data = await response.json();

        if (!response.ok) {

            console.error(
                "❌ TAVILY ERROR:",
                data
            );

            return [];
        }

        const results =
            Array.isArray(data.results)
                ? data.results
                : [];

        console.log(
            "🔗 TAVILY RESULTS:",
            results.length
        );

        
return results
    .filter(item => {
        try {
            const parsed = new URL(item?.url || "");

            return (
                parsed.protocol === "https:" ||
                parsed.protocol === "http:"
            );
        } catch {
            return false;
        }
    })
    .slice(0, 5)
    .map(item => ({
        title: String(
            item.title || "Web source"
        ).slice(0, 180),

        url: item.url,

        snippet: String(
            item.content || ""
        ).slice(0, 1800),

        domain: extractDomain(item.url),

        
        rawContent: String(
            item.raw_content || ""
        ).slice(0, 50000),


        score: Number.isFinite(item.score)
            ? item.score
            : null,

        publishedDate:
            item.published_date ||
            item.publishedDate ||
            ""
    }));


    } catch (error) {

        console.error(
            "❌ Tavily search failed:",
            error.message
        );

        return [];
    }
}

function extractDomain(url) {

    try {

        return new URL(url)
            .hostname
            .replace(/^www\./, "");

    } catch {

        return "";
    }
}
