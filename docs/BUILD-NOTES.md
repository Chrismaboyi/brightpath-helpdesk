# Build notes

Agent execution began: 12 Nov 2026, 13:01 SAST

Initial package: 12 Nov 2026, 13:25 SAST

Approximately **24 minutes** for the initial agent build. The subsequent UI edits and deployment are additional work. This excludes the applicant's own planning, review, account configuration and deployment; use your honest total in the application.

## Delivered

- Original responsive help desk reflecting the supplied logo's navy and yellow.
- Question input, exact source answers, highlighted citations and all three unedited documents.
- Explicit unknown answers, support context, one-shot simulated failure and retry.
- Clearly labelled deterministic demo, plus a server-side Gemini fact-selection adapter.
- Built static folder, Netlify Functions configuration and setup instructions.

## Verification

- **19/19 handler tests passed**; output in unit-test-results.txt.
- **27/27 browser checks passed**, including six viewport widths from 320 to 1920 pixels, citations, unknowns, failure recovery, static-mode behavior and network failure.
- **0 axe-core accessibility rule violations** across 8 audited states. This is automated evidence for those states, not a complete accessibility certification.
- Three brief-mandated cases executed against the local handler and saved in test-results.json.
- Built static assets successfully; source and deploy ZIPs checked for expected files.

## Explicit limits

The initial build used demo mode. In the deployment follow-up, the applicant supplied a working Gemini key, and the supported/unknown cases passed against Gemini 3.8 Flash. Results are saved in live-test-results.json. The third case is deliberately simulated. The key is stored as a Netlify production secret, with no credential written to the project. No recruitment submission was sent.

## Design decisions

The supplied open-book/sun logo establishes the palette and path illustration. Lexend headings echo the logo wordmark, and layered navy, cream and blue-tinted surfaces establish hierarchy without competing with the task. Sources are available beside the conversation and directly from each supported answer. Reviewer-only diagnostics are behind Review tools. On mobile, the composer precedes optional suggested questions. Native dialogs, focus states, reduced motion and contrast checks support keyboard and assistive use.

## AI assistance

OpenAI Codex assisted with design, implementation, documentation and tests. No UI kit or starter template was used. Playwright, axe-core and Prettier were development tools. DM Sans and Lexend are self-hosted with their font licenses.

## Published version

- Public source: https://github.com/Chrismaboyi/brightpath-helpdesk
- Live app: https://brightpath-learn-helpdesk.netlify.app
- Production deploy: 6af5ad10cab009c9731fc6eb
- Published through the GitHub and Netlify CLIs. Future Netlify updates use `netlify deploy --prod`.
- Source and static output were scanned for the supplied provider key and the deployment token; neither was present. Netlify confirms the provider key is a production secret and does not return its readable value.
- Supported question, unknown question and simulated 503 passed on the deployed endpoint; see deployed-test-results.json.
