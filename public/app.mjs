import { documents } from "./shared/documents.mjs";
import { demoAnswer } from "./shared/demo.mjs";

const $ = (selector) => document.querySelector(selector);
const icon = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
};
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (className, text, onClick, iconName) => {
  const node = el("button", className, text);
  node.type = "button";
  node.addEventListener("click", onClick);
  if (iconName) node.append(icon(iconName));
  return node;
};
let transport = "server";
let mode = "demo";
let busy = false;
let generation = 0;
let activeController;
let toastTimer;
let savedResults = [];
const transcript = $("#transcript");
const questionField = $("#question");

function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 3500);
}
async function copy(text, success) {
  try {
    await navigator.clipboard.writeText(text);
    toast(success);
  } catch {
    toast("Copy isn’t available here. Please select and copy the text.");
  }
}
function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}
document
  .querySelectorAll("[data-close]")
  .forEach((btn) =>
    btn.addEventListener("click", () => btn.closest("dialog").close()),
  );
document.querySelectorAll("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    const box = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom)
    )
      dialog.close();
  }),
);

function showDocument(id, factIds = []) {
  const doc = documents.find((doc) => doc.id === id);
  if (!doc) return;
  $("#source-number").textContent = `DOCUMENT ${doc.number} · SOURCE MATERIAL`;
  $("#source-title").textContent = doc.title;
  const content = $("#source-content");
  content.className = "document-body document-path";
  $("#source-dialog").dataset.tone = doc.number;
  content.replaceChildren();
  doc.paragraphs.forEach((text, index) => {
    const paragraph = el(
      "p",
      factIds.includes(`${id}-p${index}`) ? "highlight" : "",
      text,
    );
    content.append(paragraph);
  });
  openDialog($("#source-dialog"));
  $("#source-dialog").scrollTop = 0;
}
const guideIcons = { "doc-1": "flag", "doc-2": "clock", "doc-3": "key" };
for (const doc of documents) {
  const source = button("source-item", "", () => showDocument(doc.id));
  source.dataset.tone = doc.number;
  source.append(el("span", "source-number", doc.number));
  const copy = el("span");
  copy.append(el("strong", "", doc.title), el("small", "", doc.description));
  source.append(copy, icon("arrow"));
  $("#source-list").append(source);
  const article = el("article", "knowledge-document");
  article.dataset.tone = doc.number;
  const head = el("header", "document-head");
  const badge = el("span", "document-badge");
  badge.setAttribute("aria-hidden", "true");
  badge.append(icon(guideIcons[doc.id] || "book"));
  const titles = el("div");
  titles.append(
    el("span", "document-index", `Guide ${doc.number}`),
    el("h3", "", doc.title),
    el("p", "document-summary", doc.description),
  );
  head.append(badge, titles);
  const body = el("div", "document-body document-path");
  doc.paragraphs.forEach((p) => body.append(el("p", "", p)));
  article.append(head, body);
  $("#knowledge-documents").append(article);
}
function setView(view) {
  const knowledge = view === "knowledge";
  $("#help-view").hidden = knowledge;
  $("#knowledge-view").hidden = !knowledge;
  $("#help-nav").classList.toggle("active", !knowledge);
  $("#knowledge-nav").classList.toggle("active", knowledge);
  $("#help-nav").toggleAttribute("aria-current", !knowledge);
  $("#knowledge-nav").toggleAttribute("aria-current", knowledge);
  (knowledge ? $("#knowledge-nav") : $("#help-nav")).setAttribute(
    "aria-current",
    "page",
  );
  $("#page-label").textContent = knowledge ? "Knowledge base" : "Help desk";
  if (knowledge) {
    $("#knowledge-title").tabIndex = -1;
    $("#knowledge-title").focus({ preventScroll: true });
  }
}
$("#help-nav").addEventListener("click", () => setView("help"));
$("#knowledge-nav").addEventListener("click", () => setView("knowledge"));
$("#all-guides").addEventListener("click", () => setView("knowledge"));
$("#back-to-help").addEventListener("click", () => {
  setView("help");
  questionField.focus();
});
// Live open/closed status for the support hours stated in guide 03
// (Monday–Friday, 09:00–17:00 UTC).
function supportStatus(now = new Date()) {
  const day = now.getUTCDay();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const weekday = day >= 1 && day <= 5;
  if (weekday && minutes >= 540 && minutes < 1020) {
    const left = 1020 - minutes;
    const hours = Math.floor(left / 60);
    return {
      open: true,
      text: `Open now · closes in ${hours ? `${hours}h ` : ""}${left % 60}m`,
    };
  }
  const opensToday = weekday && minutes < 540;
  const opensMonday = day === 5 || day === 6 || day === 0;
  return {
    open: false,
    text: `Closed now · opens ${opensToday ? "today" : opensMonday ? "Monday" : "tomorrow"} at 09:00 UTC`,
  };
}
function openSupport() {
  const status = supportStatus();
  $("#support-status").textContent = status.text;
  $("#support-status").classList.toggle("open", status.open);
  openDialog($("#support-dialog"));
}
$("#support-open").addEventListener("click", openSupport);
$("#copy-email").addEventListener("click", () =>
  copy("support@brightpath.example", "Example support email copied."),
);
$("#support-source").addEventListener("click", () => {
  $("#support-dialog").close();
  showDocument("doc-3");
});
for (const selector of ["#review-open", "#mode-badge"])
  $(selector).addEventListener("click", () => openDialog($("#review-dialog")));

function updateMode() {
  const live = mode === "live";
  $("#mode-label").textContent = live ? "Live model" : "Demo mode";
  $("#mode-badge").classList.toggle("live", live);
  $("#mode-badge").setAttribute(
    "aria-label",
    `View ${live ? "live model" : "demo mode"} information`,
  );
  $("#review-mode-title").textContent = live
    ? "Gemini · source selection"
    : "Deterministic demo";
  $("#review-mode-description").textContent = live
    ? "Gemini finds the relevant parts of the guides. We check the references and show you the original wording."
    : `Demo mode matches questions to passages in the three guides. No language model is running.${transport === "static" ? " This static preview works without a server." : ""}`;
}
const ready = (async () => {
  try {
    const response = await fetch("/api/ask", {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (
      response.status === 404 ||
      (response.ok &&
        response.headers.get("content-type")?.includes("text/html"))
    ) {
      transport = "static";
      mode = "demo";
    } else if (response.ok) {
      const config = await response.json();
      if (!["demo", "live"].includes(config.mode))
        throw new Error("Invalid configuration");
      mode = config.mode;
    } else throw new Error("Unavailable");
    updateMode();
  } catch {
    // An actual service failure never silently switches to a mock.
    transport = "unavailable";
    mode = "unavailable";
    $("#mode-label").textContent = "Service unavailable";
    $("#review-mode-title").textContent = "Service unavailable";
    $("#review-mode-description").textContent =
      "The server could not be reached. Questions will show a recoverable error; all three guides are still available.";
  }
})();

async function requestAnswer(question, simulateFailure = false, signal) {
  await ready;
  if (transport === "static") {
    if (simulateFailure)
      return {
        status: "error",
        code: "SIMULATED_FAILURE",
        httpStatus: 503,
        message:
          "We can’t get an answer right now. Please try again in a moment, or browse the guides.",
      };
    return { ...demoAnswer(question), httpStatus: 200 };
  }
  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, simulateFailure }),
    signal: signal || AbortSignal.timeout(22000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response");
  }
  if (!["answered", "unknown", "error"].includes(data.status))
    throw new Error("Invalid response");
  if (
    data.status !== "error" &&
    (!response.ok ||
      typeof data.answer !== "string" ||
      !Array.isArray(data.sources))
  )
    throw new Error("Invalid response");
  if (data.status === "error" && typeof data.message !== "string")
    throw new Error("Invalid response");
  if (response.ok && ["demo", "live"].includes(data.mode)) {
    mode = data.mode;
    transport = "server";
    updateMode();
  }
  return { ...data, httpStatus: response.status };
}
function updateComposer() {
  $("#send-button").disabled = busy || !questionField.value.trim();
  $("#send-button").setAttribute(
    "aria-label",
    busy ? "Waiting for an answer" : "Send question",
  );
  $("#character-count").hidden = questionField.value.length < 850;
  $("#character-count").textContent = `${questionField.value.length} / 1,000`;
  questionField.style.height = "auto";
  questionField.style.height =
    Math.min(Math.max(questionField.scrollHeight, 92), 150) + "px";
}
questionField.addEventListener("input", updateComposer);
questionField.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!busy && questionField.value.trim())
      $("#question-form").requestSubmit();
  }
});
$("#question-form").addEventListener("submit", (event) => {
  event.preventDefault();
  askQuestion(questionField.value);
});
document
  .querySelectorAll("[data-question]")
  .forEach((btn) =>
    btn.addEventListener("click", () => askQuestion(btn.dataset.question)),
  );
function setBusy(value) {
  busy = value;
  updateComposer();
  $("#question-form").setAttribute("aria-busy", String(value));
  document.querySelectorAll("[data-question]").forEach((btn) => {
    btn.disabled = value;
  });
}
function showTranscript() {
  $("#welcome").hidden = true;
  transcript.hidden = false;
}
function scrollTranscript() {
  transcript.scrollTop = transcript.scrollHeight;
}
function appendUser(question) {
  const message = el("article", "message user");
  message.append(
    el("div", "message-label", "You"),
    el("div", "message-content", question),
  );
  transcript.append(message);
}
function appendLoading() {
  const message = el("div", "message loading-message");
  message.setAttribute("role", "status");
  const line = el("div", "loading-text");
  const dots = el("span", "loading-dots");
  dots.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) dots.append(el("i"));
  line.append(dots, el("span", "", "Looking through the guides…"));
  message.append(line);
  transcript.append(message);
  return message;
}
function appendAnswer(data, question) {
  const message = el("article", "message assistant");
  const label = el("div", "message-label");
  label.append(el("span", "mini-sun", "✳"), el("span", "", "BrightPath"));
  const responseMode = data.mode || mode;
  if (["live", "demo"].includes(responseMode))
    label.append(
      el(
        "span",
        "answer-mode",
        responseMode === "live" ? "Live model" : "Demo",
      ),
    );
  message.append(label);
  if (data.status === "error") {
    const box = el("div", "error-box");
    if (data.code === "SIMULATED_FAILURE")
      box.append(
        el("span", "failure-label", "SIMULATED FAILURE · REVIEW TEST"),
      );
    box.append(
      el("h3", "", "We couldn’t get an answer."),
      el(
        "p",
        "",
        data.message ||
          "We couldn’t reach the answer service. Try again in a moment, or check the guides.",
      ),
    );
    box.append(
      button(
        "text-button",
        "Try again",
        () => askQuestion(question, false, true),
        "refresh",
      ),
      button(
        "text-button",
        "Browse the guides",
        () => setView("knowledge"),
        "book",
      ),
    );
    message.append(box);
  } else {
    label.append(
      el(
        "span",
        `answer-status${data.status === "unknown" ? " unknown" : ""}`,
        data.status === "unknown" ? "Not in the guides" : "From the guides",
      ),
    );
    const body = el("div", "message-content");
    data.answer
      .split(/\n\n+/)
      .forEach((paragraph) => body.append(el("p", "", paragraph)));
    message.append(body);
    const sources = el("div", "citations");
    const groups = new Map();
    for (const source of data.sources.filter((source) =>
      documents.some((doc) => doc.id === source.documentId),
    )) {
      if (!groups.has(source.documentId)) groups.set(source.documentId, []);
      groups.get(source.documentId).push(source);
    }
    for (const [id, group] of groups) {
      const doc = documents.find((doc) => doc.id === id);
      const cite = button("citation", "", () =>
        showDocument(
          id,
          group.map((s) => s.factId),
        ),
      );
      cite.append(icon("book"), el("span", "", `${doc.number} · ${doc.title}`));
      sources.append(cite);
    }
    if (groups.size) message.append(sources);
    const actions = el("div", "message-actions");
    const copyButton = button(
      "",
      "Copy answer",
      () => copy(data.answer, "Answer copied."),
      "copy",
    );
    actions.append(copyButton);
    if (data.status === "unknown")
      actions.append(button("", "Support information", openSupport, "mail"));
    message.append(actions);
  }
  transcript.append(message);
  return message;
}
async function askQuestion(input, simulateFailure = false, retry = false) {
  const question = input.trim();
  if (busy || !question || question.length > 1000) return;
  const current = ++generation;
  setView("help");
  showTranscript();
  if (!retry) appendUser(question);
  questionField.value = "";
  setBusy(true);
  const loading = appendLoading();
  scrollTranscript();
  activeController = new AbortController();
  const timeout = setTimeout(() => activeController?.abort(), 22000);
  try {
    const data = await requestAnswer(
      question,
      simulateFailure,
      activeController.signal,
    );
    if (current !== generation) return;
    loading.remove();
    appendAnswer(data, question);
  } catch {
    if (current !== generation) return;
    loading.remove();
    appendAnswer(
      {
        status: "error",
        mode,
        message:
          "We couldn’t reach the answer service. Try again in a moment, or check the guides.",
      },
      question,
    );
  } finally {
    clearTimeout(timeout);
    if (current === generation) {
      setBusy(false);
      scrollTranscript();
      questionField.focus({ preventScroll: true });
    }
  }
}
$("#new-conversation").addEventListener("click", () => {
  generation++;
  activeController?.abort();
  transcript.replaceChildren();
  transcript.hidden = true;
  $("#welcome").hidden = false;
  questionField.value = "";
  setBusy(false);
  setView("help");
  questionField.focus({ preventScroll: true });
  toast(
    "Ready for a new question. Your previous conversation has been cleared.",
  );
});
$("#simulate-failure").addEventListener("click", () => {
  if (busy) {
    toast("Let the current answer finish, then try the failure test.");
    return;
  }
  $("#review-dialog").close();
  askQuestion("How do I save my lesson progress?", true);
});

$("#run-checks").addEventListener("click", async () => {
  const run = $("#run-checks");
  run.disabled = true;
  run.textContent = "Checking the three cases…";
  const output = $("#check-results");
  output.replaceChildren();
  output.hidden = false;
  $("#export-results").hidden = true;
  savedResults = [];
  const cases = [
    {
      name: "Supported question",
      question: "How do I save my lesson progress?",
      expected: "answered",
      check: (data) =>
        data.status === "answered" &&
        data.answer.includes("Mark complete") &&
        data.sources.some((source) => source.documentId === "doc-1"),
    },
    {
      name: "Unknown question",
      question: "What is the refund policy?",
      expected: "unknown",
      check: (data) => data.status === "unknown" && data.sources.length === 0,
    },
    {
      name: "API failure",
      question: "How do I save my lesson progress?",
      simulateFailure: true,
      expected: "503 / SIMULATED_FAILURE",
      check: (data) =>
        data.httpStatus === 503 && data.code === "SIMULATED_FAILURE",
    },
  ];
  for (const test of cases) {
    const start = performance.now();
    let data;
    try {
      data = await requestAnswer(test.question, test.simulateFailure);
    } catch {
      data = {
        status: "error",
        message: "Could not reach the answer service.",
        httpStatus: 0,
      };
    }
    const passed = Boolean(test.check(data));
    const result = {
      name: test.name,
      question: test.question,
      expected: test.expected,
      passed,
      durationMs: Math.round(performance.now() - start),
      transport,
      mode,
      response: data,
      testedAt: new Date().toISOString(),
    };
    savedResults.push(result);
    const card = el("div", `test-result${passed ? "" : " failed"}`);
    card.append(
      el("strong", "", `${passed ? "PASS" : "FAIL"} · ${test.name}`),
      el("div", "", data.answer || data.message),
      el(
        "small",
        "",
        `${data.status} · HTTP ${data.httpStatus} · ${result.durationMs} ms · ${mode}${transport === "static" ? " · browser simulation" : ""}`,
      ),
    );
    output.append(card);
  }
  run.disabled = false;
  run.textContent = "Run all three checks again";
  run.append(icon("refresh"));
  $("#export-results").hidden = false;
});
$("#export-results").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(savedResults, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = el("a");
  link.href = url;
  link.download = "brightpath-test-results.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
updateComposer();
