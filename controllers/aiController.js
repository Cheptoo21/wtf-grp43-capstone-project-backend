// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // POST /api/ai/extract
// export const extractTransaction = async (req, res) => {
//   try {
//     const { transcript } = req.body;

//     if (!transcript) {
//       return res.status(400).json({
//         success: false,
//         message: "Transcript is required",
//       });
//     }

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini", // cheap + good
//       messages: [
//         {
//           role: "system",
//           content: `You are a transaction parser for a small-business bookkeeping app.
// Extract fields and respond ONLY with raw JSON.

// JSON shape:
// {
//   "transactionType": "sale" | "expense",
//   "item": string,
//   "amount": number,
//   "currency": "NGN"
// }

// - transactionType: "sale" if user sold something, "expense" if they bought.
// - item: Title-cased product name.
// - amount: positive number only.
// - currency: default "NGN".
// - If missing required field, return {"error":"reason"}.`
//         },
//         {
//           role: "user",
//           content: transcript,
//         },
//       ],
//       temperature: 0,
//     });

//     const raw = completion.choices[0].message.content;

//     console.log(raw);

//     let parsed;
//     try {
//       parsed = JSON.parse(raw);
//     } catch {
//       return res.status(500).json({
//         success: false,
//         message: "AI response not valid JSON",
//       });
//     }

//     if (parsed.error) {
//       return res.status(400).json({
//         success: false,
//         message: parsed.error,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: parsed,
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

import { GoogleGenAI } from "@google/genai";

/**
 * POST /api/ai/extract
 * Takes a transcript and uses Gemini to return structured JSON.
 */
export const extractTransaction = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res
        .status(400)
        .json({ success: false, message: "Transcript is required" });
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Call the Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        `Extract the following fields as JSON from this text:\n\n${transcript}\n\n
         JSON shape:
         {
           "transactionType": "sale" | "expense",
           "item": string,
           "amount": number,
           "currency": "NGN"
         }
         Output only valid JSON with those keys.`,
      ],
    });

    const rawText = response.text;
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: "AI did not return valid JSON",
        raw: rawText,
      });
    }

    res.status(200).json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};