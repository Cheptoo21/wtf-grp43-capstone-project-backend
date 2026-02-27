import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // make sure you have a User model

/**
 * Middleware-style token verification
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader); // Debugging line

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // remove "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token verification failed" });
  }
};

/**
 * POST /api/ai/extract
 * Takes a transcript and returns structured JSON using Gemini
 */
export const extractTransaction = [
  verifyToken, // first verify token
  async (req, res) => {
    try {
      const { transcript } = req.body;
      console.log("Transcript:", transcript); // Debugging line

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

      console.log("AI Response:", response); // Debugging line

      const candidate = response.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ success: false, message: "No AI response" });
    }

    // Gemini returns content as array of objects; find the text type
    const rawText = candidate.content.parts[0]?.text;
    const cleaned = rawText.replace(/```json|```/gi, "").trim();

    console.log("AI Response Text:", cleaned); //

      // const rawText = response.text;

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
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
  },
];
