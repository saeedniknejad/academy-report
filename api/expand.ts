// ---------------------------------------------------------------------------
// Vercel serverless function: POST /api/expand
//
// Turns a coach's short observation into a parent-friendly note + drills using
// Google Gemini. The model API key lives ONLY in this function's server-side
// env (GEMINI_API_KEY) and never reaches the browser.
//
// Request body:  { observation, playerName?, ageGroup?, position? }
// Response JSON:  { parentNote, tryAtHome, coachDrill }
//
// If GEMINI_API_KEY is not set, this returns 501 and the app falls back to its
// built-in local mock (see src/lib/ai.ts), so the app keeps working.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a youth soccer development report writer. Convert the coach's shorthand observation into:
1. A 2-3 sentence parent-friendly paragraph that explains the observation, contextualizes it as normal for the age group (U10-U12), and maintains an encouraging tone. Never compare to other players.
2. A "Try at home" drill suggestion (specific exercise, duration, frequency).
3. A "Suggested training drill" for the coach (more technical, with sets/reps/conditions).

Rules:
- Lead with what the player IS doing well related to this area
- Frame the growth area as "next challenge" not a weakness
- Use simple language (no tactical jargon for parents)
- Keep the parent version to 2-3 sentences max
- Make the drill actionable and fun for the age group

Return ONLY strict minified JSON with exactly these keys: {"parentNote": string, "tryAtHome": string, "coachDrill": string}`;

// Minimal Vercel handler signature (no @vercel/node types needed).
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(501).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    const { observation, playerName, ageGroup, position } = req.body ?? {};
    if (!observation || typeof observation !== "string") {
      res.status(400).json({ error: "Missing 'observation'." });
      return;
    }

    const userPrompt = [
      `Coach observation: "${observation}"`,
      playerName ? `Player: ${playerName}` : "",
      ageGroup ? `Age group: ${ageGroup}` : "",
      position ? `Position: ${position}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const model = "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error("Gemini error:", detail);
      res.status(502).json({ error: "AI provider error" });
      return;
    }

    const data = await geminiRes.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text);

    res.status(200).json({
      parentNote: String(parsed.parentNote ?? ""),
      tryAtHome: String(parsed.tryAtHome ?? ""),
      coachDrill: String(parsed.coachDrill ?? ""),
    });
  } catch (err) {
    console.error("expand handler failed:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
