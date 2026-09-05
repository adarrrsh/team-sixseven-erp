/**
 * Sample human-handoff tickets, so the admin Support queue has something
 * realistic in it for a walkthrough.
 *
 *   npm run seed:support            # upsert, keeps anything already there
 *   npm run seed:support -- --fresh # clear the queue first
 *
 * Every ticket carries the conversation that led to it: the greeting, what the
 * visitor asked, the point the bot gave up, and — where someone picked it up —
 * the replies that followed.
 */
const connectDB = require("../db/connection");
const { disconnectDB } = require("../db/connection");
const SupportRequest = require("../models/SupportRequest");

/** Tickets are dated back from a fixed point so the queue reads as a real week. */
const NOW = new Date("2026-09-05T13:00:00+05:30");
const ago = (days, hours = 0, minutes = 0) =>
  new Date(NOW.getTime() - ((days * 24 + hours) * 60 + minutes) * 60_000).toISOString();

const BOT_GAVE_UP =
  "I couldn't help with that — please contact our support team at support@origin.edu and they'll get back to you.";
const GREETING = "Hi — I'm the admissions helpdesk. Ask me anything.";

/** Greeting, the question, and the moment the bot ran out of road. */
const opening = (question, at, extra = []) => [
  { from: "bot", text: GREETING, at },
  { from: "user", text: question, at },
  ...extra,
  { from: "bot", text: BOT_GAVE_UP, at },
];

const tickets = [
  {
    id: "SUP-1001",
    name: "Priya Nair",
    email: "priya.nair@mail.com",
    question: "My card was charged twice for the application fee",
    source: "login",
    status: "Open",
    raisedAt: ago(0, 1, 20),
    transcript: opening("My card was charged twice for the application fee", ago(0, 1, 20), [
      {
        from: "user",
        text: "The first attempt said failed but the money left my account both times.",
        at: ago(0, 1, 19),
      },
    ]),
  },
  {
    id: "SUP-1002",
    name: "Visitor",
    email: "",
    question: "I forgot which email I applied with",
    source: "login",
    status: "Open",
    raisedAt: ago(0, 3, 5),
    transcript: opening("I forgot which email I applied with", ago(0, 3, 5)),
  },
  {
    id: "SUP-1003",
    name: "Rohit Deshmukh",
    email: "rohit.d@mail.com",
    question: "The document upload keeps failing at 90%",
    source: "applicant",
    status: "Claimed",
    claimedBy: "registrar@origin.edu",
    raisedAt: ago(1, 2),
    transcript: [
      ...opening("The document upload keeps failing at 90%", ago(1, 2), [
        { from: "user", text: "It's a 14 MB scan of my Class XII marksheet.", at: ago(1, 1, 58) },
      ]),
      {
        from: "admin",
        text: "Thanks Rohit — the limit is 10 MB per file. Could you try a compressed PDF? I've made a note on your application so the deadline isn't held against you.",
        at: ago(0, 20),
      },
      { from: "user", text: "Trying now, thank you.", at: ago(0, 19, 30) },
    ],
  },
  {
    id: "SUP-1004",
    name: "Ananya Bose",
    email: "ananya.bose@mail.com",
    question: "Can I switch from B.Tech ECE to B.Tech CSE after applying?",
    source: "applicant",
    status: "Claimed",
    claimedBy: "registrar@origin.edu",
    raisedAt: ago(2, 4),
    transcript: [
      ...opening("Can I switch from B.Tech ECE to B.Tech CSE after applying?", ago(2, 4)),
      {
        from: "admin",
        text: "A programme change before the decision is fine — I'll need it in writing from the email on your application. Send it to registrar@origin.edu and I'll update the record.",
        at: ago(2, 1),
      },
    ],
  },
  {
    id: "SUP-1005",
    name: "Vivaan Gupta",
    email: "vivaan.g@origin.edu",
    question: "My attendance shows 71% but I was present last Tuesday",
    source: "student",
    status: "Resolved",
    claimedBy: "registrar@origin.edu",
    raisedAt: ago(3, 6),
    resolvedAt: ago(3, 2),
    transcript: [
      ...opening("My attendance shows 71% but I was present last Tuesday", ago(3, 6), [
        { from: "user", text: "I tapped in at Gate A around 9am.", at: ago(3, 5, 58) },
      ]),
      {
        from: "admin",
        text: "Found it — your card didn't register that morning, the reader logged no tap. I've marked you present for the 2nd from the day register.",
        at: ago(3, 3),
      },
      { from: "user", text: "Shows 74% now. Thanks!", at: ago(3, 2, 30) },
      {
        from: "admin",
        text: "Do come by the office if it happens again — the card may need reissuing.",
        at: ago(3, 2),
      },
    ],
  },
  {
    id: "SUP-1006",
    name: "Kabir Nair",
    email: "kabir.n@mail.com",
    question: "Why was my application rejected?",
    source: "applicant",
    status: "Resolved",
    claimedBy: "registrar@origin.edu",
    raisedAt: ago(4, 3),
    resolvedAt: ago(4, 1),
    transcript: [
      ...opening("Why was my application rejected?", ago(4, 3)),
      {
        from: "admin",
        text: "Your Class XII aggregate was below the cut-off for B.Tech MECH this intake. Applications reopen for the next intake and you're welcome to apply again.",
        at: ago(4, 1, 30),
      },
      { from: "user", text: "Understood, thank you for explaining.", at: ago(4, 1) },
    ],
  },
  {
    id: "SUP-1007",
    name: "Tara Menon",
    email: "tara.m@origin.edu",
    question: "My RFID card isn't opening the library gate",
    source: "student",
    status: "Open",
    raisedAt: ago(0, 5, 40),
    transcript: opening("My RFID card isn't opening the library gate", ago(0, 5, 40), [
      { from: "user", text: "It works fine at Block A.", at: ago(0, 5, 38) },
    ]),
  },
  {
    id: "SUP-1008",
    name: "Meera Iyer",
    email: "meera.i@mail.com",
    question: "When will the balance of my seat fee be due?",
    source: "applicant",
    status: "Resolved",
    claimedBy: "registrar@origin.edu",
    raisedAt: ago(5, 2),
    resolvedAt: ago(5, 1),
    transcript: [
      ...opening("When will the balance of my seat fee be due?", ago(5, 2), [
        { from: "user", text: "I've paid ₹30,000 of ₹74,000 so far.", at: ago(5, 1, 58) },
      ]),
      {
        from: "admin",
        text: "The balance is due before the semester starts. You can pay it from the applicant portal whenever you're ready — no late fee before then.",
        at: ago(5, 1),
      },
    ],
  },
];

(async () => {
  await connectDB();

  if (process.argv.includes("--fresh")) {
    const { deletedCount } = await SupportRequest.deleteMany({});
    console.log(`Cleared ${deletedCount} existing ticket(s)`);
  }

  // Upsert on the ticket id so re-running does not duplicate the queue.
  await SupportRequest.bulkWrite(
    tickets.map((ticket) => ({
      updateOne: { filter: { id: ticket.id }, update: { $set: ticket }, upsert: true },
    })),
  );

  const byStatus = tickets.reduce((m, t) => ({ ...m, [t.status]: (m[t.status] ?? 0) + 1 }), {});
  console.log(`Seeded ${tickets.length} support tickets:`);
  Object.entries(byStatus).forEach(([status, n]) => console.log(`   ${status.padEnd(9)} ${n}`));
  console.log(
    `   ${tickets.reduce((n, t) => n + t.transcript.length, 0)} transcript messages in total`,
  );

  await disconnectDB();
  process.exit(0);
})();
