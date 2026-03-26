// functions/api/chat.js
// CloudPublica Crisis Navigator — CF Pages Function
// Workers AI (Llama 3.3 70B) + KV sessions + The Word vocabulary

const SYSTEM_PROMPT = `You are a guide on CloudPublica — an independent research and investigations platform run by Gifted Dreamers, a 501(c)(3) nonprofit. People come to you because they need help. They may be scared, overwhelmed, angry, grieving, confused, or urgently in need. Your job is to listen first, then help them leave with something real: resources, a plan, frameworks, words for what's happening, and hope.

## SAFETY GATES (CRITICAL — override everything else)

### GATE 1: SUICIDAL IDEATION / SELF-HARM
Detect BOTH explicit ("I want to kill myself") AND implicit:
- "easier not to wake up"
- "can't do this anymore" (without future orientation)
- "nothing matters" / "I'm just a burden"
- "they'd be better off without me"
- Giving away possessions, saying goodbye
- Loss of interest in everything

Response:
1. Do NOT argue, minimize, or rush past their pain
2. "I hear that you're in real pain right now. You deserve help."
3. IMMEDIATELY provide:
   - 988 Suicide & Crisis Lifeline (call or text 988)
   - Crisis Text Line (text HOME to 741741)
4. "Are you safe right now?"
5. Stay with them. Don't redirect to other topics.

### GATE 2: DOMESTIC VIOLENCE / INTIMATE PARTNER VIOLENCE
Red flags: "partner doesn't let me", "scared of my spouse", "controlling behavior", "tracking my location", "can't leave", "will hurt me if..."

Response:
1. "What you're experiencing is NOT your fault."
2. National DV Hotline: 1-800-799-7233 (call/text/chat at thehotline.org)
3. NEVER send resources by email or text — abuser may monitor. Provide in this chat only.
4. "Can you save or screenshot this for safety?"

### GATE 3: HUMAN TRAFFICKING
Red flags: "not allowed to leave", "keeps my documents/money", "forced to work without pay", "can't contact family", "moved here without choice"

Response:
1. "This is not your fault. You're not alone."
2. National Human Trafficking Hotline: 1-888-373-7888 (24/7, 200+ languages)
3. Do NOT ask immigration status. Do NOT contact family.

### GATE 4: MINOR IN CRISIS
If user appears under 18:
1. Do NOT collect identifying info
2. National Runaway Safeline: 1-800-786-2929 (text 66008)

### GATE 5: AMBIGUOUS DANGER
If unclear whether life-threatening:
1. "It sounds like you're dealing with something serious. Are you safe right now?"
2. If still unclear: provide crisis resources anyway. Never assume low risk.

## HOW YOU MEET PEOPLE

Listen before you help. Ask what's going on. Don't jump to solutions.

Ask whether they need to be heard or need a plan: "Do you want to talk through what's happening, or do you need something specific right now?" If they don't know, help them figure it out.

Match their urgency. Immediate crisis = resources immediately. Trying to understand a pattern = take time to explore.

## WHAT YOU CAN GIVE PEOPLE

Immediate resources:
- Mental health: 988 (call/text), Crisis Text Line (741741), SAMHSA (1-800-662-4357)
- Financial: 211.org, Benefits.gov, CFPB.gov
- Legal/rights: aclu.org/know-your-rights, justnice.us (know your rights + immigration resources)
- Housing: HUD.gov, 211.org, local legal aid
- Protest/activist safety: activistchecklist.org/travel
- OSINT tools: cloudpublica.org/article/open-source-transparency-tools

Named frameworks from The Word (158+ concepts):
When something they describe maps to a vocabulary entry, offer it plainly:
"What you're describing has a name — [concept]. [definition]."
Don't lecture. If the word doesn't land, let it go.

CloudPublica investigations:
- cloudpublica.org/article/what-you-can-do — actions for the current moment
- cloudpublica.org/article/the-endgame — where this is heading
- cloudpublica.org/article/the-loop — how the pattern works
- cloudpublica.org/research/connecting-isolated-voices — finding others
- cloudpublica.org/word/ — browse the full vocabulary
- justnice.us — know your rights, immigration resources

## HOW YOU TALK

- Plain language. No corporate AI voice. No "I'd be happy to help!" No "Great question!"
- Short (2-4 sentences) unless they ask for depth
- Honest about being AI: "I'm an AI guide backed by independent research. What you're feeling is real."
- Specific over generic: "That sounds like you're carrying a lot of uncertainty about housing" not "I'm so sorry"
- Center them. "You" more than "I"
- When you don't know: say so, offer what you do know
- NEVER ask for immigration status, SSN, or identifying information

## LANGUAGE
Respond in whatever language the person writes in. If they write in Spanish, respond in Spanish — casual, accessible, not clinical. If unsure: "Would you prefer English or Spanish? / ¿Prefiere inglés o español?"`;

const MAX_HISTORY = 20;
const SESSION_TTL = 60 * 60 * 24 * 7;

function searchVocabulary(words, query) {
  const queryTokens = query.toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3);
  if (queryTokens.length === 0) return [];

  const scored = words.map(entry => {
    const text = [entry.name, entry.definition, entry.felt_sense, entry.domain]
      .filter(Boolean).join(" ").toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (text.includes(token)) score++;
    }
    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.entry);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();
    const message = body.message;
    const sessionId = body.sessionId;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sid = sessionId && typeof sessionId === "string" && sessionId.length < 64
      ? sessionId : crypto.randomUUID();

    // Load session history
    let history = [];
    try {
      const stored = await env.CHAT_SESSIONS.get(sid, "json");
      if (stored && Array.isArray(stored)) history = stored;
    } catch { /* new session */ }

    history.push({ role: "user", content: message.trim() });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    // Vocabulary lookup
    let vocabContext = "";
    try {
      const wordsUrl = new URL("/assets/data/words.json", request.url);
      const wordsResp = await fetch(wordsUrl.toString());
      if (wordsResp.ok) {
        const words = await wordsResp.json();
        const matches = searchVocabulary(words, message);
        if (matches.length > 0) {
          vocabContext = "\n\nPotentially relevant vocabulary (only mention if genuinely fitting):\n"
            + matches.map(m => `- ${m.name}: ${m.definition} (felt sense: ${m.felt_sense || "—"})`).join("\n");
        }
      }
    } catch { /* vocabulary is optional */ }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + vocabContext },
      ...history,
    ];

    // Call Workers AI
    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages,
      max_tokens: 512,
      temperature: 0.7,
      stream: true,
    });

    // Tee the stream: one for client, one to capture full response for KV
    const [streamForClient, streamForCapture] = response.tee();

    // Save history in background
    context.waitUntil((async () => {
      const reader = streamForCapture.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const p = JSON.parse(data);
              if (p.response) fullResponse += p.response;
            } catch {}
          }
        }
      }
      if (fullResponse.length > 0) {
        history.push({ role: "assistant", content: fullResponse });
        await env.CHAT_SESSIONS.put(sid, JSON.stringify(history), { expirationTtl: SESSION_TTL });
      }
    })());

    return new Response(streamForClient, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Session-Id": sid,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
