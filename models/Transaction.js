import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rawText: {
      type: String, // The original voice/text input from the user
    },
    transactionType: {
      type: String,
      enum: ['sale', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    item: {
      type: String,
      required: [true, 'Item is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    currency: {
      type: String,
      default: 'NGN', // Nigeria Naira — adjust per user country
    },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);