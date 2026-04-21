import { Router } from "express";
import OpenAI from "openai";

const router = Router();

router.post("/receipt/scan", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 required" });
    return;
  }

  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

  if (!baseUrl || !apiKey) {
    res.status(500).json({ error: "AI integration not configured" });
    return;
  }

  const openai = new OpenAI({ baseURL: baseUrl, apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this receipt image and return ONLY a JSON object — no markdown, no explanation — with these fields:
{
  "merchant": "<store or restaurant name>",
  "items": [
    { "name": "<item name>", "amount": <price as number> }
  ]
}
Include each line item and tax if shown. Do NOT include subtotal or total as items. Return raw JSON only.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    let raw = completion.choices[0]?.message?.content ?? "{}";
    raw = raw.replace(/^```(?:json)?\s*|\s*```$/gs, "").trim();

    const parsed = JSON.parse(raw) as {
      merchant?: string;
      items?: Array<{ name: string; amount: number }>;
    };

    const items = (parsed.items ?? []).map((item, idx) => ({
      id: `s${idx + 1}`,
      name: item.name,
      amount: typeof item.amount === "number" ? item.amount : parseFloat(String(item.amount)) || 0,
      selected: true,
    }));

    res.json({
      merchant: parsed.merchant ?? "Unknown Merchant",
      items,
    });
  } catch (err) {
    console.error("[receipt-scan] error:", err);
    res.status(500).json({ error: "Failed to analyze receipt" });
  }
});

export default router;
