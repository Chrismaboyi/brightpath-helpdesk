import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const port = 8891;
const base = process.env.BASE_URL || `http://127.0.0.1:${port}`;
const server = process.env.BASE_URL
  ? null
  : spawn(process.execPath, ["scripts/dev.mjs"], {
      env: { ...process.env, PORT: String(port), GEMINI_API_KEY: "" },
      stdio: "pipe",
    });
let browser;
const evidence = {
  testedAt: new Date().toISOString(),
  browser: process.env.PLAYWRIGHT_CHANNEL || "chromium",
  checks: [],
  accessibility: [],
  errors: [],
};
const check = (name, value = true) => {
  assert.ok(value, name);
  evidence.checks.push(name);
};
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    if (attempt === 59) throw new Error("Preview server did not start");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Content Security Policy|Refused to|violates.*directive/i.test(
        message.text(),
      )
    )
      evidence.errors.push(message.text());
  });
  await mkdir("docs/screenshots", { recursive: true });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#mode-label").filter({ hasText: "Demo mode" }).waitFor();
  check("Page loads in explicit demo mode");
  check(
    "Empty question cannot be submitted",
    await page.locator("#send-button").isDisabled(),
  );
  await page.screenshot({
    path: "docs/screenshots/desktop.png",
    fullPage: true,
  });

  async function accessibility(name) {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    evidence.accessibility.push({
      name,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((node) => ({
          html: node.html,
          summary: node.failureSummary,
        })),
      })),
    });
  }
  await accessibility("Desktop welcome");
  await page
    .getByRole("button", {
      name: "Save my progress Keep track of your lessons",
    })
    .click();
  await page.locator(".answer-status").waitFor();
  check(
    "Supported answer gives Mark complete instructions",
    (await page.locator(".message.assistant").last().innerText()).includes(
      "Mark complete",
    ),
  );
  await page.getByRole("button", { name: "01 · Getting started" }).click();
  check(
    "Citation opens the original source with matching passage highlighted",
    (await page.locator("#source-content .highlight").innerText()).includes(
      "Watching a video alone",
    ),
  );
  await accessibility("Source document dialog");
  await page.keyboard.press("Escape");
  check(
    "Escape closes the source dialog",
    !(await page.locator("#source-dialog").isVisible()),
  );
  await page.locator("#question").fill("What is the refund policy?");
  await page.locator("#question").press("Enter");
  await page.locator(".answer-status.unknown").waitFor();
  check(
    "Unknown answer clearly abstains",
    (await page.locator(".message.assistant").last().innerText()).includes(
      "not available in the supplied documents",
    ),
  );
  check(
    "Unknown answer has no fabricated citation",
    (await page
      .locator(".message.assistant")
      .last()
      .locator(".citation")
      .count()) === 0,
  );
  await accessibility("Conversation with supported and unknown answers");
  await page.locator("#review-open").click();
  await page.locator("#simulate-failure").click();
  await page.locator(".failure-label").waitFor();
  check("Failure is visibly labelled as a simulation");
  await page.screenshot({
    path: "docs/screenshots/failure.png",
    fullPage: true,
  });
  await accessibility("Recoverable failure");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".answer-status:not(.unknown)").length === 2,
  );
  check("One-shot failure recovers on retry");
  await page.locator("#review-open").click();
  await page.locator("#run-checks").click();
  await page.waitForFunction(
    () => document.querySelectorAll(".test-result").length === 3,
  );
  check(
    "All three reviewer checks pass",
    (await page.locator(".test-result.failed").count()) === 0,
  );
  await accessibility("Reviewer tools with actual test results");
  await page.screenshot({
    path: "docs/screenshots/review-tools.png",
    fullPage: true,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-results").click();
  check(
    "Reviewer can export test evidence",
    (await downloadPromise).suggestedFilename() ===
      "brightpath-test-results.json",
  );
  await page.keyboard.press("Escape");
  await page.locator("#knowledge-nav").click();
  check(
    "Knowledge base exposes all three original documents",
    (await page.locator(".knowledge-document").count()) === 3,
  );
  await accessibility("Knowledge base");
  await page.locator("#back-to-help").click();
  await page.locator("#support-open").click();
  check(
    "Support identifies the fictional email address",
    (await page.locator("#support-dialog").innerText()).includes(
      "does not receive email",
    ),
  );
  await accessibility("Support dialog");
  await page.keyboard.press("Escape");
  await page.locator("#new-conversation").click();
  check(
    "New conversation resets the session",
    (await page.locator(".message").count()) === 0,
  );
  await page
    .locator("#question")
    .fill("<img src=x onerror=alert(1)> How do I save progress?");
  await page.locator("#send-button").click();
  await page.locator(".answer-status").waitFor();
  check(
    "User input is rendered as text, never interpreted as HTML",
    (await page.locator(".message.user img").count()) === 0,
  );
  await page.locator("#new-conversation").click();
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    check(
      `No horizontal overflow at ${width}px`,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#toast").waitFor({ state: "hidden" });
  await page.locator(".hero-description").click();
  check(
    "Mobile question input is visible within the first screen",
    (await page.locator("#question").boundingBox()).y +
      (await page.locator("#question").boundingBox()).height <=
      844,
  );
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  await accessibility("Mobile welcome");
  await page.locator("#question").fill("How do I get practice feedback?");
  await page.locator("#send-button").click();
  await page.locator(".answer-status").waitFor();
  check(
    "Mobile can send a question and receive a source-backed answer",
    (await page.locator(".message.assistant").innerText()).includes(
      "not a guarantee",
    ),
  );
  await page.screenshot({
    path: "docs/screenshots/mobile-answer.png",
    fullPage: true,
  });

  const staticContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await staticContext.newPage();
  await staticPage.route("**/api/ask", (route) =>
    route.fulfill({ status: 404, body: "Not found" }),
  );
  await staticPage.goto(base);
  await staticPage.locator("#question").fill("How do I save progress?");
  await staticPage.locator("#send-button").click();
  await staticPage.locator(".answer-status").waitFor();
  check(
    "Static-only deployment keeps the explicitly labelled mock working",
    (await staticPage.locator(".message.assistant").innerText()).includes(
      "Mark complete",
    ),
  );
  await staticPage.locator("#review-open").click();
  check(
    "Static preview identifies browser-side demo mode",
    (await staticPage.locator("#review-mode-description").innerText()).includes(
      "static preview",
    ),
  );
  await staticContext.close();

  const brokenContext = await browser.newContext();
  const brokenPage = await brokenContext.newPage();
  await brokenPage.route("**/api/ask", (route) => route.abort("failed"));
  await brokenPage.goto(base);
  await brokenPage.locator("#question").fill("How do I save progress?");
  await brokenPage.locator("#send-button").click();
  await brokenPage.locator(".error-box").waitFor();
  check(
    "A real network failure does not silently fall back to the mock",
    (await brokenPage.locator(".answer-status").count()) === 0,
  );
  await brokenContext.close();
  check("No uncaught browser JavaScript errors", evidence.errors.length === 0);
  const violations = evidence.accessibility.reduce(
    (count, entry) => count + entry.violations.length,
    0,
  );
  await writeFile(
    "docs/browser-results.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(
    `${evidence.checks.length} browser checks passed; ${violations} accessibility rule violations across ${evidence.accessibility.length} audited states.`,
  );
  if (violations) {
    console.log(
      JSON.stringify(
        evidence.accessibility.filter((entry) => entry.violations.length),
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  server?.kill();
}
