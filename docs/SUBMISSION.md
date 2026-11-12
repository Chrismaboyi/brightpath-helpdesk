# Submission

## Links to your work

https://github.com/Chrismaboyi/brightpath-helpdesk

https://brightpath-learn-helpdesk.netlify.app

## Walk me through your work

I built a help desk for BrightPath Learn using the three documents in the brief. You can type a question or choose one of the suggestions. Each supported answer has a source button that opens the original document and highlights the relevant passage. I spent some time on the mobile layout too, so asking a question and checking an answer feels straightforward on a phone.

The live version uses Gemini through a Netlify Function. The model picks the passages that answer the question, and the server checks those references before returning the original wording. This keeps the answers tied to the documents. The API key stays in Netlify's secret settings. There’s also a labelled demo mode so the project runs locally without a key.

I checked these three cases on the deployed site:

- **“How do I save my lesson progress?”** It explained that you need to select **Mark complete**, and that watching the video alone doesn’t save completion. It cited Document 1.
- **“What is the refund policy?”** It said the supplied documents don’t contain that information and pointed to the support address. It didn’t make up a policy.
- **A failed API request.** The test button deliberately returned a 503. The page showed a clear error with options to retry or read the guides. Retrying worked in the browser test.

The saved responses are in [deployed-test-results.json](deployed-test-results.json). There are also tests for invalid input, bad model responses and provider errors.

The interface, source viewer, answer handler and tests were put together for this brief with Codex assistance. No UI template was used.

The next thing I’d improve is how thoroughly the model is tested. I’d try more ways of asking the same question, along with questions that mix information we have with information we don’t. Returning a real passage helps, but the model can still choose the wrong one.

## How much time did you spend?

[Add your actual total time, including setup, review and deployment.]

## What tools did you use?

I used OpenAI Codex to help with the design, implementation, documentation and tests. The app uses HTML, CSS, JavaScript, Node.js, Netlify Functions and Gemini. Playwright and axe-core helped check the browser flows and accessibility. Prettier handled formatting, and the fonts are DM Sans and Lexend.

## What is unfinished or limited?

The live version works for the cases I tested, but it needs a wider set of questions before I’d be confident about its overall answer quality. Each question is handled on its own, so it won’t understand a follow-up that relies on an earlier message. Answers use the original document wording. There’s no saved conversation history, production rate limiting or monitoring. The demo mode uses simple keyword matching and has limited coverage. BrightPath Learn and the support email are fictional.
