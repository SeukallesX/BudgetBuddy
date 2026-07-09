import express from "express";
import OpenAI from "openai";
import { transactions } from "../data/mockTransactions.js";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/insight", async (req, res) => {
  try {
    const { question } = req.body;

    const transactionSummary = transactions
      .map(
        (t) =>
          `${t.date} | ${t.title} | ${t.category} | ${t.type} | $${t.amount}`
      )
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are BudgetBuddy, a friendly AI financial assistant. Analyze spending, income, savings, and budgeting patterns. Keep answers practical and beginner-friendly.",
        },
        {
          role: "user",
          content: `Transactions:\n${transactionSummary}\n\nQuestion: ${question}`,
        },
      ],
    });

    const insight = response.choices?.[0]?.message?.content ?? "No insight available.";

    res.json({
      insight,
    });
  } catch (error) {
    res.status(500).json({
      message: "AI insight failed",
    });
  }
});

export default router;