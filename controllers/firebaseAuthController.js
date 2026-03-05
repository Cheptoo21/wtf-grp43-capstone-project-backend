import jwt from "jsonwebtoken";
import admin from "./../config/firebase.js";
import User from "../models/User.js";

export const firebaseAuth = async (req, res) => {
    try {
        console.log("Received Firebase token:", req.body.firebaseToken); 
    const { firebaseToken } = req.body;

    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    const email = decoded.email;
    const name = decoded.name || "";

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, name });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: "Invalid Firebase token" });
  }
};