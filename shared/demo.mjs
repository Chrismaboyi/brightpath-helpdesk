import { facts, sourceFor, unknownMessage } from "./documents.mjs";

// Deliberately small, deterministic mock. This is not a language model or a
// semantic retriever. It demonstrates the UI and source/failure contracts.
const rules = [
  [/\b(start|begin|join|first|goal|onboard)\b/i, ["doc-1-p1"]],
  [/\b(how many|six|6|order|foundation|structure)\b/i, ["doc-1-p2"]],
  [
    /\b(progress|complet\w*|save|watched|watching|finished|finish|tick)\b/i,
    ["doc-1-p3"],
  ],
  [/\b(next lesson|what.?s next)\b/i, ["doc-1-p4"]],
  [/\b(coach\w*|session|tuesday|live call)\b/i, ["doc-2-p1", "doc-2-p2"]],
  [/\b(record\w*|replay|missed)\b/i, ["doc-2-p3"]],
  [/\b(feedback|practice|review my work)\b/i, ["doc-2-p4", "doc-2-p5"]],
  [/\b(password|sign.?in|log.?in|locked out)\b/i, ["doc-3-p1", "doc-3-p5"]],
  [/\b(missing|incorrect|wrong|disappear\w*)\b/i, ["doc-3-p2"]],
  [
    /\b(support|contact|email|opening hours|available|human)\b/i,
    ["doc-3-p2", "doc-3-p3"],
  ],
];
const unsupported =
  /\b(pric\w*|cost\w*|pay\w*|fees?|refund\w*|money|job\w*|placement|guarantee\w*|certificate\w*|accredit\w*|discount\w*|scholarship\w*|language\w*|mobile app|offline|weekend|cancel\w*)\b/i;
const injection =
  /ignore.{0,30}(instruction|document|previous)|system prompt|pretend|make (it|something) up|invent|api.?key/i;

export function demoAnswer(question) {
  if (unsupported.test(question) || injection.test(question)) {
    return {
      status: "unknown",
      answer: unknownMessage,
      sources: [],
      mode: "demo",
    };
  }
  const ids = [
    ...new Set(
      rules
        .filter(([pattern]) => pattern.test(question))
        .flatMap(([, ids]) => ids),
    ),
  ];
  // Wrong lesson progress is an account problem, not a completion instruction.
  if (
    /\b(incorrect|wrong|missing)\b/i.test(question) &&
    /progress/i.test(question)
  ) {
    ids.splice(0, ids.length, "doc-3-p2", "doc-3-p3");
  }
  if (!ids.length)
    return {
      status: "unknown",
      answer: unknownMessage,
      sources: [],
      mode: "demo",
    };
  const selected = ids
    .slice(0, 5)
    .map((id) => facts.find((fact) => fact.id === id));
  return {
    status: "answered",
    answer: selected.map((fact) => fact.text).join("\n\n"),
    sources: selected.map(sourceFor),
    mode: "demo",
  };
}
