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
    scenarios: [
      {
        title: "Definitions List",
        objective: "Create a prompt that asks the AI to list and define key terms in a specific domain.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou are studying for an AI literacy exam covering fundamental concepts in machine learning.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt to an AI system that will cause it to generate a structured list of <span class="hl3">10 foundational machine learning terms</span> with their definitions.\n\nYour prompt should specify:\n• The <span class="hl">domain</span> (machine learning fundamentals)\n• The <span class="hl">number</span> of terms (exactly 10)\n• The <span class="hl">format</span> expected for each entry\n• The <span class="hl">difficulty level</span> (beginner-friendly)`,
        instructions: [
          "Be explicit about exactly what information you want recalled.",
          "Specify the format — numbered list, table, or structured output.",
          "Avoid vague language — the AI should not have to guess what 'foundational' means.",
          "Use the CLEAR scoring framework (Concise, Logical, Explicit, Adaptive, Reflective) to self-assess your prompt."
        ],
        time: "10–15 min",
        difficulty: "Beginner",
        focus: "Explicitness · Format Guidance",
        hint: "Try focusing on the info you want the AI to return: specify the number of items, the level of detail, and the output format (e.g., list, table).",
      },
      {
        title: "Fact Retrieval",
        objective: "Prompt the AI to extract key facts from a short passage and present them as bullet points.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou have a paragraph describing a scientific discovery.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt to an AI assistant that asks it to list the <span class="hl3">five most important facts</span> from the paragraph in bullet form and specify the format for each bullet.`,
        instructions: [
          "Specify how many facts are needed and the output format (e.g., bullet list).",
          "Be clear about what counts as an 'important' fact in this context.",
          "Use CLEAR scoring to check that your prompt is concise and explicit."
        ],
        time: "8–12 min",
        difficulty: "Beginner",
        focus: "Clarity · Output Structure",
        hint: "Tell the AI exactly how you want the bullets formatted (e.g., short sentence, term + detail).",
      },
      {
        title: "Topic Comparison",
        objective: "Create a prompt that directs the AI to compare two related concepts and highlight key differences.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou're studying two popular machine learning approaches.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to compare <span class="hl3">supervised learning</span> and <span class="hl3">unsupervised learning</span> in a table, listing at least three differences and one shared characteristic.`,
        instructions: [
          "Specify the comparison structure (e.g., table with columns).",
          "Be explicit about the number of differences and the shared characteristic.",
          "Use CLEAR scoring to evaluate how explicit and structured your prompt is."
        ],
        time: "12–18 min",
        difficulty: "Beginner",
        focus: "Structure · Explicitness",
        hint: "Include the word 'compare' and request a tabular format with labeled columns.",
      },
      {
        title: "Problem Definition",
        objective: "Write a prompt that tells the AI to define a problem and list steps to solve it.",
        prompt: `<span class="hl">// SCENARIO</span>\nA team needs help identifying why their recommendation system is underperforming.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to describe the most likely causes and list a 3‑step plan to diagnose the issue.`,
        instructions: [
          "Describe what output format you expect (e.g., numbered plan).",
          "Be clear about the context and the audience for the response.",
          "Use CLEAR scoring to ensure your prompt is adaptive and actionable."
        ],
        time: "12–20 min",
        difficulty: "Beginner",
        focus: "Adaptive · Logical",
        hint: "Mention who will act on the response (e.g., data engineer, analyst) so the AI tailors the output.",
      }
    ],
    task: {
      title: "The Definition Task",
      objective: "Write a prompt that instructs an AI to recall and list key definitions and terminology. Your prompt should specify the domain, the number of terms expected, and the format of the output.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou are studying for an AI literacy exam covering fundamental concepts in machine learning.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt to an AI system that will cause it to generate a structured list of <span class="hl3">10 foundational machine learning terms</span> with their definitions.\n\nYour prompt should specify:\n• The <span class="hl">domain</span> (machine learning fundamentals)\n• The <span class="hl">number</span> of terms (exactly 10)\n• The <span class="hl">format</span> expected for each entry\n• The <span class="hl">difficulty level</span> (beginner-friendly)`,
      instructions: [
        "Write your prompt in a separate document or paper.",
        "Be explicit about exactly what information you want recalled.",
        "Specify the format — numbered list, table, or structured output.",
        "Avoid vague language — the AI should not have to guess what 'foundational' means.",
        "Use the CLEAR scoring framework (Concise, Logical, Explicit, Adaptive, Reflective) to self-assess your prompt."
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
    scenarios: [
      {
        title: "Audience-Based Explanation",
        objective: "Write a prompt that asks the AI to explain a technical topic in language tailored to a specific audience.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou're creating study material for high school students who have no prior coding experience.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to explain <span class="hl3">how neural networks learn</span> to a non-technical audience.\n\nYour prompt should include:\n• <span class="hl">Audience definition</span> (age group, background)\n• A request for an <span class="hl">analogy</span> to make the concept relatable\n• <span class="hl">Length constraints</span> (e.g., 200–250 words)\n• Instruction to <span class="hl">avoid jargon</span> or define any technical term used\n• A <span class="hl">summary sentence</span> at the end`,
        instructions: [
          "Define the audience clearly — don't just say 'explain simply'.",
          "Include explicit instructions about analogies and examples.",
          "Check if the output would be understandable to the stated audience.",
          "Use CLEAR scoring to ensure your prompt is explicit and adaptive."
        ],
        time: "15–20 min",
        difficulty: "Beginner–Intermediate",
        focus: "Clarity · Audience Alignment",
        hint: "Specify the audience and tone, and ask the AI to avoid jargon or explain terms."
      },
      {
        title: "Guided Summary",
        objective: "Create a prompt that asks the AI to summarize a long text into three key points with a short explanation.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou have a paragraph about the history of the internet.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to summarize the paragraph into <span class="hl3">three main points</span> and include a one-sentence explanation for each.`,
        instructions: [
          "Specify the exact number of points and what each should include.",
          "Be explicit about the format (e.g., bullet list).",
          "Use CLEAR scoring so your prompt is concise and structured."
        ],
        time: "12–18 min",
        difficulty: "Intermediate",
        focus: "Explicitness · Structure",
        hint: "Ask the AI to output a bulleted list with each item including a short explanation."
      },
      {
        title: "Concept Comparison",
        objective: "Write a prompt that asks the AI to compare two related ideas and highlight which is better in a given situation.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou're comparing two study techniques: active recall and passive review.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to compare the two techniques and suggest which is better for retaining information quickly. Include a short rationale.`,
        instructions: [
          "Specify the comparison criteria and expected output structure.",
          "Be clear about the situation where one technique might be preferred.",
          "Use CLEAR scoring to ensure your prompt is explicit and logical."
        ],
        time: "15–20 min",
        difficulty: "Intermediate",
        focus: "Logical · Adaptive",
        hint: "Include the context (e.g., learning for an exam vs. long-term retention)."
      },
      {
        title: "Rewrite for Audience",
        objective: "Generate a prompt that asks the AI to rewrite a given paragraph for a different audience (e.g., from expert to beginner).",
        prompt: `<span class="hl">// SCENARIO</span>\nYou have a technical paragraph on machine learning optimization methods.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to rewrite the paragraph for a <span class="hl3">novice audience</span> and include a short explanation of why the changes were made.`,
        instructions: [
          "Specify the original and target audiences clearly.",
          "Ask the AI to explain the reasoning behind its rewriting choices.",
          "Use CLEAR scoring to check for explicitness and reflection."
        ],
        time: "15–20 min",
        difficulty: "Intermediate",
        focus: "Adaptive · Reflective",
        hint: "Ask the AI to highlight what changed in the rewrite and why."
      }
    ],
    task: {
      title: "The Concept Translator",
      objective: "Write a prompt that directs an AI to explain a complex concept in accessible language. Your prompt must define the audience, depth of explanation, and use of analogies.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou're creating study material for high school students who have no prior coding experience.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to explain <span class="hl3">how neural networks learn</span> to a non-technical audience.\n\nYour prompt should include:\n• <span class="hl">Audience definition</span> (age group, background)\n• A request for an <span class="hl">analogy</span> to make the concept relatable\n• <span class="hl">Length constraints</span> (e.g., 200–250 words)\n• Instruction to <span class="hl">avoid jargon</span> or define any technical term used\n• A <span class="hl">summary sentence</span> at the end`,
      instructions: [
        "Draft a prompt that specifies audience clearly — don't just say 'explain simply'.",
        "Include explicit instructions about analogies and examples.",
        "Test whether your prompt would produce output a 16-year-old could understand.",
        "Check: Does your prompt address format (paragraph length, no jargon, summary)?",
        "Self-evaluate using the CLEAR framework: be concise, explicit, and aligned with the task." 
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
    scenarios: [
      {
        title: "Action Plan Builder",
        objective: "Write a prompt that asks the AI to develop a step-by-step plan to solve a business challenge.",
        prompt: `<span class="hl">// SCENARIO</span>\nA small business wants to reduce customer churn.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to create a <span class="hl3">30-day customer retention plan</span> with weekly milestones and measurable actions.`,
        instructions: [
          "Specify output structure (e.g., week-by-week list).",
          "Include constraints like budget, timeline, or resources.",
          "Use CLEAR scoring to ensure the prompt is explicit and actionable."
        ],
        time: "20–25 min",
        difficulty: "Intermediate",
        focus: "Role Prompting · Constraints",
        hint: "Mention who will use the plan and any budget or time limits."
      },
      {
        title: "Persona-driven Solution",
        objective: "Ask the AI to act as a specific expert and solve a problem using that perspective.",
        prompt: `<span class="hl">// SCENARIO</span>\nA team is building an app and needs a security checklist.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI, acting as a cybersecurity analyst, to provide a checklist of vulnerabilities to review.`,
        instructions: [
          "Define the role explicitly (e.g., cybersecurity analyst).",
          "Specify the expected format (e.g., checklist with brief explanations).",
          "Use CLEAR scoring to check for explicit role and output structure."
        ],
        time: "20–25 min",
        difficulty: "Intermediate",
        focus: "Role Prompting · Structure",
        hint: "Include the target audience for the checklist and any compliance standards to consider."
      },
      {
        title: "Constraint-Based Design",
        objective: "Craft a prompt that asks the AI to propose a solution under specific constraints.",
        prompt: `<span class="hl">// SCENARIO</span>\nA student needs a study plan that fits into 30 minutes per day.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to design a daily study schedule that maximizes retention within a <span class="hl3">30-minute daily limit</span>.`,
        instructions: [
          "State the constraint clearly (e.g., time limit, budget).",
          "Ask for a structured output (e.g., schedule per day).",
          "Use CLEAR scoring to ensure the prompt is concise and adaptive."
        ],
        time: "15–20 min",
        difficulty: "Intermediate",
        focus: "Constraints · Adaptivity",
        hint: "Include the duration constraint and the goal (e.g., retain information quickly)."
      },
      {
        title: "Template Generation",
        objective: "Ask the AI to create a reusable prompt template for future use.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou want to create a reusable prompt for generating marketing email copy.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to generate a <span class="hl3">prompt template</span> that takes variables like product name, audience, and tone.`,
        instructions: [
          "Specify the variables that should be replaceable.",
          "Ask for a clear template format (e.g., placeholders in brackets).",
          "Use CLEAR scoring to focus on explicit and adaptable instructions."
        ],
        time: "15–20 min",
        difficulty: "Intermediate",
        focus: "Adaptivity · Explicitness",
        hint: "Use placeholders like [PRODUCT] and [AUDIENCE] in your template."
      }
    ],
    task: {
      title: "The Problem Solver",
      objective: "Write a prompt that instructs an AI to solve a specific, well-defined problem using domain knowledge. Your prompt should specify context, constraints, and expected solution format.",
      prompt: `<span class="hl">// SCENARIO</span>\nA small business owner needs to reduce customer churn and has asked for an AI-generated action plan.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt instructing an AI to <span class="hl3">create a 30-day customer retention plan</span> for a subscription-based software product.\n\nYour prompt should include:\n• <span class="hl">Role prompting</span> — assign the AI a relevant persona\n• The <span class="hl">business context</span> (type of product, average users, churn rate ~15%)\n• <span class="hl">Specific deliverables</span> (weekly milestones, tactics per week)\n• <span class="hl">Format requirements</span> (structured table or phased plan)\n• A constraint: <span class="hl">budget under $500/month</span>`,
      instructions: [
        "Use role prompting — assign a persona like 'Act as a Customer Success strategist'.",
        "Provide enough context so the AI doesn't make assumptions about the business.",
        "Specify each week's deliverable to break down the 30-day plan.",
        "Include a constraint (budget, time, resources) to sharpen the output.",
        "Evaluate your prompt for strategy, specificity, and format using CLEAR scoring." 
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
    scenarios: [
      {
        title: "Compare & Contrast",
        objective: "Write a prompt that asks the AI to compare two concepts across defined criteria.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou need a comparison between two AI model types.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to compare <span class="hl3">GPT-style models</span> with <span class="hl3">BERT-style models</span> across multiple dimensions and present the results in a table.`,
        instructions: [
          "Specify exactly which dimensions to compare (e.g., architecture, use cases).",
          "Request a structured output (table with rows or columns).",
          "Use CLEAR scoring to ensure your prompt is explicit and logical."
        ],
        time: "25–30 min",
        difficulty: "Intermediate–Advanced",
        focus: "Structure · Logical",
        hint: "List the comparison dimensions explicitly and ask the AI to reason step-by-step."
      },
      {
        title: "Categorization Task",
        objective: "Ask the AI to categorize a list of items into groups with explanations.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou have a list of emerging technologies.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to group the items into <span class="hl3">three categories</span> and explain the reasoning for each grouping.`,
        instructions: [
          "Specify the number of categories and the expected output format.",
          "Ask for a short explanation for each category decision.",
          "Use CLEAR scoring to ensure your prompt is explicit and analytical."
        ],
        time: "25–30 min",
        difficulty: "Intermediate–Advanced",
        focus: "Analysis · Explicitness",
        hint: "Ask the AI to label each group and justify why items belong together."
      },
      {
        title: "Decomposition Challenge",
        objective: "Create a prompt that asks the AI to break a complex problem into smaller steps.",
        prompt: `<span class="hl">// SCENARIO</span>\nA team is planning a product launch.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to decompose the launch into <span class="hl3">key phases</span> and list the main tasks for each phase.`,
        instructions: [
          "Request a clear phased structure in the output.",
          "State the type of project and desired level of detail.",
          "Use CLEAR scoring to ensure your prompt is logical and organized."
        ],
        time: "25–30 min",
        difficulty: "Advanced",
        focus: "Logical · Structure",
        hint: "Ask for a numbered set of phases with bullet points for tasks."
      },
      {
        title: "Critical Comparison",
        objective: "Ask the AI to evaluate two approaches and recommend one with justification.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou are deciding between two product designs.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to compare the pros and cons of each design and recommend which one to pursue, including reasoning.`,
        instructions: [
          "Ask for a side-by-side comparison and a final recommendation.",
          "Mention which criteria are most important (e.g., usability, cost).",
          "Use CLEAR scoring to check for explicit reasoning and analysis."
        ],
        time: "25–30 min",
        difficulty: "Advanced",
        focus: "Analysis · Reflective",
        hint: "Ask the AI to state its assumptions and how it weighed them."
      }
    ],
    task: {
      title: "The Comparative Analyst",
      objective: "Write a prompt that instructs an AI to analyze and compare two or more subjects across multiple structured dimensions. Your prompt must specify the comparison criteria and output structure.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou are preparing a research brief comparing two competing AI language model approaches for a graduate seminar.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to <span class="hl3">compare GPT-style autoregressive models vs BERT-style masked models</span> across multiple analytical dimensions.\n\nYour prompt must specify:\n• Exactly <span class="hl">which dimensions</span> to compare (e.g., architecture, training objective, use cases, strengths/weaknesses)\n• Output as a <span class="hl">structured comparison table</span> with rows per dimension\n• A <span class="hl">brief analytical paragraph</span> after the table synthesizing key differences\n• A <span class="hl">chain-of-thought directive</span> — ask the AI to reason step-by-step before concluding\n• Minimum <span class="hl">4 comparison dimensions</span>`,
      instructions: [
        "Define each comparison axis explicitly — don't leave any dimension open to interpretation.",
        "Request chain-of-thought: 'Before generating the table, reason through each dimension.'",
        "Specify the output structure: table first, then synthesis paragraph.",
        "Identify which criteria produce genuinely distinct separation between the two subjects.",
        "Evaluate your prompt for strategy, output structure, and cognitive demand using CLEAR." 
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
    scenarios: [
      {
        title: "Rank & Recommend",
        objective: "Write a prompt asking the AI to rank a set of options against explicit criteria and recommend the best one.",
        prompt: `<span class="hl">// SCENARIO</span>\nYour team is choosing a programming language for a beginner course.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to rank Python, JavaScript, and Java based on criteria like readability, ecosystem, and employability, then recommend one.`,
        instructions: [
          "Specify the evaluation criteria and their importance.",
          "Ask for a ranking table and a final recommendation with justification.",
          "Use CLEAR scoring to ensure your prompt is explicit and reflective."
        ],
        time: "30–35 min",
        difficulty: "Advanced",
        focus: "Evaluation · Justification",
        hint: "Ask the AI to acknowledge trade-offs and include counterarguments."
      },
      {
        title: "Strengths & Weaknesses",
        objective: "Ask the AI to critique a set of options and highlight their strengths and weaknesses.",
        prompt: `<span class="hl">// SCENARIO</span>\nA project team is considering three data visualization libraries.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to analyze each library, list strengths and weaknesses, and suggest the best fit for a beginner audience.`,
        instructions: [
          "Specify the audience and the evaluation criteria.",
          "Ask the AI to provide a clear comparison format (e.g., table).",
          "Use CLEAR scoring to ensure your prompt is detailed and analytical."
        ],
        time: "30–35 min",
        difficulty: "Advanced",
        focus: "Analysis · Reflective",
        hint: "Request a final verdict and a short note on why it was chosen."
      },
      {
        title: "Feedback Loop",
        objective: "Create a prompt that asks the AI to evaluate an output and suggest improvements.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou have an example marketing email draft.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to critique the draft and provide a revised version with explanations for changes.`,
        instructions: [
          "Tell the AI to provide both critique and a rewritten version.",
          "Be clear about the desired tone and audience.",
          "Use CLEAR scoring to make the prompt adaptive and reflective."
        ],
        time: "30–35 min",
        difficulty: "Advanced",
        focus: "Reflective · Adaptive",
        hint: "Ask the AI to explain why each change improves the draft."
      },
      {
        title: "Method Comparison",
        objective: "Ask the AI to evaluate two approaches and describe when each is preferable.",
        prompt: `<span class="hl">// SCENARIO</span>\nA team is choosing between two project management styles.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to compare Agile vs. Waterfall and recommend which is better for a small startup, including rationale.`,
        instructions: [
          "Specify the context (startup, team size, timeline).",
          "Ask for pros/cons and a final recommendation.",
          "Use CLEAR scoring to ensure the prompt is explicit and aligned with the objective."
        ],
        time: "30–35 min",
        difficulty: "Advanced",
        focus: "Evaluation · Alignment",
        hint: "Ask the AI to cite key trade-offs and where each method excels."
      }
    ],
    task: {
      title: "The Critical Evaluator",
      objective: "Write a prompt that asks an AI to evaluate and rank multiple options against explicit criteria, justify each judgment, and produce a final recommendation with caveats.",
      prompt: `<span class="hl">// SCENARIO</span>\nYour university's computer science department is selecting a programming language to teach first-year students in their intro course.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to <span class="hl3">evaluate and rank Python, JavaScript, and Java</span> as first-year teaching languages.\n\nYour prompt must include:\n• <span class="hl">Five explicit evaluation criteria</span> (e.g., learning curve, ecosystem, employability, readability, tooling)\n• A <span class="hl">weighted scoring instruction</span> — define which criteria matter most\n• Request a <span class="hl">ranked comparison table</span> then a justified final recommendation\n• Ask the AI to <span class="hl">acknowledge counterarguments</span> to its recommendation\n• Include a directive to <span class="hl">cite reasoning</span> for each score given`,
      instructions: [
        "Define all five criteria before asking for evaluation — do not let AI choose criteria.",
        "Assign weights (e.g., 'weight readability 30%, employability 25%...').",
        "Ask for a table AND a recommendation paragraph — test that you specified both.",
        "Require counterarguments — this tests whether your prompt captures evaluative nuance.",
        "Evaluate your prompt for specificity, alignment, and higher-order thinking with CLEAR scoring." 
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
    scenarios: [
      {
        title: "Meta-Prompt Template",
        objective: "Write a prompt that asks the AI to generate a reusable prompt template for a given teaching objective.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou are building a prompt library for teaching critical thinking.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that instructs an AI to generate a prompt template for teaching <span class="hl3">critical thinking in high school history</span>, including placeholders for topic and audience.`,
        instructions: [
          "Specify the desired template components (role, structure, evaluation checklist).",
          "Ask for placeholders (e.g., [TOPIC], [AUDIENCE]).",
          "Use CLEAR scoring to ensure your meta-prompt is explicit and adaptable."
        ],
        time: "40–50 min",
        difficulty: "Expert",
        focus: "Meta-Prompting · Structure",
        hint: "Make the template reusable by including bracketed placeholders."
      },
      {
        title: "Instruction Generator",
        objective: "Create a prompt that asks the AI to generate step-by-step instructions for another user to write a prompt.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou want to teach someone how to write a quality prompt.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to produce a <span class="hl3">step-by-step guide</span> for writing a high-quality prompt, including common pitfalls.`,
        instructions: [
          "Ask for a structured, numbered guide.",
          "Include an explicit list of common mistakes to avoid.",
          "Use CLEAR scoring to ensure the resulting instructions are clear and logical."
        ],
        time: "35–45 min",
        difficulty: "Expert",
        focus: "Logical · Reflective",
        hint: "Request both the steps and a short rationale for each."
      },
      {
        title: "Adaptive Prompt Assistant",
        objective: "Write a prompt that asks the AI to adapt an existing prompt for a different audience or purpose.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou have a prompt written for marketing.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt asking an AI to adapt the marketing prompt for use in a teaching context, explaining the changes made.`,
        instructions: [
          "Specify the original and target audiences.",
          "Ask for a short explanation of the changes made.",
          "Use CLEAR scoring to ensure the prompt is adaptive and reflective."
        ],
        time: "35–45 min",
        difficulty: "Expert",
        focus: "Adaptive · Reflective",
        hint: "Ask the AI to describe what was changed and why."
      },
      {
        title: "Output Critic",
        objective: "Ask the AI to evaluate its own generated prompt output and suggest improvements.",
        prompt: `<span class="hl">// SCENARIO</span>\nYou want an AI to critique and improve its own prompt generation.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a prompt that asks an AI to generate a prompt for a task, then evaluate and revise its own prompt for clarity and effectiveness.`,
        instructions: [
          "Request both an initial prompt and a subsequent revision.",
          "Ask the AI to explain why the revision is better.",
          "Use CLEAR scoring to ensure the prompt encourages reflection."
        ],
        time: "40–50 min",
        difficulty: "Expert",
        focus: "Reflective · Explicit",
        hint: "Instruct the AI to treat its first version as a draft and improve it."
      }
    ],
    task: {
      title: "The Prompt Architect",
      objective: "Write a meta-prompt — a prompt that generates another high-quality prompt. Your meta-prompt must specify all elements of the output prompt including its structure, strategies, format, and evaluation criteria it should satisfy.",
      prompt: `<span class="hl">// SCENARIO</span>\nYou are designing a prompt template library for an educational technology startup. You need to create reusable, high-quality prompts that teachers can deploy for different subjects.\n\n<span class="hl2">YOUR TASK:</span>\nWrite a <span class="hl3">meta-prompt</span> — a prompt that instructs an AI to generate a complete, production-ready prompt template for teaching <span class="hl3">critical thinking skills in high school history</span>.\n\nYour meta-prompt must specify that the generated prompt should include:\n• <span class="hl">Role assignment</span> for the AI (Socratic tutor, debate facilitator, etc.)\n• <span class="hl">Scaffolded sub-questions</span> using decomposition\n• <span class="hl">Format directives</span> (how output should be structured for student use)\n• <span class="hl">Cognitive demand level</span> targeting analysis and evaluation\n• <span class="hl">Modifiable variables</span> marked with [BRACKETS] for teacher customization\n• A built-in <span class="hl">self-evaluation checklist</span> at the end of the template`,
      instructions: [
        "This is a meta-task: your prompt must CREATE another prompt. Think recursively.",
        "Specify exactly what components the output prompt should contain — don't be vague.",
        "Include instructions for using [BRACKET] variables to make the template flexible.",
        "Direct the AI to include a self-evaluation checklist in the generated template.",
        "Use CLEAR scoring to guide revisions — this meta-task is the most challenging and rewards thoughtful iteration."
      ],
      time: "40–50 min",
      difficulty: "Expert",
      focus: "Meta-Prompting · Template Design · Synthesis",
      hint: "Ask the AI to produce a prompt template with placeholders (e.g., [TOPIC], [AUDIENCE]) and include a self-evaluation checklist at the end.",
    }
  }
];

/* ═══════════════════════════════════════════════
   SCORING — CLEAR FRAMEWORK
═══════════════════════════════════════════════ */
// This scoring is loosely based on the CLEAR framework (Concise, Logical, Explicit, Adaptive, Reflective)
// and assigns 0–4 points per dimension for a maximum of 20.

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
const SPARKS_FOR_EXAMPLE = 30;
const SPARKS_FOR_DEEP_REVIEW = 30;
const SPARKS_PER_LEVEL = 80;

const DEFAULT_STATE = {
  sparks: 0,
  progress: 0,
  unlockedLevels: [1],
  promptHistory: {},
  storeUnlocked: {},
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

  merged.storeUnlocked = { ...(primary.storeUnlocked || {}), ...(incoming.storeUnlocked || {}) };
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

function getNextUnlockInfo() {
  if (!currentState) return null;
  const unlocked = Array.isArray(currentState.unlockedLevels) && currentState.unlockedLevels.length > 0
    ? Math.max(...currentState.unlockedLevels)
    : 1;
  const next = Math.min(6, unlocked + 1);
  const required = (next - 1) * SPARKS_PER_LEVEL;
  const current = currentState.sparks || 0;
  const needed = Math.max(0, required - current);
  return { nextLevel: next, required, needed, unlocked: isLevelUnlocked(next) };
}

function updateSparksUI() {
  const el = document.getElementById('sparks-count');
  const navSparks = document.getElementById('nav-sparks');
  const nextEl = document.getElementById('sparks-next');
  const sparks = currentState?.sparks || 0;
  if (el) el.textContent = String(sparks);
  if (navSparks) navSparks.textContent = `Sparks: ${sparks}`;

  const next = getNextUnlockInfo();
  if (nextEl) {
    if (!next) {
      nextEl.textContent = '';
      return;
    }
    if (next.unlocked) {
      nextEl.textContent = `✅ Level ${next.nextLevel} unlocked`;
    } else {
      nextEl.textContent = `(${next.needed} sparks to unlock Level ${next.nextLevel})`;
    }
  }
}

function updateClearScore(score) {
  const el = document.getElementById('clear-score');
  if (!el) return;
  if (!score) {
    el.textContent = '—';
    return;
  }
  el.textContent = `${score.total}/20`;
}

function updateUIWithProgress() {
  if (!currentState) return;

  const unlockedLevels = Array.isArray(currentState.unlockedLevels) ? currentState.unlockedLevels : [1];
  const maxUnlocked = Math.max(1, ...unlockedLevels);

  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = `${(maxUnlocked / LEVELS.length) * 100}%`;

  document.querySelectorAll('.level-card').forEach(card => {
    const id = Number(card.dataset.levelId);
    card.classList.toggle('completed', unlockedLevels.includes(id));
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
  const next = getNextUnlockInfo();
  if (!next) return;

  if (!next.unlocked && currentState.sparks >= next.required) {
    currentState.unlockedLevels = Array.from(new Set([...(currentState.unlockedLevels || []), next.nextLevel]));
    showAchievement('Level Unlocked!', `Level ${next.nextLevel} is now available.`);
  }
}

function scorePrompt(promptText, lv) {
  // Scoring is based on the CLEAR framework (Concise, Logical, Explicit, Adaptive, Reflective).
  // Each dimension is scored 0–4 for a total of 20.
  const text = promptText.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const countMatches = (terms) => terms.reduce((count, t) => count + (text.includes(t) ? 1 : 0), 0);

  // 1. Concise: clear, direct language with minimal fluff.
  let concise = 1;
  if (wordCount >= 15 && wordCount <= 80) concise = 4;
  else if (wordCount >= 12 && wordCount <= 120) concise = 3;
  else if (wordCount >= 8 && wordCount <= 180) concise = 2;

  // 2. Logical: step-by-step structure and sequencing.
  const logicalTerms = ['first', 'next', 'then', 'after', 'finally', 'because', 'so that', 'therefore', 'in order to'];
  const logicalCount = countMatches(logicalTerms);
  let logical = 1;
  if (logicalCount >= 4) logical = 4;
  else if (logicalCount >= 3) logical = 3;
  else if (logicalCount >= 1) logical = 2;

  // 3. Explicit: explicit instructions, output format, and required details.
  const explicitTerms = ['write', 'create', 'generate', 'describe', 'explain', 'list', 'format', 'structured', 'include'];
  const explicitCount = countMatches(explicitTerms);
  let explicit = 1;
  if (explicitCount >= 5) explicit = 4;
  else if (explicitCount >= 3) explicit = 3;
  else if (explicitCount >= 1) explicit = 2;

  // 4. Adaptive: mentions audience, constraints, or context.
  const adaptiveTerms = ['for', 'as a', 'audience', 'tone', 'style', 'context', 'beginner', 'expert', 'professional', 'student'];
  const adaptiveCount = countMatches(adaptiveTerms);
  let adaptive = 1;
  if (adaptiveCount >= 4) adaptive = 4;
  else if (adaptiveCount >= 3) adaptive = 3;
  else if (adaptiveCount >= 1) adaptive = 2;

  // 5. Reflective: asks for revision, evaluation, or iteration.
  const reflectiveTerms = ['revise', 'refine', 'improve', 'review', 'check', 'evaluate', 'feedback', 'iterate'];
  const reflectiveCount = countMatches(reflectiveTerms);
  let reflective = 1;
  if (reflectiveCount >= 4) reflective = 4;
  else if (reflectiveCount >= 3) reflective = 3;
  else if (reflectiveCount >= 1) reflective = 2;

  const total = concise + logical + explicit + adaptive + reflective;
  return {
    total,
    breakdown: { concise, logical, explicit, adaptive, reflective }
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
          <span class="history-score">Score: ${e.score?.total ?? '?'} / 20</span>
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
    <p><strong>Total CLEAR score:</strong> ${score.total}/20</p>
    <ul class="feedback-list">
      <li><strong>Concise:</strong> ${score.breakdown.concise}/4</li>
      <li><strong>Logical:</strong> ${score.breakdown.logical}/4</li>
      <li><strong>Explicit:</strong> ${score.breakdown.explicit}/4</li>
      <li><strong>Adaptive:</strong> ${score.breakdown.adaptive}/4</li>
      <li><strong>Reflective:</strong> ${score.breakdown.reflective}/4</li>
    </ul>
    <p class="muted">Tip: Try editing the prompt to be more explicit about format, audience, and next steps for improvement.</p>
  `;
}

function isLoggedIn() {
  return !!currentUser && !!currentUser.uid && !currentUser.isGuest;
}

function handlePromptSubmit(lv, scenario) {
  if (!isLoggedIn()) {
    alert('Please sign in to submit prompts and earn Sparks.');
    return;
  }

  const promptEl = document.getElementById('user-prompt');
  const promptText = promptEl?.value.trim() || '';
  if (!promptText) {
    alert('Please write a prompt before submitting.');
    return;
  }

  const score = scorePrompt(promptText, scenario);
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

  showAchievement('Nice work!', `You earned ${SPARKS_PER_ATTEMPT} Sparks (CLEAR score: ${score.total}/20).`);
}

function makeStoreKey(item, lvId, scenarioIndex) {
  return `${item}:${lvId}:${scenarioIndex}`;
}

function isStoreUnlocked(key) {
  return !!(currentState?.storeUnlocked && currentState.storeUnlocked[key]);
}

function unlockStoreItem(key) {
  if (!currentState) return;
  currentState.storeUnlocked = currentState.storeUnlocked || {};
  currentState.storeUnlocked[key] = true;
  saveState();
}

function purchaseStoreItem(itemKey, cost, lv, scenarioIndex, onUnlock) {
  if (!isLoggedIn()) {
    alert('Please sign in to use Sparks and unlock store options.');
    return;
  }
  if (!currentState) return;
  const key = makeStoreKey(itemKey, lv.id, scenarioIndex);
  if (isStoreUnlocked(key)) {
    onUnlock();
    return;
  }

  const currentSparks = currentState.sparks || 0;
  if (currentSparks < cost) {
    alert('Not enough sparks — submit prompts to earn more.');
    return;
  }

  currentState.sparks = currentSparks - cost;
  unlockStoreItem(key);
  updateSparksUI();
  onUnlock();
  showAchievement('Purchased', `Unlocked ${itemKey} for this task.`);
}

function updateSparkShopUI(lv, scenarioIndex) {
  const hintKey = makeStoreKey('hint', lv.id, scenarioIndex);
  const exampleKey = makeStoreKey('example', lv.id, scenarioIndex);
  const reviewKey = makeStoreKey('review', lv.id, scenarioIndex);

  const hintUnlocked = isStoreUnlocked(hintKey);
  const exampleUnlocked = isStoreUnlocked(exampleKey);
  const reviewUnlocked = isStoreUnlocked(reviewKey);

  const hintBtn = document.getElementById('get-hint');
  const exampleBtn = document.getElementById('get-example');
  const reviewBtn = document.getElementById('get-review');

  if (hintBtn) {
    hintBtn.textContent = hintUnlocked ? 'Hint Unlocked' : `Use Sparks for Hint (‑${SPARKS_FOR_HINT})`;
    hintBtn.disabled = !!hintUnlocked;
  }
  if (exampleBtn) {
    exampleBtn.textContent = exampleUnlocked ? 'Example Unlocked' : `Get Example Prompt (‑${SPARKS_FOR_EXAMPLE})`;
    exampleBtn.disabled = !!exampleUnlocked;
  }
  if (reviewBtn) {
    reviewBtn.textContent = reviewUnlocked ? 'Review Unlocked' : `Deep Review (‑${SPARKS_FOR_DEEP_REVIEW})`;
    reviewBtn.disabled = !!reviewUnlocked;
  }
}

function handleHintRequest(lv, scenarioIndex = 0) {
  const itemKey = 'hint';
  const key = makeStoreKey(itemKey, lv.id, scenarioIndex);
  purchaseStoreItem(itemKey, SPARKS_FOR_HINT, lv, scenarioIndex, () => {
    const hintBox = document.getElementById('hint-box');
    const scenarios = lv.scenarios || [lv.task];
    const scenario = scenarios[scenarioIndex] || scenarios[0];
    if (hintBox) {
      hintBox.textContent = scenario.hint || 'Try focusing on the key output format and what exact details the AI should include.';
    }
    updateSparkShopUI(lv, scenarioIndex);
  });
}

function handleExampleRequest(lv, scenarioIndex = 0) {
  const itemKey = 'example';
  purchaseStoreItem(itemKey, SPARKS_FOR_EXAMPLE, lv, scenarioIndex, () => {
    const promptEl = document.getElementById('user-prompt');
    const scenarios = lv.scenarios || [lv.task];
    const scenario = scenarios[scenarioIndex] || scenarios[0];
    if (promptEl) {
      promptEl.value = scenario.examplePrompt || scenario.prompt || '';
    }
    updateSparkShopUI(lv, scenarioIndex);
  });
}

function handleReviewRequest(lv, scenarioIndex = 0) {
  const itemKey = 'review';
  purchaseStoreItem(itemKey, SPARKS_FOR_DEEP_REVIEW, lv, scenarioIndex, () => {
    const hintBox = document.getElementById('hint-box');
    const scoreEl = document.getElementById('clear-score');
    if (hintBox) {
      hintBox.textContent = 'Review unlocked: Compare your prompt against the task objective and ask yourself how it could be more explicit, more structured, and more reflective.';
    }
    if (scoreEl) {
      scoreEl.textContent = 'Review Mode';
    }
    updateSparkShopUI(lv, scenarioIndex);
  });
}

function setupPromptPlayer(lv, scenario, scenarioIndex = 0) {
  const promptEl = document.getElementById('user-prompt');
  const submitBtn = document.getElementById('submit-prompt');
  const hintBtn = document.getElementById('get-hint');
  const exampleBtn = document.getElementById('get-example');
  const reviewBtn = document.getElementById('get-review');
  const hintCost = document.getElementById('hint-cost');
  const exampleCost = document.getElementById('example-cost');
  const reviewCost = document.getElementById('review-cost');
  const hintBox = document.getElementById('hint-box');
  const copyBadPromptBtn = document.getElementById('copy-bad-prompt');

  if (promptEl) promptEl.value = '';
  if (hintBox) hintBox.textContent = 'Hints will appear here when purchased.';
  if (hintCost) hintCost.textContent = String(SPARKS_FOR_HINT);
  if (exampleCost) exampleCost.textContent = String(SPARKS_FOR_EXAMPLE);
  if (reviewCost) reviewCost.textContent = String(SPARKS_FOR_DEEP_REVIEW);
  updateSparksUI();
  updateClearScore(null);

  if (submitBtn) {
    submitBtn.onclick = () => handlePromptSubmit(lv, scenario);
  }

  if (hintBtn) {
    hintBtn.onclick = () => handleHintRequest(lv, scenarioIndex);
  }

  if (exampleBtn) {
    exampleBtn.onclick = () => handleExampleRequest(lv, scenarioIndex);
  }

  if (reviewBtn) {
    reviewBtn.onclick = () => handleReviewRequest(lv, scenarioIndex);
  }

  updateSparkShopUI(lv, scenarioIndex);

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
function openTask(lv, card, scenarioIndex = 0) {
  if (!isLoggedIn()) {
    alert('Sign in to access tasks and earn Sparks.');
    return;
  }

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

  const scenarios = lv.scenarios || [lv.task];
  const scenario = scenarios[scenarioIndex] || scenarios[0];

  document.getElementById('tp-title').textContent = scenario.title || (lv.task && lv.task.title) || `Level ${lv.id}`;

  // Scenario selector
  const selector = document.getElementById('scenario-selector');
  if (selector) {
    selector.innerHTML = '';
    scenarios.forEach((s, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `scenario-btn${idx === scenarioIndex ? ' active' : ''}`;
      btn.textContent = `Scenario ${idx + 1}`;
      btn.addEventListener('click', () => openTask(lv, card, idx));
      selector.appendChild(btn);
    });
  }

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
    `<strong>🎯 Learning Objective</strong>${scenario.objective || ''}`;

  // Prompt box
  document.getElementById('tp-prompt').innerHTML =
    (scenario.prompt || '').replace(/\n/g, '<br>');

  // Example of a prompt that can be improved
  const badPromptEl = document.getElementById('bad-prompt');
  if (badPromptEl) badPromptEl.textContent = scenario.badPrompt ||
    'A better prompt will use explicit instructions, include output format, and request reasoning.';

  // Instructions
  document.getElementById('tp-instructions').innerHTML =
    `<h4>// How to Approach This Task</h4>
     <ul class="instruction-list">${(scenario.instructions || []).map(i => `<li>${i}</li>`).join('')}</ul>`;

  // Meta chips
  document.getElementById('tp-meta').innerHTML = `
    <div class="meta-chip">⏱ Estimated Time: <span>${scenario.time || ''}</span></div>
    <div class="meta-chip">🎚 Difficulty: <span>${scenario.difficulty || ''}</span></div>
    <div class="meta-chip">🔑 Focus Areas: <span>${scenario.focus || ''}</span></div>
  `;

  setupPromptPlayer(lv, scenario, scenarioIndex);
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

window.closeTask = function () {
  document.getElementById('task-panel').classList.remove('visible');
  document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
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

document.querySelectorAll('.level-card').forEach(el => {
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

  // When auth changes, update whether tasks can be accessed
  const startTasksBtn = document.getElementById('start-tasks-btn');
  if (startTasksBtn) {
    startTasksBtn.disabled = !showSignedIn;
    startTasksBtn.textContent = showSignedIn ? 'Go to Prompt Tasks →' : 'Sign in to begin';
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

function showSection(sectionId) {
  if ((sectionId === 'intro' || sectionId === 'levels') && !isLoggedIn()) {
    alert('Please sign in to explore the training tasks and earn Sparks.');
    showSection('hero');
    return;
  }

  ['hero', 'intro', 'levels'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', id !== sectionId);
  });
}

function showIntroSection() {
  showSection('intro');
  document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' });
}

function showLevelsSection() {
  showSection('levels');
  document.getElementById('levels')?.scrollIntoView({ behavior: 'smooth' });
}

function initializeAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const guestBtn = document.getElementById('guest-btn');
  const signoutBtn = document.getElementById('signout-btn');
  const startIntroBtn = document.getElementById('start-intro-btn');
  const startTasksBtn = document.getElementById('start-tasks-btn');

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

  // Make nav links behave like SPA sections
  document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('click', (evt) => {
      const targetId = a.getAttribute('href')?.replace('#', '');
      if (!targetId) return;
      evt.preventDefault();
      if (targetId === 'hero') {
        showSection('hero');
      } else if (targetId === 'levels') {
        showLevelsSection();
      } else if (targetId === 'about') {
        showSection('intro');
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  if (startIntroBtn) {
    startIntroBtn.addEventListener('click', () => {
      showIntroSection();
      updateStartTasksState();
    });
  }

  if (startTasksBtn) {
    startTasksBtn.addEventListener('click', () => {
      if (!isLoggedIn()) {
        alert('Sign in to access the tasks and earn Sparks.');
        return;
      }
      showLevelsSection();
    });
  }

  function updateStartTasksState() {
    const startTasksBtn = document.getElementById('start-tasks-btn');
    if (!startTasksBtn) return;
    if (isLoggedIn()) {
      startTasksBtn.disabled = false;
      startTasksBtn.textContent = 'Go to Prompt Tasks →';
    } else {
      startTasksBtn.disabled = true;
      startTasksBtn.textContent = 'Sign in to begin';
    }
  }

  updateStartTasksState();
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
    showIntroSection();
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
      showIntroSection();
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
      showIntroSection();
    }
  });
}

initApp();
