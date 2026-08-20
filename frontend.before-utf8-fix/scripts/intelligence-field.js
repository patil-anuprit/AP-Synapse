import { IntelligenceEngine } from "./intelligence/engine.js";

const canvas = document.getElementById("intelligence-field");

if (canvas) {

    const engine = new IntelligenceEngine(canvas);

    engine.animate();

}