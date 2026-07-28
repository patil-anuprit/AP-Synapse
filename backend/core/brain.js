import identity from "./identity.js";
import creator from "./creator.js";
import mission from "./mission.js";
import personality from "./personality.js";
import capabilities from "./capabilities.js";
import responseRules from "./responseRules.js";
import workspace from "./workspace.js";
import limitations from "./limitations.js";
import security from "./aiSecurity.js";

const modules = [
    identity,
    creator,
    mission,
    personality,
    capabilities,
    responseRules,
    workspace,
    limitations,
    security
];

const enabledModules = modules
    .filter(module => module.enabled)
    .sort((a, b) => a.priority - b.priority);

const brain = enabledModules
    .map(module => module.content.trim())
    .join("\n\n");

export default brain;