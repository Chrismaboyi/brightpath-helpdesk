// Verbatim fictional source material supplied with the practical test.
export const documents = [
  {
    id: "doc-1",
    number: "01",
    title: "Getting started",
    description: "Your first lesson, course structure and progress.",
    paragraphs: [
      "Platform: BrightPath Learn (fictional).",
      "After joining, open Home and select Start Lesson 1: Set your goal.",
      "The Foundations course has 6 lessons. Lessons can be watched in any order.",
      "To save your progress, select Mark complete after finishing a lesson. Watching a video alone does not mark the lesson complete.",
      "Your next lesson appears on Home.",
    ],
  },
  {
    id: "doc-2",
    number: "02",
    title: "Coaching and feedback",
    description: "Live sessions, recordings and practice feedback.",
    paragraphs: [
      "Platform: BrightPath Learn (fictional).",
      "A group coaching session takes place every Tuesday at 16:00 UTC.",
      "The link appears on the Coaching page 30 minutes before the session.",
      "Recordings are added to the Coaching page within 24 hours.",
      "To get feedback on practice work, paste a shareable link in the Practice page and select Request feedback.",
      "Feedback usually arrives within 2 working days. This is a typical response time, not a guarantee.",
    ],
  },
  {
    id: "doc-3",
    number: "03",
    title: "Account help",
    description: "Passwords, missing courses and contacting support.",
    paragraphs: [
      "Platform: BrightPath Learn (fictional).",
      "To reset a password, select Forgot password on the sign-in page.",
      "For a missing course or incorrect lesson progress, contact support@brightpath.example and include the account email and lesson name.",
      "Support is available Monday to Friday, 09:00–17:00 UTC.",
      "This document does not contain pricing, refund rules or job placement promises. For those questions, say the information is not available in the supplied documents and refer the member to support.",
      "Never ask a member to send a password.",
    ],
  },
];

export const facts = documents.flatMap((doc) =>
  doc.paragraphs.slice(1).map((text, index) => ({
    id: `${doc.id}-p${index + 1}`,
    documentId: doc.id,
    text,
  })),
);

export const unknownMessage =
  "That information is not available in the supplied documents. Please contact support@brightpath.example for help.";

export function sourceFor(fact) {
  const doc = documents.find((doc) => doc.id === fact.documentId);
  return {
    documentId: doc.id,
    title: doc.title,
    factId: fact.id,
    quote: fact.text,
  };
}
