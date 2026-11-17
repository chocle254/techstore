import { z } from "zod";
import { currentUser, json, sameOrigin } from "@/lib/server/session";
import { rateLimit } from "@/lib/ratelimit";

// The "Record my day" chat. The phone sends the conversation, the answers so far and a short
// picture of the business (products, places, who owes, booked orders). The AI asks the next
// question and returns the answers as a draft. Nothing is saved here: she checks the draft on
// the phone and saves it there.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Each model has its own free-plan limit on Groq, so the second one takes over when the first is busy.
const MODELS = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"];

const msg = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(3000) });
const body = z.object({
  messages: z.array(msg).min(1).max(60),
  context: z.record(z.string(), z.unknown()),
  draft: z.unknown().optional(),
});

const SCHEMA = `{
 "reply": "what you say to her next (short)",
 "done": false,
 "draft": {
  "date": "YYYY-MM-DD",
  "place": "place id, or \\"\\" for other / shop",
  "packed": [{"p": "product id", "ml": 500, "qty": 10}],
  "back": [{"p": "product id", "ml": 500, "qty": 2}],
  "sold": [{"p": "product id", "ml": 500, "qty": 8}],
  "orders": [{"id": "order id", "how": "cash | mpesa | later | no"}],
  "credit": [{"name": "customer name", "items": [{"p": "product id", "ml": 1000, "qty": 1}], "due": "YYYY-MM-DD"}],
  "paid": [{"id": "customer id", "amount": 500, "pay": "cash | mpesa"}],
  "spent": [{"cat": "Transport | Food | Containers | Labels | Tips | Other", "amount": 200}],
  "cash": null,
  "mpesa": null,
  "newOrders": [{"name": "customer name", "place": "place id", "date": "YYYY-MM-DD", "items": [{"p": "product id", "ml": 20000, "qty": 1}]}]
 }
}`;

function systemPrompt(name: string, context: Record<string, unknown>) {
  return `You help ${name} record her day of selling for JonWin Clean, her family business in Kenya that makes and sells liquid soap, bleach, antiseptic and disinfectant. She sells at a different place each day of the week, and comes home with everything in her head or on paper. She finds apps hard, so you ask the questions and fill in the records for her.

How to talk: warm, patient, plain simple English, like a helpful family member. Short messages. One question at a time (two at most). Use customers' names. Money is Kenyan shillings (KSh).

Go through these in a natural order, skipping what doesn't apply:
1. Which day (usually today) and where she went (the route place for that day is in the data).
2. How many bottles of each product and size she packed to sell, then how many came back. If she only knows how many she sold, fill "sold" instead and leave "packed"/"back" empty. Booked orders are not part of these bottles.
3. For each booked order in the data for that day or earlier: was it delivered, and was it paid cash, M-Pesa or pay later ("no" if not delivered).
4. Who took bottles to pay later: their name, what they took, when they will pay.
5. Did anyone who owes money pay some back? Name the people who owe, starting with those at the place she went.
6. Money she spent on the way (transport, food, ...).
7. The total cash she brought home and the total M-Pesa she received that day.
8. New orders for tomorrow or later: who, what, which day.
At the end, give a short summary (bottles sold, money, pay later, new orders), set "done" to true, and tell her to tap "Check and save" below the chat. If she adds or changes something after that, update the draft and summary again.

Rules:
- Use only the product ids, sizes (ml), place ids, order ids and customer ids in the data. If she names a size or product that isn't there, or it's unclear ("10 soap" - which size?), ask. Never guess numbers.
- When she gives numbers, repeat them back briefly so she can correct you.
- Return the full draft every time, keeping everything from before. Leave lists empty and cash/mpesa null when not known yet.
- "credit" and "newOrders" names may be new people; spell them as she does, or as in the customer list if it is clearly the same person.
- Dates are YYYY-MM-DD. "Tomorrow" means the day after the day being recorded. If she says a weekday, use the next one.
- Never say the records are saved: she saves them herself after checking.
- If she asks something off-topic, answer in one line and come back to the questions.

The business right now:
${JSON.stringify(context)}

Answer with one JSON object only, in this shape:
${SCHEMA}`;
}

type GroqResult = { ok: true; content: string } | { ok: false; status: number; retryAfter?: number; error: string };

async function callGroq(key: string, model: string, messages: { role: string; content: string }[]): Promise<GroqResult> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_completion_tokens: 1500,
      response_format: { type: "json_object" },
      ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
    }),
    signal: AbortSignal.timeout(45_000),
  }).catch((e: unknown) => ({ ok: false, status: 0, error: String(e) }) as const);
  if (!(res instanceof Response)) return { ok: false, status: 0, error: res.error };
  if (!res.ok) {
    const retry = Number(res.headers.get("retry-after"));
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, retryAfter: Number.isFinite(retry) ? retry : undefined, error: text.slice(0, 300) };
  }
  const j = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
  const content = j?.choices?.[0]?.message?.content;
  if (!content) return { ok: false, status: 502, error: "empty answer" };
  return { ok: true, content };
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Bad origin" }, 403);
  const me = await currentUser();
  if (!me) return json({ error: "login" }, 401);
  if (!me.roles.some((r) => r === "boss" || r === "helper")) return json({ error: "Not allowed." }, 403);
  if (!(await rateLimit("chat", me.id))) return json({ error: "Too many messages. Wait a few minutes." }, 429);

  const key = process.env.GROQ_API_KEY;
  if (!key) return json({ error: "The chat isn't set up yet (no AI key). Use the questions instead." }, 503);

  const raw = await req.text();
  if (raw.length > 60_000) return json({ error: "Too long. Start a new chat." }, 413);
  const parsed = body.safeParse((() => { try { return JSON.parse(raw); } catch { return null; } })());
  if (!parsed.success) return json({ error: "Bad data" }, 400);
  const { messages, context, draft } = parsed.data;

  const convo = [
    { role: "system", content: systemPrompt(me.name, context) },
    // The latest draft goes in as a note, so older turns can be dropped without losing answers.
    ...(draft ? [{ role: "system", content: "Draft so far: " + JSON.stringify(draft) }] : []),
    ...messages.slice(-16),
  ];

  let last: GroqResult | null = null;
  for (const model of MODELS) {
    const r = await callGroq(key, model, convo);
    if (r.ok) {
      try {
        const out = JSON.parse(r.content) as { reply?: unknown; done?: unknown; draft?: unknown };
        if (typeof out.reply !== "string" || !out.reply.trim()) throw new Error("no reply");
        return json({ reply: out.reply.slice(0, 3000), done: out.done === true, draft: out.draft && typeof out.draft === "object" ? out.draft : null });
      } catch {
        last = { ok: false, status: 502, error: "bad json" };
        continue;
      }
    }
    last = r;
    // Busy or over the limit: try the next model. A bad key won't work for any model.
    if (r.status === 401 || r.status === 403) break;
  }
  if (last && !last.ok) {
    console.error("Groq chat failed", last.status, last.error);
    if (last.status === 429) return json({ error: "The AI is busy. Wait a minute and send again.", retryAfter: last.retryAfter ?? 30 }, 429);
    if (last.status === 401 || last.status === 403) return json({ error: "The AI key isn't working. Ask for it to be checked." }, 503);
  }
  return json({ error: "The AI didn't answer properly. Send your message again." }, 502);
}
