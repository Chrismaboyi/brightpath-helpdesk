import { writeFile, mkdir } from "node:fs/promises";
import { handleAsk } from "../netlify/functions/ask.mjs";

const results = [];
for (const test of [
  {
    name: "Supported question",
    question: "How do I save my lesson progress?",
    expected: "answered",
  },
  {
    name: "Unknown question",
    question: "What is the refund policy?",
    expected: "unknown",
  },
  {
    name: "API failure",
    question: "How do I save my lesson progress?",
    simulateFailure: true,
    expected: "error",
  },
]) {
  const start = performance.now();
  const request = new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(test),
  });
  // Hermetic evidence: explicitly the mock, not an unverified live-model claim.
  const response = await handleAsk(request, { env: {} });
  const data = await response.json();
  results.push({
    name: test.name,
    input: test.question,
    simulatedFailure: test.simulateFailure || false,
    expected: test.expected,
    actual: data.status,
    passed:
      data.status === test.expected &&
      (test.simulateFailure
        ? response.status === 503
        : response.status === 200),
    httpStatus: response.status,
    durationMs: Math.round(performance.now() - start),
    response: data,
  });
}
const report = {
  testedAt: new Date().toISOString(),
  mode: "deterministic mock",
  execution: "Actual Netlify handler invoked locally; no live provider called",
  results,
};
await mkdir("docs", { recursive: true });
await writeFile(
  "docs/test-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  "docs/TEST-RESULTS.md",
  `# Saved practical-test results\n\nRun: ${report.testedAt}\n\nMode: **deterministic mock**. These are actual local handler responses, not evidence of live model quality.\n\n${results.map((result) => `## ${result.name}: ${result.passed ? "PASS" : "FAIL"}\n\nQuestion: ${result.input}\n\nHTTP ${result.httpStatus} · ${result.actual}\n\n${result.response.answer || result.response.message}\n\nSources: ${result.response.sources?.map((source) => `${source.documentId} / ${source.factId}`).join(", ") || "None"}\n`).join("\n")}\n## Next improvement\n\nRun an evaluation set of paraphrases, mixed supported/unsupported questions and adversarial requests against a real model. Measure passage relevance and abstention accuracy. Exact source rendering prevents invented prose but does not prove that the selected passage answers the question.\n`,
);
console.log(
  `${results.filter((result) => result.passed).length}/3 practical-test cases passed. Saved docs/test-results.json and docs/TEST-RESULTS.md.`,
);
if (results.some((result) => !result.passed)) process.exitCode = 1;
