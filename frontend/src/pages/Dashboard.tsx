import { useEffect, useMemo, useState } from "react";

import AddTransactionModal, {
  type NewTransaction,
} from "../components/AddTransactionModal";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bot,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

type Transaction = NewTransaction & {
  id: number;
};

const TRANSACTIONS_STORAGE_KEY = "budgetbuddy-transactions";

const initialTransactions: Transaction[] = [
  {
    id: 1,
    name: "Part-time income",
    category: "Income",
    date: "2026-07-01",
    amount: 650,
    type: "income",
  },
  {
    id: 2,
    name: "Groceries",
    category: "Food",
    date: "2026-07-02",
    amount: 86,
    type: "expense",
  },
  {
    id: 3,
    name: "Gas",
    category: "Transportation",
    date: "2026-07-03",
    amount: 55,
    type: "expense",
  },
];

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem(
        TRANSACTIONS_STORAGE_KEY
      );

      if (!savedTransactions) {
        return initialTransactions;
      }

      return JSON.parse(savedTransactions) as Transaction[];
    } catch {
      return initialTransactions;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      savings: Math.max(income - expenses, 0),
    };
  }, [transactions]);

  const handleAddTransaction = (newTransaction: NewTransaction) => {
    const transaction: Transaction = {
      id: Date.now(),
      ...newTransaction,
    };

    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ]);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>

          <div>
            <strong>BudgetBuddy</strong>
            <span>Smart Wallet</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#dashboard">
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a className="nav-item" href="#wallet">
            <CreditCard size={19} />
            Wallet
          </a>

          <a className="nav-item" href="#transactions">
            <ReceiptText size={19} />
            Transactions
          </a>

          <a className="nav-item" href="#goals">
            <Target size={19} />
            Savings Goals
          </a>

          <a className="nav-item" href="#advisor">
            <Bot size={19} />
            AI Advisor
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a className="nav-item" href="#settings">
            <Settings size={19} />
            Settings
          </a>

          <div className="security-card">
            <ShieldCheck size={22} />

            <div>
              <strong>Wallet protected</strong>
              <span>Security score: 92%</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu"
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="page-heading">
            <p>Welcome back</p>
            <h1>Financial Overview</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search transactions"
                aria-label="Search transactions"
              />
            </label>

            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <button type="button" className="wallet-button">
              <span className="wallet-status" />
              0xA91...3Fd2
            </button>
          </div>
        </header>

        <section className="balance-section" id="dashboard">
          <div className="balance-card">
            <div className="balance-card-header">
              <div>
                <span className="card-label">Total balance</span>
                <h2>{formatCurrency(totals.balance)}</h2>
              </div>

              <div className="balance-icon">
                <Wallet size={25} />
              </div>
            </div>

            <div className="balance-change">
              <span>
                <TrendingUp size={16} />
                8.4%
              </span>
              from last month
            </div>

            <div className="balance-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={18} />
                Add transaction
              </button>

              <button type="button" className="ghost-button">
                View wallet
              </button>
            </div>
          </div>

          <div className="ai-highlight" id="advisor">
            <div className="ai-orb">
              <Sparkles size={28} />
            </div>

            <div className="ai-highlight-copy">
              <span className="card-label">BudgetBuddy AI</span>

              <h2>Your spending is looking healthy</h2>

              <p>
                You spent less this week and remain on track to reach your
                monthly savings target.
              </p>

              <button type="button" className="text-button">
                View full insight
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon income-icon">
                <ArrowUpRight size={20} />
              </div>

              <span className="trend positive">+6.2%</span>
            </div>

            <span className="card-label">Monthly income</span>
            <h3>{formatCurrency(totals.income)}</h3>
            <p>Income from recorded transactions</p>
          </article>

          <article className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon expense-icon">
                <ArrowDownRight size={20} />
              </div>

              <span className="trend positive">-4.1%</span>
            </div>

            <span className="card-label">Monthly expenses</span>
            <h3>{formatCurrency(totals.expenses)}</h3>
            <p>Expenses from recorded transactions</p>
          </article>

          <article className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon savings-icon">
                <PiggyBank size={20} />
              </div>

              <span className="trend positive">+14.8%</span>
            </div>

            <span className="card-label">Total savings</span>
            <h3>{formatCurrency(totals.savings)}</h3>
            <p>Current income minus expenses</p>
          </article>

          <article className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon health-icon">
                <ShieldCheck size={20} />
              </div>

              <span className="trend positive">Excellent</span>
            </div>

            <span className="card-label">Financial health</span>
            <h3>92 / 100</h3>
            <p>Your score increased by 3 points</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel spending-panel">
            <div className="panel-header">
              <div>
                <span className="card-label">Monthly activity</span>
                <h2>Spending overview</h2>
              </div>

              <select aria-label="Spending period" defaultValue="6-months">
                <option value="6-months">Last 6 months</option>
                <option value="3-months">Last 3 months</option>
                <option value="12-months">Last 12 months</option>
              </select>
            </div>

            <div className="chart-placeholder">
              <div className="chart-summary">
                <strong>{formatCurrency(totals.expenses)}</strong>
                <span>Total recorded expenses</span>
              </div>

              <div className="chart-bars" aria-label="Mock spending chart">
                <div className="chart-column">
                  <span style={{ height: "48%" }} />
                  <small>Feb</small>
                </div>

                <div className="chart-column">
                  <span style={{ height: "68%" }} />
                  <small>Mar</small>
                </div>

                <div className="chart-column">
                  <span style={{ height: "56%" }} />
                  <small>Apr</small>
                </div>

                <div className="chart-column">
                  <span style={{ height: "80%" }} />
                  <small>May</small>
                </div>

                <div className="chart-column">
                  <span style={{ height: "72%" }} />
                  <small>Jun</small>
                </div>

                <div className="chart-column active">
                  <span style={{ height: "62%" }} />
                  <small>Jul</small>
                </div>
              </div>
            </div>
          </article>

          <article className="panel goal-panel" id="goals">
            <div className="panel-header">
              <div>
                <span className="card-label">Savings goal</span>
                <h2>Emergency fund</h2>
              </div>

              <Target size={21} />
            </div>

            <div className="goal-progress">
              <div className="goal-ring">
                <span>69%</span>
              </div>

              <div className="goal-details">
                <strong>$2,760</strong>
                <span>saved of $4,000</span>
              </div>
            </div>

            <div className="progress-track">
              <span />
            </div>

            <div className="goal-footer">
              <span>$1,240 remaining</span>
              <span>Target: Dec 2026</span>
            </div>

            <button type="button" className="ghost-button full-width">
              Manage goal
            </button>
          </article>

          <article className="panel transactions-panel" id="transactions">
            <div className="panel-header">
              <div>
                <span className="card-label">Latest activity</span>
                <h2>Recent transactions</h2>
              </div>

              <button type="button" className="text-button">
                View all
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="transaction-list">
              {transactions.length === 0 ? (
                <p className="empty-state">No transactions yet.</p>
              ) : (
                transactions.slice(0, 5).map((transaction) => (
                  <div className="transaction-row" key={transaction.id}>
                    <div className="transaction-icon">
                      {transaction.type === "income" ? (
                        <CircleDollarSign size={20} />
                      ) : (
                        <ReceiptText size={20} />
                      )}
                    </div>

                    <div className="transaction-info">
                      <strong>{transaction.name}</strong>

                      <span>
                        {transaction.category} · {formatDate(transaction.date)}
                      </span>
                    </div>

                    <strong
                      className={
                        transaction.type === "income"
                          ? "transaction-amount income"
                          : "transaction-amount expense"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="panel budget-panel">
            <div className="panel-header">
              <div>
                <span className="card-label">Budget status</span>
                <h2>Top categories</h2>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Budget options"
              >
                <Menu size={18} />
              </button>
            </div>

            <div className="budget-category">
              <div className="category-heading">
                <span>Food and dining</span>
                <strong>$410 / $550</strong>
              </div>

              <div className="progress-track">
                <span style={{ width: "75%" }} />
              </div>
            </div>

            <div className="budget-category">
              <div className="category-heading">
                <span>Transportation</span>
                <strong>$260 / $400</strong>
              </div>

              <div className="progress-track">
                <span style={{ width: "65%" }} />
              </div>
            </div>

            <div className="budget-category">
              <div className="category-heading">
                <span>Entertainment</span>
                <strong>$145 / $300</strong>
              </div>

              <div className="progress-track">
                <span style={{ width: "48%" }} />
              </div>
            </div>
          </article>
        </section>
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
}