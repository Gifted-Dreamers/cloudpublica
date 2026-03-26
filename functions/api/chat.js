// functions/api/chat.js
// CloudPublica Crisis Navigator — CF Pages Function
// AWS Bedrock Claude Sonnet + KV sessions + The Word vocabulary

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

Your FIRST response to any new person MUST be a question, not resources. Listen before you help. Ask what's going on. Don't jump to solutions.

Ask whether they need to be heard or need a plan: "Do you want to talk through what's happening, or do you need something specific right now?" If they don't know, help them figure it out.

Match their urgency. Immediate crisis = resources immediately. But most people need to be heard first. Do not list resources unless asked or unless a safety gate triggers.

Keep responses SHORT — 2-4 sentences. One question at a time. Never ask multiple questions in the same message.

## WHAT YOU CAN GIVE PEOPLE (when they ask or when appropriate)

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

// --- AWS Signature V4 for Bedrock ---

async function hmacSha256(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

async function sha256(message) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(key, dateStamp, region, service) {
  let kDate = await hmacSha256(new TextEncoder().encode("AWS4" + key), dateStamp);
  let kRegion = await hmacSha256(kDate, region);
  let kService = await hmacSha256(kRegion, service);
  let kSigning = await hmacSha256(kService, "aws4_request");
  return kSigning;
}

async function signRequest(method, url, headers, body, accessKey, secretKey, region, service) {
  const parsedUrl = new URL(url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256(body);

  const canonicalHeaders = Object.keys(headers).sort().map(k => k.toLowerCase() + ":" + headers[k].trim() + "\n").join("");
  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(";");

  const canonicalRequest = [
    method,
    parsedUrl.pathname,
    parsedUrl.search ? parsedUrl.search.slice(1) : "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { authorization: authHeader, "x-amz-date": amzDate, "x-amz-content-sha256": payloadHash };
}

// --- Vocabulary search ---

function searchVocabulary(words, query) {
  const queryTokens = query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 3);
  if (queryTokens.length === 0) return [];
  const scored = words.map(entry => {
    const text = [entry.name, entry.definition, entry.felt_sense, entry.domain].filter(Boolean).join(" ").toLowerCase();
    let score = 0;
    for (const token of queryTokens) { if (text.includes(token)) score++; }
    return { entry, score };
  });
  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(s => s.entry);
}

// --- Main handler ---

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

    let history = [];
    try {
      const stored = await env.CHAT_SESSIONS.get(sid, "json");
      if (stored && Array.isArray(stored)) history = stored;
    } catch {}

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
    } catch {}

    // Build Bedrock request
    const region = env.AWS_REGION || "us-east-1";
    const modelId = "us.anthropic.claude-sonnet-4-20250514";
    const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;

    const bedrockBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 512,
      system: SYSTEM_PROMPT + vocabContext,
      messages: history,
    });

    const reqHeaders = {
      "content-type": "application/json",
      "host": `bedrock-runtime.${region}.amazonaws.com`,
      "accept": "application/json",
    };

    const sigHeaders = await signRequest(
      "POST", bedrockUrl, reqHeaders, bedrockBody,
      env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY, region, "bedrock"
    );

    const bedrockResp = await fetch(bedrockUrl, {
      method: "POST",
      headers: { ...reqHeaders, ...sigHeaders },
      body: bedrockBody,
    });

    if (!bedrockResp.ok) {
      const errText = await bedrockResp.text();
      console.error("Bedrock error:", bedrockResp.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bedrockData = await bedrockResp.json();
    const assistantMessage = bedrockData.content?.[0]?.text || "I'm having trouble responding right now. If you're in crisis, please call 988.";

    // Save to history
    history.push({ role: "assistant", content: assistantMessage });
    context.waitUntil(
      env.CHAT_SESSIONS.put(sid, JSON.stringify(history), { expirationTtl: SESSION_TTL })
    );

    // Return as SSE-like format for compatibility with existing client
    // (single data event with full response)
    const sseResponse = `data: ${JSON.stringify({ response: assistantMessage })}\n\ndata: [DONE]\n\n`;

    return new Response(sseResponse, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Session-Id": sid,
      },
    });
  } catch (err) {
    console.error("Handler error:", err);
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
