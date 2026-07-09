import express from "express";
import { transactions } from "../data/mockTransactions.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(transactions);
});

router.post("/", (req, res) => {
  const newTransaction = {
    id: transactions.length + 1,
    ...req.body,
  };

  transactions.push(newTransaction);
  res.status(201).json(newTransaction);
});

export default router;