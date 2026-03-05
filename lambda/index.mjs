import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a FriedmanFit nutrition coach AI. Your job is to generate meal combinations that hit a client's remaining macro targets as closely as possible.

Rules:
- Generate exactly 3 different meal combo options
- Each option contains the number of meals specified (labeled M1, M2, etc. based on how many remain)
- Show exact food amounts in oz and grams (e.g. "6 oz NY Strip (170g)")
- Show macro breakdown per food item AND per meal AND grand totals
- Try to get within ~5g of each macro target across the full combo
- Be coach-level precise — no fluff, just numbers and food

Return ONLY valid JSON with this exact structure, no markdown, no explanation:
{
  "combos": [
    {
      "label": "Option A – High Protein Focus",
      "meals": [
        {
          "name": "M3",
          "foods": [
            { "item": "NY Strip Steak", "amount": "6 oz (170g)", "p": 42, "c": 0, "f": 10 }
          ],
          "totals": { "p": 42, "c": 0, "f": 10 }
        }
      ],
      "grandTotals": { "p": 62, "c": 75, "f": 17 }
    }
  ]
}`;

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: "",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { remaining, mealCount, foods } = body;

    if (!remaining || !mealCount || !foods) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Missing required fields: remaining, mealCount, foods" }),
      };
    }

    const userPrompt = `Remaining macros to hit:
- Protein: ${remaining.protein}g
- Carbs: ${remaining.carbs}g
- Fat: ${remaining.fat}g

Number of meals to split into: ${mealCount}

Available foods:
${foods}

Generate 3 meal combo options hitting these remaining macros.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim()
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(text);

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    console.error("Lambda error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}
