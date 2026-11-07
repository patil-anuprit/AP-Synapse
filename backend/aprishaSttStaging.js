import express from "express";
import cors from "cors";
import aprishaSttRouter from "./routes/aprishaTranscribe.js";

const required = [
  "GROQ_API_KEY",
  "AP_APRISHA_STT_TEST_TOKEN",
  "AP_APRISHA_STT_ALLOWED_ORIGIN"
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing staging setting: ${name}`);
  }
}

if (process.env.AP_APRISHA_STT_TEST_TOKEN.length < 24) {
  throw new Error("Staging test token must be at least 24 characters");
}

const allowedOrigins = new Set(
  process.env.AP_APRISHA_STT_ALLOWED_ORIGIN
    .split(",")
    .map(value => value.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

const app = express();

app.disable("x-powered-by");

app.use(cors({
  origin(origin, callback) {
    callback(null, Boolean(origin && allowedOrigins.has(origin)));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["x-ap-stt-test-token"]
}));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "APRISHA Mobile STT Staging"
  });
});

app.use("/aprisha/transcribe", aprishaSttRouter);

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("APRISHA STT staging server ready");
});
