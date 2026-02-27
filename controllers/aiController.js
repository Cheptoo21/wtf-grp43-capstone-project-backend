import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; 


const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; 

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = user; 
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token verification failed" });
  }
};


export const extractTransaction = [
  verifyToken, 
  async (req, res) => {
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

      const candidate = response.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ success: false, message: "No AI response" });
    }

    const rawText = candidate.content.parts[0]?.text;
    const cleaned = rawText.replace(/```json|```/gi, "").trim();


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
