import type { Transaction } from "../types/transaction.js";

export const transactions: Transaction[] = [
  {
    id: 1,
    title: "Part-time income",
    amount: 650,
    category: "Income",
    type: "income",
    date: "2026-07-01",
  },
  {
    id: 2,
    title: "Groceries",
    amount: 86,
    category: "Food",
    type: "expense",
    date: "2026-07-02",
  },
  {
    id: 3,
    title: "Gas",
    amount: 55,
    category: "Transportation",
    type: "expense",
    date: "2026-07-03",
  },
];