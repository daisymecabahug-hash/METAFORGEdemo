// ═══════════════════════════════════════════════
// METAFORGE — MAIN SCRIPT
// script.js
// ═══════════════════════════════════════════════

import {
  initFirebase,
  firebaseEnabled,
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  getUserData,
  saveUserData
} from '../firebase.js';

/*
  Auth / persistence:
  - When Firebase is configured, users can sign in and progress syncs to Firestore.
  - When Firebase is not configured (default), the app runs in guest mode and stores progress locally.
  - Progress includes unlocked levels, sparks, and prompt history.
*/

/* ═══════════════════════════════════════════════
   DATA — LEVELS
═══════════════════════════════════════════════ */
const LEVELS = [
  {
    id: 1,
    bloom: "Remembering",
    color: "#38bdf8",
    icon: "💡",
    tagline: "Recall & Recognize",
    desc: "Construct prompts that ask AI to retrieve, list, or identify factual information. Focus on clarity and precision in defining the scope of recall.",
    task: {
      title: "The Definition Task",
      objective: "Write a prompt that instructs an AI to recall and list key definitions and terminology. Your prompt should specify the domain, the number of terms expected, and the format of the output.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou are studying for an AI literacy exam covering fundamental concepts in machine learning.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt to an AI system that will cause it to generate a structured list of <span class="hl3">10 foundational machine learning terms</span> with their definitions.\n\nYour prompt should specify:\n• The <span class="hl">domain</span> (machine learning fundamentals)\n• The <span class="hl">number</span> of terms (exactly 10)\n• The <span class="hl">format</span> expected for each entry\n• The <span class="hl">difficulty level</span> (beginner-friendly)`,
      instructions: [
        "Write your prompt in a separate document or paper.",
        "Be explicit about exactly what information you want recalled.",
        "Specify the format — numbered list, table, or structured output.",
        "Avoid vague language — the AI should not have to guess what 'foundational' means.",
        "Evaluate your prompt using the rubric below. Focus on Criteria 1 and 5."
      ],
      time: "10–15 min",
      difficulty: "Beginner",
      focus: "Explicitness · Format Guidance",
      hint: "Try focusing on the info you want the AI to return: specify the number of items, the level of detail, and the output format (e.g., list, table).",
    }
  },
  {
    id: 2,
    bloom: "Understanding",
    color: "#4ade80",
    icon: "🔍",
    tagline: "Explain & Interpret",
    desc: "Craft prompts that require the AI to summarize, paraphrase, classify, or explain concepts clearly in language appropriate to a specific audience.",
    task: {
      title: "The Concept Translator",
      objective: "Write a prompt that directs an AI to explain a complex concept in accessible language. Your prompt must define the audience, depth of explanation, and use of analogies.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou're creating study material for high school students who have no prior coding experience.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to explain <span class="hl3">how neural networks learn</span> to a non-technical audience.\n\nYour prompt should include:\n• <span class="hl">Audience definition</span> (age group, background)\n• A request for an <span class="hl">analogy</span> to make the concept relatable\n• <span class="hl">Length constraints</span> (e.g., 200–250 words)\n• Instruction to <span class="hl">avoid jargon</span> or define any technical term used\n• A <span class="hl">summary sentence</span> at the end`,
      instructions: [
        "Draft a prompt that specifies audience clearly — don't just say 'explain simply'.",
        "Include explicit instructions about analogies and examples.",
        "Test whether your prompt would produce output a 16-year-old could understand.",
        "Check: Does your prompt address format (paragraph length, no jargon, summary)?",
        "Self-evaluate using Rubric Criteria 1, 2, and 4."
      ],
      time: "15–20 min",
      difficulty: "Beginner–Intermediate",
      focus: "Clarity · Audience Alignment",
      hint: "Think about who you're writing for: specify audience, tone, and any analogies the AI should use. Include a length limit to keep it concise.",
    }
  },
  {
    id: 3,
    bloom: "Applying",
    color: "#facc15",
    icon: "⚙️",
    tagline: "Use & Execute",
    desc: "Design prompts that require AI to solve a specific real-world problem by applying known procedures, methods, or domain knowledge in a new context.",
    task: {
      title: "The Problem Solver",
      objective: "Write a prompt that instructs an AI to solve a specific, well-defined problem using domain knowledge. Your prompt should specify context, constraints, and expected solution format.",
      prompt: `<span class="hl">// SCENARIO</span>\nA small business owner needs to reduce customer churn and has asked for an AI-generated action plan.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt instructing an AI to <span class="hl3">create a 30-day customer retention plan</span> for a subscription-based software product.\n\nYour prompt should include:\n• <span class="hl">Role prompting</span> — assign the AI a relevant persona\n• The <span class="hl">business context</span> (type of product, average users, churn rate ~15%)\n• <span class="hl">Specific deliverables</span> (weekly milestones, tactics per week)\n• <span class="hl">Format requirements</span> (structured table or phased plan)\n• A constraint: <span class="hl">budget under $500/month</span>`,
      instructions: [
        "Use role prompting — assign a persona like 'Act as a Customer Success strategist'.",
        "Provide enough context so the AI doesn't make assumptions about the business.",
        "Specify each week's deliverable to break down the 30-day plan.",
        "Include a constraint (budget, time, resources) to sharpen the output.",
        "Evaluate using Rubric Criteria 3 (strategies), 2 (specificity), and 5 (format)."
      ],
      time: "20–25 min",
      difficulty: "Intermediate",
      focus: "Role Prompting · Constraints · Format",
      hint: "Define the role (e.g., 'customer success strategist'), and make sure you name the constraint (budget, timeline) and the exact deliverable format (table/steps).",
    }
  },
  {
    id: 4,
    bloom: "Analyzing",
    color: "#fb923c",
    icon: "🧩",
    tagline: "Break Down & Compare",
    desc: "Develop prompts that require AI to differentiate, compare, contrast, categorize, or deconstruct complex information into meaningful components.",
    task: {
      title: "The Comparative Analyst",
      objective: "Write a prompt that instructs an AI to analyze and compare two or more subjects across multiple structured dimensions. Your prompt must specify the comparison criteria and output structure.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou are preparing a research brief comparing two competing AI language model approaches for a graduate seminar.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to <span class="hl3">compare GPT-style autoregressive models vs BERT-style masked models</span> across multiple analytical dimensions.\n\nYour prompt must specify:\n• Exactly <span class="hl">which dimensions</span> to compare (e.g., architecture, training objective, use cases, strengths/weaknesses)\n• Output as a <span class="hl">structured comparison table</span> with rows per dimension\n• A <span class="hl">brief analytical paragraph</span> after the table synthesizing key differences\n• A <span class="hl">chain-of-thought directive</span> — ask the AI to reason step-by-step before concluding\n• Minimum <span class="hl">4 comparison dimensions</span>`,
      instructions: [
        "Define each comparison axis explicitly — don't leave any dimension open to interpretation.",
        "Request chain-of-thought: 'Before generating the table, reason through each dimension.'",
        "Specify the output structure: table first, then synthesis paragraph.",
        "Identify which criteria produce genuinely distinct separation between the two subjects.",
        "Evaluate using Rubric Criteria 3 (strategies), 5 (output format), and 6 (cognitive demand)."
      ],
      time: "25–30 min",
      difficulty: "Intermediate–Advanced",
      focus: "Chain-of-Thought · Structured Output · Decomposition",
      hint: "Specifically list the comparison dimensions and ask the AI to think step-by-step before generating the table. Ask for a synthesis paragraph afterward.",
    }
  },
  {
    id: 5,
    bloom: "Evaluating",
    color: "#a78bfa",
    icon: "⚖️",
    tagline: "Judge & Critique",
    desc: "Engineer prompts that direct AI to judge, assess, rank, or critique outputs based on explicit criteria — producing reasoned evaluative conclusions.",
    task: {
      title: "The Critical Evaluator",
      objective: "Write a prompt that asks an AI to evaluate and rank multiple options against explicit criteria, justify each judgment, and produce a final recommendation with caveats.",
      prompt: `<span class="hl">// SCENARIO</span>\nYour university's computer science department is selecting a programming language to teach first-year students in their intro course.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to <span class="hl3">evaluate and rank Python, JavaScript, and Java</span> as first-year teaching languages.\n\nYour prompt must include:\n• <span class="hl">Five explicit evaluation criteria</span> (e.g., learning curve, ecosystem, employability, readability, tooling)\n• A <span class="hl">weighted scoring instruction</span> — define which criteria matter most\n• Request a <span class="hl">ranked comparison table</span> then a justified final recommendation\n• Ask the AI to <span class="hl">acknowledge counterarguments</span> to its recommendation\n• Include a directive to <span class="hl">cite reasoning</span> for each score given`,
      instructions: [
        "Define all five criteria before asking for evaluation — do not let AI choose criteria.",
        "Assign weights (e.g., 'weight readability 30%, employability 25%...').",
        "Ask for a table AND a recommendation paragraph — test that you specified both.",
        "Require counterarguments — this tests whether your prompt captures evaluative nuance.",
        "Evaluate using Rubric Criteria 2, 4, and 6. This task should score highly on criterion 6."
      ],
      time: "30–35 min",
      difficulty: "Advanced",
      focus: "Weighted Criteria · Justified Reasoning · Counterarguments",
      hint: "List the 5 evaluation criteria explicitly, assign weights, and ask the AI to justify each score. Mention you want a ranked table plus recommendation.",
    }
  },
  {
    id: 6,
    bloom: "Creating",
    color: "#f472b6",
    icon: "✨",
    tagline: "Design & Generate",
    desc: "Construct meta-prompts that direct AI to design entirely new artifacts, frameworks, systems, or structured outputs by synthesizing novel combinations of knowledge.",
    task: {
      title: "The Prompt Architect",
      objective: "Write a meta-prompt — a prompt that generates another high-quality prompt. Your meta-prompt must specify all elements of the output prompt including its structure, strategies, format, and evaluation criteria it should satisfy.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou are designing a prompt template library for an educational technology startup. You need to create reusable, high-quality prompts that teachers can deploy for different subjects.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a <span class="hl3">meta-prompt</span> — a prompt that instructs an AI to generate a complete, production-ready prompt template for teaching <span class="hl3">critical thinking skills in high school history</span>.\n\nYour meta-prompt must specify that the generated prompt should include:\n• <span class="hl">Role assignment</span> for the AI (Socratic tutor, debate facilitator, etc.)\n• <span class="hl">Scaffolded sub-questions</span> using decomposition\n• <span class="hl">Format directives</span> (how output should be structured for student use)\n• <span class="hl">Cognitive demand level</span> targeting analysis and evaluation\n• <span class="hl">Modifiable variables</span> marked with [BRACKETS] for teacher customization\n• A built-in <span class="hl">self-evaluation checklist</span> at the end of the template`,
      instructions: [
        "This is a meta-task: your prompt must CREATE another prompt. Think recursively.",
        "Specify exactly what components the output prompt should contain — don't be vague.",
        "Include instructions for using [BRACKET] variables to make the template flexible.",
        "Direct the AI to include a self-evaluation checklist in the generated template.",
        "Evaluate using ALL six rubric criteria — this is the highest-demand task and should target a near-perfect score."
      ],
      time: "40–50 min",
      difficulty: "Expert",
      focus: "Meta-Prompting · Template Design · Synthesis",
      hint: "Ask the AI to produce a prompt template with placeholders (e.g., [TOPIC], [AUDIENCE]) and include a self-evaluation checklist at the end.",
    }
  }
];

/* ═══════════════════════════════════════════════
   DATA — RUBRIC
═══════════════════════════════════════════════ */
const RUBRIC = [
  {
    num: 1,
    title: "Clarity of Prompt (Explicitness)",
    desc: "Measures how clearly the prompt defines the task, format, target audience, and constraints. A clear prompt eliminates ambiguity and leaves no room for the AI to make unwanted assumptions.",
    cite: "Jiang et al. (2023) · Reynolds & McDonell (2021)",
    scores: [
      { val: 1, label: "Beginning",  desc: "Vague or incomplete; task, format, and audience are largely undefined." },
      { val: 2, label: "Developing", desc: "Partially clear; some key elements (audience or format) are missing or implied." },
      { val: 3, label: "Proficient", desc: "Clear task and format; audience is specified with minor ambiguities remaining." },
      { val: 4, label: "Exemplary",  desc: "Fully explicit; task, format, audience, and constraints are all precisely defined." }
    ],
    rrl: "<strong>Jiang et al. (2023)</strong> found that explicit task framing in prompts significantly improves LLM output precision. <strong>Reynolds & McDonell (2021)</strong> established that prompt programming — treating prompts as precise specifications — is fundamental to reliable AI behavior."
  },
  {
    num: 2,
    title: "Specificity / Detail of Information Requested",
    desc: "Measures how detailed the prompt is regarding specific sections, subtopics, reasoning steps, or required inclusions. Specificity prevents generic outputs.",
    cite: "Lee et al. (2022) · Benotti & Cusack (2023)",
    scores: [
      { val: 1, label: "Beginning",  desc: "Highly generic; no specific details or subtopics are requested." },
      { val: 2, label: "Developing", desc: "Some detail provided, but major subtopics or expected depth are unspecified." },
      { val: 3, label: "Proficient", desc: "Most key subtopics and expected depth are addressed with specific language." },
      { val: 4, label: "Exemplary",  desc: "All critical subtopics, reasoning steps, and depth requirements are explicitly stated." }
    ],
    rrl: "<strong>Lee et al. (2022)</strong> demonstrated that prompt specificity is the strongest single predictor of AI output quality. <strong>Benotti & Cusack (2023)</strong> identified under-specification as the primary failure mode in novice prompt writing."
  },
  {
    num: 3,
    title: "Use of Prompt Engineering Strategies",
    desc: "Evaluates whether deliberate techniques are applied — including role prompting, decomposition, chain-of-thought reasoning, few-shot examples, or structured output framing.",
    cite: "Shin et al. (2024) · Reynolds & McDonell (2021)",
    scores: [
      { val: 1, label: "Beginning",  desc: "No recognizable prompt engineering strategies present." },
      { val: 2, label: "Developing", desc: "One strategy loosely applied (e.g., basic role assignment without context)." },
      { val: 3, label: "Proficient", desc: "Two or more strategies clearly applied (e.g., role + decomposition, or CoT + format)." },
      { val: 4, label: "Exemplary",  desc: "Three or more strategies skillfully integrated; strategies complement each other coherently." }
    ],
    rrl: "<strong>Shin et al. (2024)</strong> showed that combining multiple structured prompting strategies produces compoundingly better outputs. <strong>Reynolds & McDonell (2021)</strong> formalized the taxonomy of prompt programming strategies for LLMs."
  },
  {
    num: 4,
    title: "Alignment with Task Objectives / Academic Accuracy",
    desc: "Assesses whether the prompt accurately reflects the learning or task objective and would generate academically relevant, factually grounded output.",
    cite: "Anderson & Krathwohl (2001) · Jones & Hindle (2023)",
    scores: [
      { val: 1, label: "Beginning",  desc: "Prompt is misaligned; would not produce output relevant to the stated objective." },
      { val: 2, label: "Developing", desc: "Partially aligned; some elements drift from the objective or invite inaccurate output." },
      { val: 3, label: "Proficient", desc: "Mostly aligned; prompt would produce academically relevant output with minor drift." },
      { val: 4, label: "Exemplary",  desc: "Fully aligned; prompt precisely targets the learning objective and guards against inaccuracy." }
    ],
    rrl: "<strong>Anderson & Krathwohl (2001)</strong> established that learning tasks must be designed to match the intended cognitive level. <strong>Jones & Hindle (2023)</strong> found that misalignment between prompt intent and AI output is amplified when prompts lack objective grounding."
  },
  {
    num: 5,
    title: "Output Structure / Format Guidance",
    desc: "Measures whether the prompt explicitly instructs the AI on output structure — including format type, length, visual organization, or specific output components.",
    cite: "Zhou & Pan (2023) · Jiang et al. (2023)",
    scores: [
      { val: 1, label: "Beginning",  desc: "No format guidance; output structure is left entirely to the AI." },
      { val: 2, label: "Developing", desc: "Minimal format mentioned (e.g., 'write a list') without structural specifics." },
      { val: 3, label: "Proficient", desc: "Format is clearly specified (e.g., 'a numbered table with 4 columns and a summary paragraph')." },
      { val: 4, label: "Exemplary",  desc: "Precise multi-element format instructions; length, sections, and component ordering are all defined." }
    ],
    rrl: "<strong>Zhou & Pan (2023)</strong> found that output format specification is the second most impactful prompt feature after task clarity. <strong>Jiang et al. (2023)</strong> showed that structured output prompts reduce hallucination rates in LLMs."
  },
  {
    num: 6,
    title: "Cognitive Demand / Higher-Order Thinking",
    desc: "Evaluates whether the prompt requires analysis, synthesis, evaluation, or creative generation rather than simple information retrieval or paraphrase.",
    cite: "Anderson & Krathwohl (2001) · Benotti & Cusack (2023)",
    scores: [
      { val: 1, label: "Beginning",  desc: "Recalls only; no analysis, comparison, judgment, or creation required." },
      { val: 2, label: "Developing", desc: "Basic comprehension or application only; no higher-order thinking demanded." },
      { val: 3, label: "Proficient", desc: "Analysis or evaluation present; prompt requires the AI to reason beyond surface-level recall." },
      { val: 4, label: "Exemplary",  desc: "High-order synthesis or meta-cognitive demand; prompt requires generation, critique, or reflective reasoning." }
    ],
    rrl: "<strong>Anderson & Krathwohl (2001)</strong> established that cognitive demand directly predicts learning depth. <strong>Benotti & Cusack (2023)</strong> found that novice prompters rarely exceed comprehension-level cognitive demand."
  }
];

const TAX_DATA = [
  { name: "Remembering",  color: "#38bdf8", width: 16  },
  { name: "Understanding",color: "#4ade80", width: 30  },
  { name: "Applying",     color: "#facc15", width: 48  },
  { name: "Analyzing",    color: "#fb923c", width: 65  },
  { name: "Evaluating",   color: "#a78bfa", width: 82  },
  { name: "Creating",     color: "#f472b6", width: 100 }
];

/* ═══════════════════════════════════════════════
   PROGRESS (local state + optional Firebase sync)
═══════════════════════════════════════════════ */
const STATE_KEY = 'metaforge_state_v2';
const SPARKS_PER_ATTEMPT = 12;
const SPARKS_FOR_HINT = 20;
const SPARKS_PER_LEVEL = 80;

const DEFAULT_STATE = {
  sparks: 0,
  progress: 0,
  unlockedLevels: [1],
  promptHistory: {},
  achievements: [],
  lastUpdated: Date.now()
};

let currentState = null;
let currentUser = { uid: null, email: null, isGuest: true };

function createInitialState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadStateFromLocal() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return { ...createInitialState(), ...parsed };
  } catch (e) {
    console.warn('Failed to parse local state:', e);
    return createInitialState();
  }
}

function saveStateToLocal(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Unable to save state locally:', e);
  }
}

function mergeState(primary, incoming) {
  const merged = { ...primary };
  if (!incoming) return merged;

  merged.sparks = Math.max(primary.sparks || 0, incoming.sparks || 0);
  merged.progress = Math.max(primary.progress || 0, incoming.progress || 0);
  merged.unlockedLevels = Array.from(new Set([...(primary.unlockedLevels || []), ...(incoming.unlockedLevels || [])]));

  merged.promptHistory = { ...(primary.promptHistory || {}) };
  Object.entries(incoming.promptHistory || {}).forEach(([levelId, entries]) => {
    const base = merged.promptHistory[levelId] || [];
    const mergedEntries = [...base, ...entries];
    merged.promptHistory[levelId] = mergedEntries
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 30); // keep last 30 entries per level
  });

  merged.achievements = Array.from(new Set([...(primary.achievements || []), ...(incoming.achievements || [])]));
  merged.lastUpdated = Date.now();
  return merged;
}

async function loadState() {
  const localState = loadStateFromLocal();
  currentState = { ...localState };

  if (firebaseEnabled() && currentUser.uid && !currentUser.isGuest) {
    try {
      const remote = await getUserData(currentUser.uid);
      if (remote) {
        currentState = mergeState(localState, remote);
      }
      await saveState();
    } catch (e) {
      console.warn('Failed to sync state with Firebase', e);
    }
  }

  return currentState;
}

async function saveState() {
  if (!currentState) return;
  currentState.lastUpdated = Date.now();
  saveStateToLocal(currentState);

  if (firebaseEnabled() && currentUser.uid && !currentUser.isGuest) {
    try {
      await saveUserData(currentUser.uid, currentState);
    } catch (e) {
      console.warn('Failed to save state to Firebase', e);
    }
  }
}

function isLevelUnlocked(levelId) {
  return currentState && Array.isArray(currentState.unlockedLevels) && currentState.unlockedLevels.includes(levelId);
}

function updateSparksUI() {
  const el = document.getElementById('sparks-count');
  if (el && currentState) el.textContent = String(currentState.sparks || 0);
}

function updateClearScore(score) {
  const el = document.getElementById('clear-score');
  if (!el) return;
  if (!score) {
    el.textContent = '—';
    return;
  }
  el.textContent = `${score.total}/24`;
}

function updateUIWithProgress() {
  if (!currentState) return;
  const progress = currentState.progress || 0;
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${(progress / 6) * 100}%`;

  document.querySelectorAll('.level-card').forEach(card => {
    const id = Number(card.dataset.levelId);
    card.classList.toggle('completed', id <= progress);
    card.classList.toggle('locked', !isLevelUnlocked(id));
  });

  if (currentState.achievements && currentState.achievements.length > 0) {
    showAchievement('Welcome back!', 'Continue your progress.');
  }
}

function showAchievement(title, desc) {
  const el = document.getElementById('achievement');
  if (!el) return;
  el.querySelector('.achievement-title').textContent = title;
  el.querySelector('.achievement-desc').textContent = desc;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function maybeUnlockNextLevel() {
  if (!currentState) return;
  const nextLevel = Math.min(6, Math.floor((currentState.sparks || 0) / SPARKS_PER_LEVEL) + 1);
  if (nextLevel > (currentState.progress || 0)) {
    currentState.progress = nextLevel;
  }
  if (!isLevelUnlocked(nextLevel)) {
    currentState.unlockedLevels = Array.from(new Set([...(currentState.unlockedLevels || []), nextLevel]));
    showAchievement('Level Unlocked!', `Level ${nextLevel} is now available.`);
  }
}

function scorePrompt(promptText, lv) {
  const text = promptText.trim().toLowerCase();
  const keywords = [
    ...(lv.task.prompt.match(/<span class="hl">([^<]+)<\/span>/g) || []).map(m => m.replace(/<[^>]+>/g, '').toLowerCase()),
    ...(lv.task.prompt.match(/<span class="hl2">([^<]+)<\/span>/g) || []).map(m => m.replace(/<[^>]+>/g, '').toLowerCase()),
    ...(lv.task.prompt.match(/<span class="hl3">([^<]+)<\/span>/g) || []).map(m => m.replace(/<[^>]+>/g, '').toLowerCase())
  ];

  const has = (terms) => terms.some(t => text.includes(t));
  const countMatches = (terms) => terms.reduce((count, t) => count + (text.includes(t) ? 1 : 0), 0);

  // 1. Clarity: explicit instruction, directives, and length
  let clarity = 1;
  const claritySignals = ['write', 'create', 'generate', 'produce', 'instruct', 'explain', 'describe'];
  const hasClarity = has(claritySignals);
  if (text.length > 150 && hasClarity) clarity = 4;
  else if (text.length > 100 && hasClarity) clarity = 3;
  else if (text.length > 60) clarity = 2;

  // 2. Specificity: uses task keywords and details
  let specificity = 1;
  const matched = countMatches(keywords);
  if (matched >= 5) specificity = 4;
  else if (matched >= 3) specificity = 3;
  else if (matched >= 1) specificity = 2;

  // 3. Strategies: role prompting, chain of thought, examples, constraints
  let strategies = 1;
  const strategyTerms = ['act as', 'role', 'assistant', 'first', 'step', 'reason', 'because', 'so that', 'first,', 'then', 'if', 'otherwise', 'example', 'e.g.', 'for example', 'format'];
  const stratCount = countMatches(strategyTerms);
  if (stratCount >= 5) strategies = 4;
  else if (stratCount >= 3) strategies = 3;
  else if (stratCount >= 1) strategies = 2;

  // 4. Alignment: matches task objective language
  let alignment = 1;
  const objectiveTerms = [lv.bloom.toLowerCase(), lv.task.title.toLowerCase(), lv.task.objective.toLowerCase()];
  const alignmentMatch = objectiveTerms.filter(t => t && t.length > 3).reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
  if (alignmentMatch >= 2) alignment = 4;
  else if (alignmentMatch === 1) alignment = 3;
  else if (matched > 0) alignment = 2;

  // 5. Output structure: format instructions included
  let structure = 1;
  const formatTerms = ['list', 'table', 'paragraph', 'bullet', 'format', 'numbered', 'markdown', 'json', 'csv'];
  const formatCount = countMatches(formatTerms);
  if (formatCount >= 4) structure = 4;
  else if (formatCount >= 3) structure = 3;
  else if (formatCount >= 1) structure = 2;

  // 6. Cognitive demand: ask for evaluation/analysis/creation
  let demand = 1;
  const demandTerms = ['compare', 'evaluate', 'analyze', 'synthesize', 'critique', 'design', 'create', 'generate', 'rank', 'justify'];
  const demandCount = countMatches(demandTerms);
  if (demandCount >= 4) demand = 4;
  else if (demandCount >= 3) demand = 3;
  else if (demandCount >= 1) demand = 2;

  const total = clarity + specificity + strategies + alignment + structure + demand;

  return {
    total,
    breakdown: {
      clarity,
      specificity,
      strategies,
      alignment,
      structure,
      demand
    }
  };
}

function renderPromptHistory(lv) {
  const container = document.getElementById('prompt-history');
  if (!container || !currentState) return;

  const entries = (currentState.promptHistory?.[lv.id] || []).slice(-6).reverse();
  if (!entries.length) {
    container.innerHTML = `
      <h4>Prompt history</h4>
      <p class="muted">Submit prompts to build a history of your improvements.</p>
    `;
    return;
  }

  const list = entries.map(e => {
    const when = new Date(e.createdAt || 0).toLocaleString();
    return `
      <div class="history-item">
        <div class="history-meta">
          <span class="history-score">Score: ${e.score?.total ?? '?'} / 24</span>
          <span class="history-time">${when}</span>
        </div>
        <div class="history-prompt">${e.prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<h4>Prompt history</h4>${list}`;
}

function applyPromptFeedback(score, lv) {
  const feedback = document.getElementById('prompt-feedback');
  if (!feedback) return;

  feedback.innerHTML = `
    <h4>Feedback</h4>
    <p><strong>Total CLEAR score:</strong> ${score.total}/24</p>
    <ul class="feedback-list">
      <li><strong>Clarity:</strong> ${score.breakdown.clarity}/4</li>
      <li><strong>Specificity:</strong> ${score.breakdown.specificity}/4</li>
      <li><strong>Strategies:</strong> ${score.breakdown.strategies}/4</li>
      <li><strong>Alignment:</strong> ${score.breakdown.alignment}/4</li>
      <li><strong>Structure:</strong> ${score.breakdown.structure}/4</li>
      <li><strong>Demand:</strong> ${score.breakdown.demand}/4</li>
    </ul>
    <p class="muted">Tip: Try editing the prompt to include more explicit format instructions and a clear reasoning directive.</p>
  `;
}

function handlePromptSubmit(lv) {
  const promptEl = document.getElementById('user-prompt');
  const promptText = promptEl?.value.trim() || '';
  if (!promptText) {
    alert('Please write a prompt before submitting.');
    return;
  }

  const score = scorePrompt(promptText, lv);
  updateClearScore(score);
  applyPromptFeedback(score, lv);

  if (!currentState) currentState = createInitialState();
  currentState.sparks = (currentState.sparks || 0) + SPARKS_PER_ATTEMPT;

  const entry = {
    prompt: promptText,
    score,
    createdAt: Date.now()
  };
  currentState.promptHistory = currentState.promptHistory || {};
  currentState.promptHistory[lv.id] = currentState.promptHistory[lv.id] || [];
  currentState.promptHistory[lv.id].push(entry);

  maybeUnlockNextLevel();
  saveState();
  updateSparksUI();
  updateUIWithProgress();
  renderPromptHistory(lv);

  showAchievement('Nice work!', `You earned ${SPARKS_PER_ATTEMPT} Sparks (CLEAR score: ${score.total}/24).`);
}

function handleHintRequest(lv) {
  if (!currentState) return;
  const currentSparks = currentState.sparks || 0;
  if (currentSparks < SPARKS_FOR_HINT) {
    alert('Not enough sparks — try submitting prompts to earn more.');
    return;
  }

  currentState.sparks = currentSparks - SPARKS_FOR_HINT;
  saveState();
  updateSparksUI();

  const hintBox = document.getElementById('hint-box');
  if (hintBox) {
    hintBox.textContent = lv.hint || 'Try focusing on the key output format and what exact details the AI should include.';
  }

  showAchievement('Hint unlocked!', `Hint revealed for Level ${lv.id}.`);
}

function setupPromptPlayer(lv) {
  const promptEl = document.getElementById('user-prompt');
  const submitBtn = document.getElementById('submit-prompt');
  const hintBtn = document.getElementById('get-hint');
  const hintCost = document.getElementById('hint-cost');
  const hintBox = document.getElementById('hint-box');
  const copyBadPromptBtn = document.getElementById('copy-bad-prompt');

  if (promptEl) promptEl.value = '';
  if (hintBox) hintBox.textContent = 'Hints will appear here when purchased.';
  if (hintCost) hintCost.textContent = String(SPARKS_FOR_HINT);
  updateSparksUI();
  updateClearScore(null);

  if (submitBtn) {
    submitBtn.onclick = () => handlePromptSubmit(lv);
  }

  if (hintBtn) {
    hintBtn.onclick = () => handleHintRequest(lv);
  }

  if (copyBadPromptBtn) {
    copyBadPromptBtn.onclick = () => {
      const bad = document.getElementById('bad-prompt')?.textContent || '';
      if (promptEl) promptEl.value = bad;
      promptEl?.focus();
    };
  }

  renderPromptHistory(lv);
}

/* ═══════════════════════════════════════════════
   PROGRESS UI
═══════════════════════════════════════════════ */
function updateUIWithProgress(userData) {
  const progress = userData.progress || 0;
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${(progress / 6) * 100}%`;

  document.querySelectorAll('.level-card').forEach((card, idx) => {
    if (idx < progress) card.classList.add('completed');
  });

  if (userData.achievements && userData.achievements.length > 0) {
    showAchievement('Welcome back!', 'Continue your progress!');
  }
}

function showAchievement(title, desc) {
  const el = document.getElementById('achievement');
  el.querySelector('.achievement-title').textContent = title;
  el.querySelector('.achievement-desc').textContent  = desc;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}


/* ═══════════════════════════════════════════════
   RENDER LEVEL CARDS
═══════════════════════════════════════════════ */
const grid = document.getElementById('levels-grid');
LEVELS.forEach((lv, i) => {
  const card = document.createElement('div');
  card.className = 'level-card';
  card.dataset.levelId = lv.id;
  card.style.setProperty('--card-color', lv.color);
  card.style.animationDelay = `${i * 0.08}s`;
  card.innerHTML = `
    <div class="card-num">${lv.id}</div>
    <div class="card-badge" style="color:${lv.color};background:${lv.color}18;border-color:${lv.color}33;">${lv.icon} Level ${lv.id}</div>
    <div class="card-title">${lv.bloom}</div>
    <div class="card-desc">${lv.tagline} — ${lv.desc}</div>
    <div class="card-arrow" style="color:${lv.color};">Open Task <span>→</span></div>
  `;
  card.addEventListener('click', () => openTask(lv, card));
  grid.appendChild(card);
});


/* ═══════════════════════════════════════════════
   TASK PANEL
═══════════════════════════════════════════════ */
function openTask(lv, card) {
  if (!isLevelUnlocked(lv.id)) {
    const needed = Math.max(0, (lv.id - 1) * SPARKS_PER_LEVEL - (currentState?.sparks || 0));
    showAchievement('Locked', `Earn ${needed} more Sparks to unlock Level ${lv.id}.`);
    return;
  }

  document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');

  const panel = document.getElementById('task-panel');
  panel.style.setProperty('--tl-color', lv.color);
  panel.classList.add('visible');

  // Badge & title
  const badge = document.getElementById('tp-badge');
  badge.textContent       = `Level ${lv.id} · ${lv.bloom}`;
  badge.style.color       = lv.color;
  badge.style.borderColor = lv.color + '55';
  badge.style.background  = lv.color + '18';
  document.getElementById('tp-title').textContent = lv.task.title;

  // Progress steps
  const prog = document.getElementById('tp-progress');
  prog.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const s = document.createElement('div');
    s.className = `progress-step${i <= lv.id ? ' done' : ''}`;
    if (i <= lv.id) s.style.background = lv.color;
    prog.appendChild(s);
  }

  // Objective
  document.getElementById('tp-objective').innerHTML =
    `<strong>🎯 Learning Objective</strong>${lv.task.objective}`;

  // Prompt box
  document.getElementById('tp-prompt').innerHTML =
    lv.task.prompt.replace(/\n/g, '<br>');

  // Example of a prompt that can be improved
  const badPromptEl = document.getElementById('bad-prompt');
  if (badPromptEl) badPromptEl.textContent = lv.task.badPrompt ||
    'A better prompt will use explicit instructions, include output format, and request reasoning.';

  // Instructions
  document.getElementById('tp-instructions').innerHTML =
    `<h4>// How to Approach This Task</h4>
     <ul class="instruction-list">${lv.task.instructions.map(i => `<li>${i}</li>`).join('')}</ul>`;

  // Meta chips
  document.getElementById('tp-meta').innerHTML = `
    <div class="meta-chip">⏱ Estimated Time: <span>${lv.task.time}</span></div>
    <div class="meta-chip">🎚 Difficulty: <span>${lv.task.difficulty}</span></div>
    <div class="meta-chip">🔑 Focus Areas: <span>${lv.task.focus}</span></div>
  `;

  setupPromptPlayer(lv);
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

window.closeTask = function () {
  document.getElementById('task-panel').classList.remove('visible');
  document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
};

/* ═══════════════════════════════════════════════
   RENDER RUBRIC
═══════════════════════════════════════════════ */
const rubricGrid = document.getElementById('rubric-grid');
RUBRIC.forEach((r, i) => {
  const card = document.createElement('div');
  card.className = 'rubric-card';
  card.style.animationDelay = `${i * 0.07}s`;
  card.innerHTML = `
    <div class="rubric-header" onclick="toggleRubric(this)">
      <div class="rubric-header-left">
        <div class="rubric-num">${r.num}</div>
        <div>
          <div class="rubric-title">${r.title}</div>
          <div class="rubric-cite">${r.cite}</div>
        </div>
      </div>
      <div class="rubric-toggle">▾</div>
    </div>
    <div class="rubric-body">
      <p class="rubric-desc">${r.desc}</p>
      <div class="score-grid">
        ${r.scores.map(s => `
          <div class="score-cell">
            <div class="score-val s${s.val}">${s.val}</div>
            <div class="score-label">${s.label}</div>
            <div class="score-desc">${s.desc}</div>
          </div>
        `).join('')}
      </div>
      <div class="rrl-block">
        <div class="rrl-label">Research Basis (RRL)</div>
        <div class="rrl-cite">${r.rrl}</div>
      </div>
    </div>
  `;
  rubricGrid.appendChild(card);
});

window.toggleRubric = function (header) {
  header.parentElement.classList.toggle('expanded');
};

/* ═══════════════════════════════════════════════
   TAXONOMY VISUAL
═══════════════════════════════════════════════ */
const taxVis = document.getElementById('tax-visual');
TAX_DATA.forEach((t, i) => {
  const row = document.createElement('div');
  row.className = 'tax-item';
  row.style.animationDelay = `${i * 0.1}s`;
  row.innerHTML = `
    <div class="tax-name" style="color:${t.color}">${t.name}</div>
    <div class="tax-bar-wrap">
      <div class="tax-bar" style="width:0;background:${t.color};transition:width 1s ${i * 0.15}s ease"></div>
    </div>
    <div class="tax-level" style="color:${t.color}">L${i + 1}</div>
  `;
  taxVis.appendChild(row);
});

// Animate bars on scroll into view
const taxObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.tax-bar').forEach((bar, i) => {
        bar.style.width = TAX_DATA[i].width + '%';
      });
      taxObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

taxObserver.observe(document.getElementById('tax-visual'));

/* ═══════════════════════════════════════════════
   SCROLL ANIMATIONS
═══════════════════════════════════════════════ */
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity   = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.level-card, .rubric-card').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  animObserver.observe(el);
});

function setAuthUIState({ message, showForms = false, showSignedIn = false, email = '', isGuest = false }) {
  const status = document.getElementById('auth-status');
  const forms = document.getElementById('auth-forms');
  const signedIn = document.getElementById('auth-signed-in');
  const userEmail = document.getElementById('user-email');
  const navAuthText = document.getElementById('nav-auth-text');
  const navAuthBtn = document.getElementById('nav-auth-btn');

  if (status) {
    const msgEl = status.querySelector('.auth-message');
    if (msgEl) msgEl.textContent = message || '';
  }

  if (forms) forms.classList.toggle('hidden', !showForms);
  if (signedIn) signedIn.classList.toggle('hidden', !showSignedIn);
  if (userEmail) userEmail.textContent = email || '—';

  if (navAuthText) {
    if (showSignedIn) {
      navAuthText.textContent = `Signed in as ${email || '…'}`;
    } else if (isGuest) {
      navAuthText.textContent = 'Guest (progress saved locally)';
    } else {
      navAuthText.textContent = 'Not signed in';
    }
  }

  if (navAuthBtn) {
    if (showSignedIn) {
      navAuthBtn.textContent = 'Sign out';
      navAuthBtn.dataset.authState = 'signed-in';
    } else {
      navAuthBtn.textContent = 'Sign in';
      navAuthBtn.dataset.authState = 'signed-out';
    }
  }
}

function initializeAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const guestBtn = document.getElementById('guest-btn');
  const signoutBtn = document.getElementById('signout-btn');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('login-email')?.value.trim();
      const password = document.getElementById('login-password')?.value.trim();
      if (!email || !password) {
        alert('Enter both email and password.');
        return;
      }
      try {
        await signInWithEmail(email, password);
      } catch (e) {
        alert(e.message || 'Sign in failed.');
      }
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const email = document.getElementById('signup-email')?.value.trim();
      const password = document.getElementById('signup-password')?.value.trim();
      if (!email || !password) {
        alert('Enter both email and password.');
        return;
      }
      try {
        await signUpWithEmail(email, password);
      } catch (e) {
        alert(e.message || 'Account creation failed.');
      }
    });
  }

  if (guestBtn) {
    guestBtn.addEventListener('click', async () => {
      currentUser = { uid: null, email: null, isGuest: true };
      setAuthUIState({
        message: 'Playing as guest. Progress is saved locally.',
        showForms: true,
        showSignedIn: false,
        isGuest: true
      });
      await loadState();
      updateUIWithProgress();
    });
  }

  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      try {
        await firebaseSignOut();
      } catch (e) {
        console.warn('Sign-out failed:', e);
      }
    });
  }

  const navAuthBtn = document.getElementById('nav-auth-btn');
  if (navAuthBtn) {
    navAuthBtn.addEventListener('click', async () => {
      if (navAuthBtn.dataset.authState === 'signed-in') {
        try {
          await firebaseSignOut();
        } catch (e) {
          console.warn('Sign-out failed:', e);
        }
      } else {
        setAuthUIState({
          message: 'Please sign in or create an account to save progress.',
          showForms: true,
          showSignedIn: false,
          isGuest: false
        });
        document.getElementById('login-email')?.focus();
      }
    });
  }
}

async function initApp() {
  initializeAuthUI();

  if (!firebaseEnabled()) {
    setAuthUIState({
      message: 'Firebase not configured. Progress is stored locally in this browser. To enable cloud sync, add a Firebase config in firebase.config.js or set window.FIREBASE_CONFIG.',
      showForms: true,
      showSignedIn: false,
      isGuest: true
    });
    currentUser = { uid: null, email: null, isGuest: true };
    await loadState();
    updateUIWithProgress();
    const firstCard = document.querySelector('.level-card');
    if (firstCard) openTask(LEVELS[0], firstCard);
    return;
  }

  await initFirebase();
  setAuthUIState({ message: 'Checking account status…' });

  await onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = { uid: user.uid, email: user.email || '', isGuest: false };
      setAuthUIState({ message: `Signed in as ${currentUser.email}.`, showForms: false, showSignedIn: true, email: currentUser.email });
      await loadState();
      updateUIWithProgress();
      const firstCard = document.querySelector('.level-card');
      if (firstCard) openTask(LEVELS[0], firstCard);
    } else {
      currentUser = { uid: null, email: null, isGuest: true };
      setAuthUIState({
        message: 'Not signed in. You can continue as a guest or sign in to save progress across devices.',
        showForms: true,
        showSignedIn: false,
        isGuest: false
      });
      await loadState();
      updateUIWithProgress();
      const firstCard = document.querySelector('.level-card');
      if (firstCard) openTask(LEVELS[0], firstCard);
    }
  });
}

initApp();
