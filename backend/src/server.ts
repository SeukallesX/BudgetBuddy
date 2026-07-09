import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import transactionRoutes from "./routes/transactionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";


dotenv.config();

const app = express();
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BudgetBuddy backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "BudgetBuddy Smart Wallet",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BudgetBuddy backend running on port ${PORT}`);
});