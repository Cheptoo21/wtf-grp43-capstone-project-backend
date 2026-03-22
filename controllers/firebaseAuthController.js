import jwt from "jsonwebtoken";
import admin from "./../config/firebase.js";
import User from "../models/User.js";

export const firebaseAuth = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const email = decoded.email;
    const name = decoded.name || "";

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    res.status(401).json({
      message: "Invalid Firebase token",
      errorMessage: err.message,   
      errorCode: err.code,         
      projectId: process.env.FIREBASE_PROJECT_ID ?? "NOT SET",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "NOT SET",
      privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.slice(0, 40) ?? "NOT SET",
    });
  }
};