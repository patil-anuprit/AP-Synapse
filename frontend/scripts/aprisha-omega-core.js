(() => {
  "use strict";

  const VERSION = "1.0.0";
  const MARKER = "AP_APRISHA_OMEGA_CAPABILITY_KERNEL_V1";
  const STORAGE_KEY = "ap_aprisha_omega_v1";
  const MAX_HISTORY = 60;
  const RISK_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

  if (window.__AP_APRISHA_OMEGA_V1__) return;
  window.__AP_APRISHA_OMEGA_V1__ = true;

  const state = {
    skills: new Map(),
    runs: [],
    workflows: new Map(),
    aliases: new Map(),
    policy: {
      maxSteps: 10,
      retryLimit: 1,
      confirmMedium: false,
      confirmHigh: true,
      confirmCritical: true,
      allowLegacyFallback: true,
      bridgeLegacyExecute: true
    },
    externalPlanner: null,
    permissionHandler: null,
    legacyExecutor: null,
    legacyOwner: null,
    legacyDepth: 0,
    lastRun: null,
    bridgeTimer: 0
  };

  const clean = (value) => String(value ?? "").trim();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nowIso = () => new Date().toISOString();
  const id = () => crypto.randomUUID?.() || `omega-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function cloneJson(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }

  function emit(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(`ap:aprisha-omega:${name}`, {
      detail: { version: VERSION, timestamp: Date.now(), ...detail }
    }));
  }

  function loadPersisted() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw || typeof raw !== "object") return;
      if (raw.policy && typeof raw.policy === "object") {
        Object.assign(state.policy, raw.policy);
      }
      for (const [phrase, goal] of Object.entries(raw.aliases || {})) {
        if (clean(phrase) && clean(goal)) state.aliases.set(clean(phrase).toLowerCase(), clean(goal));
      }
      for (const item of Array.isArray(raw.workflows) ? raw.workflows : []) {
        if (item?.name && Array.isArray(item?.steps)) {
          state.workflows.set(clean(item.name).toLowerCase(), {
            name: clean(item.name),
            steps: item.steps.slice(0, 20),
            createdAt: item.createdAt || Date.now()
          });
        }
      }
    } catch (error) {
      console.warn("Aprisha Omega persistence load failed:", error);
    }
  }

  function persist() {
    try {
      const aliases = Object.fromEntries(state.aliases.entries());
      const workflows = [...state.workflows.values()].map((item) => ({
        name: item.name,
        steps: item.steps,
        createdAt: item.createdAt
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: VERSION,
        policy: state.policy,
        aliases,
        workflows
      }));
    } catch (error) {
      console.warn("Aprisha Omega persistence save failed:", error);
    }
  }

  function getSelectedText() {
    try {
      return clean(window.getSelection?.().toString()).slice(0, 1500);
    } catch {
      return "";
    }
  }

  function activeElementInfo() {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;
    const text = clean(
      el.getAttribute?.("aria-label") ||
      el.getAttribute?.("title") ||
      el.getAttribute?.("placeholder") ||
      el.innerText ||
      el.value ||
      el.tagName
    ).slice(0, 180);
    return {
      tag: el.tagName?.toLowerCase() || "",
      type: clean(el.type).toLowerCase(),
      text
    };
  }

  function contextSnapshot(extra = {}) {
    let human = null;
    try {
      human = window.APAprishaHumanInterface?.status?.() || null;
    } catch {}

    return {
      url: location.href,
      origin: location.origin,
      path: location.pathname,
      title: document.title,
      online: navigator.onLine,
      visibility: document.visibilityState,
      selectedText: getSelectedText(),
      activeElement: activeElementInfo(),
      language: navigator.language || "",
      humanInterface: human,
      time: nowIso(),
      ...extra
    };
  }

  function normalizeRisk(value) {
    const risk = clean(value || "low").toLowerCase();
    return Object.prototype.hasOwnProperty.call(RISK_ORDER, risk) ? risk : "low";
  }

  function skillRisk(skill, input, context) {
    try {
      return normalizeRisk(typeof skill.risk === "function" ? skill.risk(input, context) : skill.risk);
    } catch {
      return "high";
    }
  }

  function shouldConfirm(risk, skill, input, context) {
    if (typeof skill.requiresConfirmation === "function") {
      try {
        if (skill.requiresConfirmation(input, context)) return true;
      } catch {
        return true;
      }
    } else if (skill.requiresConfirmation === true) {
      return true;
    }
    if (risk === "critical") return !!state.policy.confirmCritical;
    if (risk === "high") return !!state.policy.confirmHigh;
    if (risk === "medium") return !!state.policy.confirmMedium;
    return false;
  }

  async function requestPermission({ skill, input, context, risk, step }) {
    if (!shouldConfirm(risk, skill, input, context)) return true;

    const request = {
      skill: skill.id,
      description: skill.description || skill.id,
      risk,
      input: cloneJson(input),
      step: cloneJson(step)
    };

    emit("permission-request", request);

    if (typeof state.permissionHandler === "function") {
      try {
        return !!(await state.permissionHandler(request));
      } catch (error) {
        console.warn("Aprisha Omega permission handler failed:", error);
        return false;
      }
    }

    const summary = clean(skill.describe?.(input, context) || skill.description || skill.id);
    return window.confirm(`Aprisha wants to perform a ${risk}-risk action:\n\n${summary}\n\nAllow this action?`);
  }

  function validateSkill(def) {
    if (!def || typeof def !== "object") throw new TypeError("Skill definition must be an object.");
    const skillId = clean(def.id);
    if (!/^[a-z0-9][a-z0-9._-]{1,80}$/i.test(skillId)) throw new Error(`Invalid skill id: ${skillId || "(empty)"}`);
    if (typeof def.execute !== "function") throw new Error(`Skill ${skillId} requires execute().`);
    return { ...def, id: skillId, risk: def.risk || "low" };
  }

  function registerSkill(definition) {
    const skill = validateSkill(definition);
    state.skills.set(skill.id, skill);
    emit("skill-registered", { skill: skill.id });
    return skill.id;
  }

  function unregisterSkill(skillId) {
    const removed = state.skills.delete(clean(skillId));
    if (removed) emit("skill-unregistered", { skill: clean(skillId) });
    return removed;
  }

  function listSkills() {
    return [...state.skills.values()].map((skill) => ({
      id: skill.id,
      description: skill.description || "",
      risk: typeof skill.risk === "string" ? skill.risk : "dynamic"
    }));
  }

  function resolveAlias(goal) {
    let current = clean(goal);
    const visited = new Set();
    for (let i = 0; i < 4; i += 1) {
      const key = current.toLowerCase();
      if (visited.has(key)) break;
      visited.add(key);
      const next = state.aliases.get(key);
      if (!next) break;
      current = next;
    }
    return current;
  }

  function splitGoal(goal) {
    const text = clean(goal);
    if (!text) return [];
    const parts = text
      .split(/\s+(?:and\s+then|then)\s+|\s*;\s*|\n+/i)
      .map(clean)
      .filter(Boolean);
    return parts.length ? parts.slice(0, state.policy.maxSteps) : [text];
  }

  async function scoreSkill(skill, goal, context) {
    if (typeof skill.match !== "function") return null;
    try {
      const result = await skill.match(goal, context);
      if (result == null || result === false) return null;
      if (typeof result === "number") return { score: result, input: { goal } };
      if (result === true) return { score: 0.5, input: { goal } };
      if (typeof result === "object") {
        return {
          score: Number.isFinite(Number(result.score)) ? Number(result.score) : 0.5,
          input: result.input ?? { goal },
          meta: result.meta || null
        };
      }
      return null;
    } catch (error) {
      console.warn(`Aprisha Omega matcher failed for ${skill.id}:`, error);
      return null;
    }
  }

  async function resolveSkill(goal, context) {
    let best = null;
    for (const skill of state.skills.values()) {
      const candidate = await scoreSkill(skill, goal, context);
      if (!candidate || candidate.score <= 0) continue;
      if (!best || candidate.score > best.score) {
        best = { skill, ...candidate };
      }
    }
    return best;
  }

  function normalizePlannerSteps(plan) {
    const rawSteps = Array.isArray(plan) ? plan : plan?.steps;
    if (!Array.isArray(rawSteps)) throw new Error("Planner must return an array of steps or {steps:[...]}.");
    const steps = rawSteps.slice(0, state.policy.maxSteps).map((step, index) => {
      if (typeof step === "string") return { id: `step-${index + 1}`, goal: clean(step) };
      if (!step || typeof step !== "object") throw new Error(`Planner step ${index + 1} is invalid.`);
      return {
        id: clean(step.id) || `step-${index + 1}`,
        goal: clean(step.goal),
        skill: clean(step.skill),
        input: step.input ?? null,
        continueOnError: !!step.continueOnError
      };
    });
    if (!steps.length) throw new Error("Planner returned no steps.");
    return steps;
  }

  async function plan(goal, context = contextSnapshot()) {
    const resolvedGoal = resolveAlias(goal);

    const workflowKey = resolvedGoal.toLowerCase().replace(/^run\s+/, "").trim();
    if (state.workflows.has(workflowKey)) {
      const workflow = state.workflows.get(workflowKey);
      const expanded = [];
      for (const item of workflow.steps.slice(0, state.policy.maxSteps)) {
        if (typeof item === "string") expanded.push({ goal: item });
        else expanded.push(item);
      }
      return {
        source: "workflow",
        goal: resolvedGoal,
        workflow: workflow.name,
        steps: normalizePlannerSteps(expanded)
      };
    }

    if (typeof state.externalPlanner === "function") {
      try {
        const proposed = await state.externalPlanner({
          goal: resolvedGoal,
          context: cloneJson(context),
          skills: listSkills()
        });
        if (proposed) {
          return {
            source: "external",
            goal: resolvedGoal,
            steps: normalizePlannerSteps(proposed)
          };
        }
      } catch (error) {
        console.warn("Aprisha Omega external planner failed; using local planner:", error);
      }
    }

    return {
      source: "local",
      goal: resolvedGoal,
      steps: splitGoal(resolvedGoal).map((segment, index) => ({
        id: `step-${index + 1}`,
        goal: segment,
        skill: "",
        input: null,
        continueOnError: false
      }))
    };
  }

  async function normalizeStep(step, context) {
    if (step.skill) {
      const skill = state.skills.get(step.skill);
      if (!skill) throw new Error(`Unknown Aprisha capability: ${step.skill}`);
      return { ...step, skillObject: skill, input: step.input ?? { goal: step.goal } };
    }

    const resolved = await resolveSkill(step.goal, context);
    if (resolved) {
      return {
        ...step,
        skill: resolved.skill.id,
        skillObject: resolved.skill,
        input: resolved.input,
        matchScore: resolved.score
      };
    }

    const legacy = state.skills.get("aprisha.legacy");
    if (legacy && state.policy.allowLegacyFallback) {
      return {
        ...step,
        skill: legacy.id,
        skillObject: legacy,
        input: { command: step.goal },
        matchScore: 0
      };
    }

    throw new Error(`Aprisha does not yet have a capability for: ${step.goal}`);
  }

  async function verifyResult(skill, result, input, context) {
    if (typeof skill.verify !== "function") return { ok: true, verified: false };
    const verification = await skill.verify(result, input, context);
    if (typeof verification === "boolean") return { ok: verification, verified: true };
    if (verification && typeof verification === "object") {
      return {
        ok: verification.ok !== false,
        verified: true,
        ...verification
      };
    }
    return { ok: !!verification, verified: true };
  }

  async function executeStep(step, runContext) {
    const normalized = await normalizeStep(step, runContext);
    const skill = normalized.skillObject;
    const risk = skillRisk(skill, normalized.input, runContext);

    if (typeof skill.canRun === "function") {
      const canRun = await skill.canRun(normalized.input, runContext);
      if (canRun === false) throw new Error(`${skill.id} cannot run in the current context.`);
      if (typeof canRun === "string") throw new Error(canRun);
    }

    const allowed = await requestPermission({
      skill,
      input: normalized.input,
      context: runContext,
      risk,
      step: normalized
    });
    if (!allowed) {
      const error = new Error(`Permission denied for ${skill.id}.`);
      error.code = "AP_OMEGA_PERMISSION_DENIED";
      throw error;
    }

    emit("step-start", { step: normalized.id, skill: skill.id, risk, goal: normalized.goal });

    const maxAttempts = Math.max(1, Number(state.policy.retryLimit || 0) + 1);
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const started = performance.now();
        const result = await skill.execute(normalized.input, runContext);
        const verification = await verifyResult(skill, result, normalized.input, runContext);

        if (!verification.ok) {
          const error = new Error(verification.message || `Verification failed for ${skill.id}.`);
          error.code = "AP_OMEGA_VERIFICATION_FAILED";
          error.verification = verification;
          throw error;
        }

        const output = {
          stepId: normalized.id,
          goal: normalized.goal,
          skill: skill.id,
          risk,
          attempt,
          durationMs: Math.round(performance.now() - started),
          verified: !!verification.verified,
          verification,
          result: result ?? null
        };
        emit("step-success", output);
        return output;
      } catch (error) {
        lastError = error;
        emit("step-error", {
          step: normalized.id,
          skill: skill.id,
          attempt,
          message: error?.message || String(error)
        });

        if (attempt >= maxAttempts) break;

        if (typeof skill.recover === "function") {
          try {
            const recovery = await skill.recover(error, normalized.input, runContext);
            if (recovery?.input) normalized.input = recovery.input;
            if (recovery?.waitMs) await sleep(Math.min(5000, Math.max(0, Number(recovery.waitMs) || 0)));
          } catch (recoveryError) {
            console.warn(`Aprisha Omega recovery failed for ${skill.id}:`, recoveryError);
          }
        } else {
          await sleep(120);
        }
      }
    }

    throw lastError || new Error(`${skill.id} failed.`);
  }

  async function run(input, options = {}) {
    const request = typeof input === "string" ? { goal: input } : { ...(input || {}) };
    const goal = clean(request.goal || request.command || request.intent);
    if (!goal && !request.skill) throw new Error("Aprisha Omega requires a goal or skill.");

    const runId = id();
    const context = contextSnapshot({
      source: clean(options.source || request.source || "direct") || "direct",
      requestId: runId,
      ...(request.context || {}),
      ...(options.context || {})
    });

    const record = {
      id: runId,
      goal: goal || `skill:${request.skill}`,
      source: context.source,
      status: "planning",
      startedAt: Date.now(),
      finishedAt: null,
      plan: null,
      results: [],
      error: null
    };

    state.lastRun = record;
    state.runs.push(record);
    if (state.runs.length > MAX_HISTORY) state.runs.splice(0, state.runs.length - MAX_HISTORY);
    emit("run-start", { id: runId, goal: record.goal, source: record.source });

    try {
      let executionPlan;
      if (request.skill) {
        executionPlan = {
          source: "explicit",
          goal: record.goal,
          steps: normalizePlannerSteps([{
            skill: clean(request.skill),
            input: request.input ?? {},
            goal: goal || clean(request.skill)
          }])
        };
      } else {
        executionPlan = await plan(goal, context);
      }

      record.plan = cloneJson(executionPlan);
      record.status = "running";
      emit("plan", { id: runId, plan: record.plan });

      for (const step of executionPlan.steps) {
        try {
          const result = await executeStep(step, context);
          record.results.push(result);
          context.lastResult = result.result;
          context.lastSkill = result.skill;
        } catch (error) {
          record.results.push({
            stepId: step.id,
            goal: step.goal,
            skill: step.skill || null,
            error: error?.message || String(error)
          });
          if (!step.continueOnError) throw error;
        }
      }

      record.status = "success";
      record.finishedAt = Date.now();
      emit("run-success", { id: runId, goal: record.goal, results: cloneJson(record.results) });
      return {
        ok: true,
        id: runId,
        goal: record.goal,
        plan: record.plan,
        results: cloneJson(record.results)
      };
    } catch (error) {
      record.status = "error";
      record.finishedAt = Date.now();
      record.error = error?.message || String(error);
      emit("run-error", { id: runId, goal: record.goal, message: record.error });
      throw error;
    }
  }

  function teachAlias(phrase, goal) {
    const from = clean(phrase).toLowerCase();
    const to = clean(goal);
    if (!from || !to) throw new Error("Alias requires both phrase and target goal.");
    state.aliases.set(from, to);
    persist();
    emit("alias-learned", { phrase: from, goal: to });
    return true;
  }

  function forgetAlias(phrase) {
    const removed = state.aliases.delete(clean(phrase).toLowerCase());
    persist();
    return removed;
  }

  function defineWorkflow(name, steps) {
    const workflowName = clean(name);
    if (!workflowName) throw new Error("Workflow needs a name.");
    if (!Array.isArray(steps) || !steps.length) throw new Error("Workflow needs at least one step.");
    if (steps.length > 20) throw new Error("Workflow exceeds the 20-step safety limit.");
    const workflow = {
      name: workflowName,
      steps: cloneJson(steps),
      createdAt: Date.now()
    };
    state.workflows.set(workflowName.toLowerCase(), workflow);
    persist();
    emit("workflow-defined", { name: workflowName, steps: steps.length });
    return workflowName;
  }

  function deleteWorkflow(name) {
    const removed = state.workflows.delete(clean(name).toLowerCase());
    persist();
    return removed;
  }

  function listWorkflows() {
    return [...state.workflows.values()].map((item) => ({
      name: item.name,
      steps: item.steps.length,
      createdAt: item.createdAt
    }));
  }

  function setPolicy(patch = {}) {
    const allowed = [
      "maxSteps",
      "retryLimit",
      "confirmMedium",
      "confirmHigh",
      "confirmCritical",
      "allowLegacyFallback",
      "bridgeLegacyExecute"
    ];
    for (const key of allowed) {
      if (!(key in patch)) continue;
      if (key === "maxSteps") state.policy[key] = Math.min(20, Math.max(1, Number(patch[key]) || 10));
      else if (key === "retryLimit") state.policy[key] = Math.min(2, Math.max(0, Number(patch[key]) || 0));
      else state.policy[key] = !!patch[key];
    }
    persist();
    return { ...state.policy };
  }

  function setPlanner(fn) {
    if (fn != null && typeof fn !== "function") throw new TypeError("Planner must be a function or null.");
    state.externalPlanner = fn || null;
  }

  function setPermissionHandler(fn) {
    if (fn != null && typeof fn !== "function") throw new TypeError("Permission handler must be a function or null.");
    state.permissionHandler = fn || null;
  }

  function setLegacyExecutor(fn, owner = null) {
    if (typeof fn !== "function") throw new TypeError("Legacy executor must be a function.");
    state.legacyExecutor = fn;
    state.legacyOwner = owner;
    emit("legacy-captured", {});
  }

  async function executeLegacy(command) {
    if (typeof state.legacyExecutor !== "function") {
      throw new Error("Existing Aprisha command runtime is not available yet.");
    }
    if (state.legacyDepth > 2) throw new Error("Aprisha legacy execution recursion was blocked.");
    state.legacyDepth += 1;
    try {
      return await state.legacyExecutor.call(state.legacyOwner || window.APAprisha, command);
    } finally {
      state.legacyDepth -= 1;
    }
  }

  function installLegacyBridge() {
    if (!state.policy.bridgeLegacyExecute) return false;
    const owner = window.APAprisha;
    const current = owner?.execute;
    if (!owner || typeof current !== "function") return false;
    if (current.__aprishaOmegaWrapped) return true;

    setLegacyExecutor(current, owner);

    const wrapped = async function aprishaOmegaExecute(command, ...rest) {
      if (state.legacyDepth > 0) {
        return state.legacyExecutor.call(state.legacyOwner || this, command, ...rest);
      }
      return run({ goal: clean(command), source: "APAprisha.execute" }, { source: "APAprisha.execute" });
    };
    Object.defineProperty(wrapped, "__aprishaOmegaWrapped", { value: true });
    Object.defineProperty(wrapped, "__aprishaOmegaVersion", { value: VERSION });
    owner.execute = wrapped;
    emit("bridge-ready", {});
    return true;
  }

  function status() {
    return {
      ready: true,
      version: VERSION,
      marker: MARKER,
      skills: state.skills.size,
      workflows: state.workflows.size,
      aliases: state.aliases.size,
      bridgeReady: !!window.APAprisha?.execute?.__aprishaOmegaWrapped,
      legacyReady: typeof state.legacyExecutor === "function",
      policy: { ...state.policy },
      lastRun: state.lastRun ? {
        id: state.lastRun.id,
        goal: state.lastRun.goal,
        status: state.lastRun.status,
        error: state.lastRun.error
      } : null
    };
  }

  loadPersisted();

  window.APAprishaOmega = {
    version: VERSION,
    marker: MARKER,
    run,
    plan,
    context: contextSnapshot,
    status,
    history: () => cloneJson(state.runs),
    lastRun: () => cloneJson(state.lastRun),
    skills: {
      register: registerSkill,
      unregister: unregisterSkill,
      list: listSkills,
      has: (skillId) => state.skills.has(clean(skillId)),
      get: (skillId) => state.skills.get(clean(skillId)) || null
    },
    workflows: {
      define: defineWorkflow,
      remove: deleteWorkflow,
      list: listWorkflows,
      run: (name, options = {}) => run(`run ${clean(name)}`, { source: options.source || "workflow" })
    },
    aliases: {
      teach: teachAlias,
      forget: forgetAlias,
      list: () => Object.fromEntries(state.aliases.entries())
    },
    setPlanner,
    setPermissionHandler,
    setPolicy,
    captureLegacy: installLegacyBridge,
    executeLegacy,
    emit
  };

  installLegacyBridge();
  state.bridgeTimer = window.setInterval(() => {
    try {
      installLegacyBridge();
    } catch (error) {
      console.warn("Aprisha Omega bridge check failed:", error);
    }
  }, 1200);

  window.addEventListener("pagehide", () => clearInterval(state.bridgeTimer), { once: true });
  emit("ready", { status: status() });
  console.log("APRISHA OMEGA CAPABILITY KERNEL READY", status());
})();
