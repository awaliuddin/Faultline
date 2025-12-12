If everyone else is racing to build “the next killer app”, the only unfair move is to build the thing that judges whether any of those apps should be trusted in the first place.

Let’s weaponize that.

---

## 1. The play: build the **truth layer**, not another assistant

Working title:
**ReasonLens - Inference Autopsy for AI Answers**

Tagline:

> Paste any AI answer or article; ReasonLens uses Gemini 3 to dissect it into claims, check each against the real world, and show you exactly where the logic snaps.

Category: fits **Technology** and **Business**; you could also angle it as **Science** or **Health** in the examples.

Core idea:

* Everyone is demoing what Gemini can *produce*.
* You demo a tool that shows where AI outputs are **strong, weak, or hallucinated**, using Gemini 3 Pro’s reasoning plus multimodality.
* It is an **instrument**, not a toy. That automatically scores higher on Technical Depth and Impact.

---

## 2. What ReasonLens actually does

User flow inside the AI Studio app:

1. **Input**

   * User pastes:

     * An AI answer.. or
     * A paragraph from an article.. or
     * Uploads a screenshot / PDF of the answer.
   * Optional: they can also paste the original question for context.

2. **Decompose**

   * Gemini 3 Pro first **parses the text into atomic claims**:

     * Each claim has: `id`, `text`, `type` (fact / opinion / interpretation), `depends_on` (list of other ids), `importance` (1–5).
   * This becomes a **claim graph**, even if you only visualize it as lists.

3. **Verify**

   For each factual, high-importance claim:

   * Use Gemini 3 with **search grounding enabled** to:

     * Pull top web snippets relevant to the claim.
     * Judge the claim as:

       * `supported`
       * `contradicted`
       * `mixed/unclear`
       * `no evidence found`
     * Produce a short explanation and show key reference snippets.

4. **Autopsy view**

   The UI shows:

   * **Scorecard** at top:

     * “18 claims: 9 supported; 3 contradicted; 4 unclear; 2 unknown.”
   * **Claim table**:

     * Each row: claim text; type; status; explanation; link to original evidence.
   * **Weakest chain**:

     * A section that says “If this answer fails, it is most likely here” and highlights the most fragile claims that support big conclusions.

5. **Refine**

   * A button: “Ask Better Next Time”.
   * Gemini 3 generates:

     * A **better prompt** that calls out the risky zones explicitly (e.g. “only answer with statistically supported claims; include citations; say ‘uncertain’ when unsure”).
     * An **optional corrected version** of the original answer where red-flag claims are removed or labeled as speculative.

6. **Multimodal mode**

   * If the input is a screenshot or PDF:

     * Gemini 3 extracts the text, then runs the identical autopsy pipeline.
   * This shows off native multimodality in a way that’s not gimmicky.

---

## 3. Why this scores well against the judging criteria

Let’s map it directly to what the judges said they want.

### Impact – 40%

Problem:

* AI systems are moving into **health, finance, education, policy** and more; hallucinations and overconfident answers are dangerous.
* Most users (even devs) can’t quickly tell which parts of an answer are grounded in real evidence vs vibes.
* This slows adoption and increases **systemic risk** from misinformation.

Impact story:

* ReasonLens is a **general-purpose safety layer**:

  * A doctor or patient can paste an AI explanation and instantly see which medical claims are actually supported.
  * A founder can paste an AI-generated “market analysis” and see which numbers are fiction.
  * A journalist can run a quick pass on a draft before publishing.

You are not solving “one small UX pain”. You’re attacking the **trust bottleneck** for AI itself.

### Technical Depth & Execution – 30%

* Multi-step reasoning pipeline:

  * Phase 1: claim extraction and graphing.
  * Phase 2: per-claim web-grounded verification with Gemini 3.
  * Phase 3: global risk scoring and weakest-chain detection.
  * Phase 4: prompt/answer refinement.

* Uses **Gemini 3’s strengths**:

  * Long-context understanding for dense answers.
  * Structured JSON outputs for claims and verdicts.
  * Native multimodality for screenshot/PDF inputs.
  * Search grounding for external evidence.

* Real, working app:

  * You can demo it live in AI Studio; judges can click your app link and try their own text.

### Creativity – 20%

* Most people will build **assistants and copilots**.
* You are building a **forensic lab**.. an “X-ray” for AI explanations.
* The “autopsy” metaphor plus claim graph plus weakest-chain highlight is visually and conceptually distinct.
* It uses Gemini 3 in a non-obvious way: not just to generate answers, but to **critique and structurally map** them.

### Presentation – 10%

This idea is inherently cinematic in 2 minutes:

1. Show a confident AI answer.
2. Hit “Run Autopsy”.
3. Watch sections turn green, yellow, red.
4. Zoom to a red claim.. show a snippet that contradicts it.
5. Hit “Ask Better Next Time” and show the answer rewrite.
6. Close on the line:

   > “Don’t just trust AI.. interrogate it.”

That’s a story.

---

## 4. Concrete build plan inside AI Studio (next 3 days)

I’ll keep this ruthless.

### Day 1 – Nail the pipeline in the Playground

**Goal:** Get the core reasoning working *without* UI polish.

1. In AI Studio Playground:

   * Prompt Gemini 3 with an example answer.
   * Iterate until you get clean JSON for claim extraction:

     * `claims: [{id, text, type, depends_on, importance}]`.

2. Then, for a single claim:

   * Prompt Gemini 3 with search grounding on:

     * “Given this claim, use web search to find evidence; classify it as supported / contradicted / mixed / unknown; respond in JSON with status, reasoning, and 2–3 supporting snippets.”

3. Chain them manually:

   * Run extraction.. then copy top 5 claims one by one into the verifier to prove it works.

Lock these prompt “contracts” before touching Build.

### Day 2 – Move to Build and wire the app

**Goal:** First working version of ReasonLens inside AI Studio Build.

1. In the **Build** tab:

   * Start a new app; describe your idea in natural language so it scaffolds initial code.
   * Replace / extend the generated logic with:

     * Function `runAutopsy(text)` that:

       * Calls Gemini for claims.
       * Iterates over top N factual claims and calls the verifier.
       * Aggregates results and returns a structured object.

2. UI:

   * Input: textarea + optional file upload.
   * Output:

     * Summaries at top (counts of each status).
     * A simple HTML table of claims with color-coded status.
     * A panel for “Weakest chain” and “Prompt to ask next time”.

3. Multimodality:

   * For file upload, pass the file as part of the Gemini input and tell it:

     * “If a file is provided, first extract its main textual answer, then continue as usual.”

Get this working crudely. No pixel perfection yet.

### Day 3 – Polish; story; submit

**Goal:** Make it judge-ready.

1. **Improve reliability**:

   * Cap number of claims (e.g. 10) for latency.
   * Add error messages if verification fails.
   * Make sure outputs are robust even for messy inputs.

2. **UX polish**:

   * Clear section headings:

     * “Overall verdict”, “Claim-by-claim autopsy”, “Weakest links”, “Ask better next time”.
   * Subtle animations or transitions if Vibe Code makes that easy; but not mandatory.

3. **Record the 2-min video**:

   * Script and storyboard below.
   * Record screen; add voiceover (or simple captions if you prefer).
   * Upload to YouTube / Loom; set to public/unlisted.

4. **Create the Kaggle Writeup**:

   * Use the 250-word description I’ll draft.
   * Attach AI Studio public app link; video link; thumbnail.

---

## 5. Ready-to-use submission assets

You can tweak names, but here is a first pass.

### Title / Subtitle / Track

* **Title:** ReasonLens - Inference Autopsy for AI Answers
* **Subtitle:** Gemini 3 powered evidence graph that shows exactly where an answer holds or breaks
* **Track:** Technology (with examples touching Health; Business; Science)

---

### 250-word Project Description (under the 250 limit)

You can use this almost verbatim and adjust to your voice.

> **Problem**
> As AI systems move into healthcare, finance, education and policy, one question keeps coming up: “Can I actually trust this answer?” Large models often sound confident even when they are guessing. Today there is no simple way for a non-expert to see which parts of an AI explanation are grounded in reality and which parts are hallucinated.
>
> **Solution**
> ReasonLens is an “inference autopsy” lab for AI answers, built with Gemini 3 Pro in Google AI Studio. Paste any AI response, article snippet, or upload a screenshot or PDF. ReasonLens uses Gemini 3 to decompose the text into atomic claims, classify each as factual or opinion, and build a claim graph. For every important factual claim, Gemini 3 with search grounding retrieves web evidence and judges whether the claim is supported, contradicted, mixed or unknown.
>
> The app presents an interactive autopsy view: a scorecard of how many claims are supported, a color coded table of claims with explanations and evidence snippets, and a “weakest links” section that highlights the most fragile reasoning chains. Finally, ReasonLens uses Gemini 3 to suggest a better prompt and an optional revised answer that is more cautious and transparent about uncertainty.
>
> **Impact**
> ReasonLens acts as a general purpose trust layer for AI. Doctors, founders, researchers and everyday users can quickly sanity check AI explanations before they influence decisions, making Gemini powered applications safer, more transparent and easier to adopt.

(That should land comfortably under 250 words.)

---

### 2-minute video storyboard

Aim for ~90–110 seconds of talking; leave a little time for pauses.

**Scene 1 - Hook (0–20s)**

* Visual: A believable but flawed AI answer about a medical or financial topic on screen.
* Voice:

  > “AI can give you a beautiful, confident answer in seconds. But which sentences are solid.. and which are hallucinations? You can’t see that with your eyes.”

**Scene 2 - Introduce ReasonLens (20–40s)**

* Visual: Switch to AI Studio app.. ReasonLens interface.. paste the same answer.
* Voice:

  > “ReasonLens is an inference autopsy, powered by Gemini 3 Pro. Paste any AI answer or article, or upload a screenshot, and hit ‘Run Autopsy’.”

**Scene 3 - Autopsy in action (40–80s)**

* Visual: Show loading, then:

  * Overall scorecard at top.
  * Claims table with color coding; click into one claim.
  * On the right, show evidence snippets and the status “Contradicted” or “Supported”.
* Voice:

  > “First, Gemini breaks the text into atomic claims and builds a claim graph. Then, for each important factual claim, it uses search grounding to pull evidence from the web and judge it as supported, contradicted, mixed or unknown. Green means the claim is well supported. Yellow is murky. Red is where the logic breaks. ReasonLens also highlights the weakest reasoning chain.. the place where this answer is most likely to fail.”

**Scene 4 - Prompt improvement and impact (80–115s)**

* Visual: Click “Ask better next time”, show a better prompt and a revised answer.
* Voice:

  > “Finally, ReasonLens teaches you how to ask better questions, and can rewrite the answer to be more cautious and transparent about uncertainty. Doctors, founders, researchers and everyday users can use ReasonLens as a trust layer on top of any AI system.”

**Scene 5 - Close (115–120s)**

* Visual: Logo / title screen with app link.
* Voice:

  > “Don’t just trust AI.. interrogate it with ReasonLens.”

Done.

---

## 6. What I’d do next, in order

1. In Playground, lock claim extraction JSON.
2. Lock per-claim verification JSON with search grounding.
3. Move to Build and implement `runAutopsy`.
4. Ship rough UI.
5. Add multimodal upload.
6. Polish copy and flows.. then record the video and publish.

If you want, in the next step I can draft the **exact prompts and JSON schemas** for:

* Claim extraction.
* Claim verification.
* Weakest-chain summary.
* Prompt-improvement generation.

So you can literally copy them into AI Studio and start vibing code around them.
