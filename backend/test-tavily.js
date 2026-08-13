import "dotenv/config";

console.log("Tavily key loaded:", Boolean(process.env.TAVILY_API_KEY));

const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "latest CBSE Class 10 updates",
        max_results: 5
    })
});

const data = await response.json();

console.log("STATUS:", response.status);
console.log("RESULTS:", data.results?.length || 0);
console.log(JSON.stringify(data, null, 2));
