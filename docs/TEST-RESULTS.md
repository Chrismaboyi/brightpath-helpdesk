# Saved practical-test results

Run: 2026-11-12T12:08:15.946Z

Mode: **deterministic mock**. These are actual local handler responses, not evidence of live model quality.

## Supported question: PASS

Question: How do I save my lesson progress?

HTTP 200 · answered

To save your progress, select Mark complete after finishing a lesson. Watching a video alone does not mark the lesson complete.

Sources: doc-1 / doc-1-p3

## Unknown question: PASS

Question: What is the refund policy?

HTTP 200 · unknown

That information is not available in the supplied documents. Please contact support@brightpath.example for help.

Sources: None

## API failure: PASS

Question: How do I save my lesson progress?

HTTP 503 · error

We can’t get an answer right now. Please try again in a moment, or browse the guides.

Sources: None

## Next improvement

Run an evaluation set of paraphrases, mixed supported/unsupported questions and adversarial requests against a real model. Measure passage relevance and abstention accuracy. Exact source rendering prevents invented prose but does not prove that the selected passage answers the question.
