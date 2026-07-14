import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Brain,
  ShieldCheck,
} from "lucide-react";

export default function Dashboard() {
  return (
    <main className="dashboard">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SMART WALLET DECENTRALIZED</p>

          <h1>BudgetBuddy</h1>

          <p className="subtitle">
            Track spending, manage savings, and get AI-powered financial
            insights from one secure smart wallet dashboard.
          </p>

          <div className="hero-actions">
            <button type="button">Open Dashboard</button>

            <button type="button" className="secondary">
              Ask AI Advisor
            </button>
          </div>
        </div>

        <div className="wallet-card">
          <div className="wallet-top">
            <Wallet size={22} />
            <span>Smart Wallet</span>
          </div>

          <h2>$4,720.00</h2>
          <p>Total Balance</p>

          <div className="wallet-address">0xA91...3Fd2</div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <TrendingUp size={22} />
          <p>Income</p>
          <h3>$2,850</h3>
        </article>

        <article className="stat-card">
          <TrendingDown size={22} />
          <p>Expenses</p>
          <h3>$1,420</h3>
        </article>

        <article className="stat-card">
          <PiggyBank size={22} />
          <p>Savings</p>
          <h3>$980</h3>
        </article>

        <article className="stat-card">
          <ShieldCheck size={22} />
          <p>Wallet Health</p>
          <h3>92%</h3>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Recent Transactions</h2>

          <div className="transaction">
            <div>
              <strong>Groceries</strong>
              <span>Food</span>
            </div>

            <strong className="negative">-$86</strong>
          </div>

          <div className="transaction">
            <div>
              <strong>Part-time Income</strong>
              <span>Income</span>
            </div>

            <strong className="positive">+$650</strong>
          </div>

          <div className="transaction">
            <div>
              <strong>Gas</strong>
              <span>Transportation</span>
            </div>

            <strong className="negative">-$55</strong>
          </div>
        </article>

        <article className="panel ai-panel">
          <Brain size={30} />

          <h2>AI Advisor</h2>

          <p>
            You are spending most in food and transportation. You still have
            room to increase your savings this month.
          </p>

          <button type="button">Ask BudgetBuddy AI</button>
        </article>
      </section>
    </main>
  );
}