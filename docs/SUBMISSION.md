# Submission draft

Review this text and fill in your honest total time. Be ready to explain the implementation. Mock-mode results and real-model results are saved separately.

## Links to your work

1. https://github.com/Chrismaboyi/brightpath-helpdesk
2. https://brightpath-learn-helpdesk.netlify.app

## Walk me through your work

I built a small BrightPath Learn help desk around the three supplied fictional documents. It accepts typed questions, presents answers with document citations, and opens the original guide with the relevant passage highlighted. It includes a readable mobile layout, suggested questions, an accessible source viewer, and a clear distinction between supported answers, missing information and service failures.

The deployed app uses Gemini 3.8 Flash through a Netlify Function. Its API key is a secret environment variable and is not included in the repository or sent to the browser. Local setup also has a clearly labelled deterministic mock for running without a provider account. In live mode, the model selects fact IDs; the server validates them and returns the exact source passages. I chose this extractive approach to reduce invented claims and make the answer easy to audit. All three documents fit in context, so a vector database would add complexity without helping this test.

The three saved practical-test results are:

- **Supported:** “How do I save my lesson progress?” returned the instruction to select **Mark complete**, including the warning that watching a video alone does not mark it complete. Citation: **Document 1 — Getting started**. HTTP 200.
- **Unknown:** “What is the refund policy?” returned that the information is not available in the supplied documents and referred the member to the fictional support address. It did not invent a refund policy or attach a misleading citation. HTTP 200, `unknown`.
- **Failure:** a request with the one-shot failure flag returned HTTP 503 and a clear retry/browse message. The browser test confirmed that **Try again** makes a normal request and recovers. The flag can be triggered through Review tools.

The supported and unknown cases were run against the actual Gemini model through the local handler; the failure case intentionally returns a simulated 503. These responses are saved in `docs/live-test-results.json`. Reproducible mock-mode results are saved separately in `docs/test-results.json`. The unit suite also covers provider HTTP errors, malformed model output, invalid citations, timeouts and input validation using fixtures. The browser suite checks the user flows, responsive widths and accessibility across the main states.

The interface, shared document/fact representation, mock answerer, Gemini adapter, failure handling, Netlify configuration, written walkthrough and tests were implemented for this brief with Codex assistance. No prebuilt UI kit or template was used. The logo was supplied by me as the applicant; the fonts are open-source.

My next improvement would be to run a small evaluation set against the real model, measuring passage relevance and abstention on paraphrases, ambiguous requests, mixed supported/unsupported questions and prompt injection. Exact source rendering prevents invented answer prose, but a model can still select an irrelevant or incomplete passage.

## How much time did you spend?

[Enter your honest total, including your own setup, review and deployment. Keep within the brief’s two-hour cap. The agent build-session duration is recorded separately in docs/BUILD-NOTES.md.]

## What tools did you use?

OpenAI Codex assisted with product design, HTML/CSS/JavaScript implementation, documentation and tests. The application uses browser APIs, Node.js and Netlify Functions, with no application runtime dependencies. Playwright and axe-core checked browser behavior and accessibility. Prettier formatted the source. DM Sans and Lexend are self-hosted open-source fonts. The hosted app uses Google's Gemini API. Saved evidence distinguishes actual model calls from deterministic mock responses and provider fixtures.

## What is unfinished or limited?

The live Gemini integration passed the two saved smoke-test questions, but that is a small sample rather than a broad answer-quality evaluation. The keyword mock has limited paraphrase coverage and is only an engineering demonstration. Each question is independent; the visible transcript is not model memory. Extractive answers preserve the original source wording rather than offering a fully conversational rewrite. There is no persistent conversation storage, durable rate limiting or production monitoring. A manual static Netlify deployment supports the browser-side mock; live model use requires a Functions deployment and a server-side key. BrightPath Learn and its support email are fictional.
