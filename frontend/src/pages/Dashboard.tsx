import { useEffect, useMemo, useState } from "react";

import AddTransactionModal, {
  type EditableTransaction,
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
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Transaction = EditableTransaction;

type ChartPeriod = 3 | 6 | 12;

type SpendingChartItem = {
  month: string;
  fullMonth: string;
  expenses: number;
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
  {
    id: 4,
    name: "Streaming subscription",
    category: "Entertainment",
    date: "2026-06-18",
    amount: 18,
    type: "expense",
  },
  {
    id: 5,
    name: "Electric bill",
    category: "Utilities",
    date: "2026-05-12",
    amount: 124,
    type: "expense",
  },
  {
    id: 6,
    name: "Restaurant",
    category: "Food",
    date: "2026-04-22",
    amount: 67,
    type: "expense",
  },
  {
    id: 7,
    name: "School supplies",
    category: "Education",
    date: "2026-03-10",
    amount: 92,
    type: "expense",
  },
  {
    id: 8,
    name: "Phone bill",
    category: "Utilities",
    date: "2026-02-08",
    amount: 75,
    type: "expense",
  },
];

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatCompactCurrency(amount: number) {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }

  return `$${amount}`;
}

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseTransactionDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function isValidTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const transaction = value as Partial<Transaction>;

  return (
    typeof transaction.id === "number" &&
    typeof transaction.name === "string" &&
    typeof transaction.category === "string" &&
    typeof transaction.date === "string" &&
    typeof transaction.amount === "number" &&
    Number.isFinite(transaction.amount) &&
    transaction.amount > 0 &&
    (transaction.type === "income" ||
      transaction.type === "expense")
  );
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem(
        TRANSACTIONS_STORAGE_KEY,
      );

      if (!savedTransactions) {
        return initialTransactions;
      }

      const parsedTransactions: unknown = JSON.parse(savedTransactions);

      if (!Array.isArray(parsedTransactions)) {
        return initialTransactions;
      }

      return parsedTransactions.filter(isValidTransaction);
    } catch {
      return initialTransactions;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [chartPeriod, setChartPeriod] =
    useState<ChartPeriod>(6);

  useEffect(() => {
    localStorage.setItem(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify(transactions),
    );
  }, [transactions]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + transaction.amount,
        0,
      );

    const expenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + transaction.amount,
        0,
      );

    return {
      income,
      expenses,
      balance: income - expenses,
      savings: Math.max(income - expenses, 0),
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const formattedAmount = formatCurrency(
        transaction.amount,
      ).toLowerCase();

      return (
        transaction.name.toLowerCase().includes(normalizedSearch) ||
        transaction.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        transaction.type.toLowerCase().includes(normalizedSearch) ||
        transaction.date.includes(normalizedSearch) ||
        transaction.amount
          .toString()
          .includes(normalizedSearch) ||
        formattedAmount.includes(normalizedSearch)
      );
    });
  }, [searchTerm, transactions]);

  const spendingChartData = useMemo<SpendingChartItem[]>(() => {
    const today = new Date();

    const monthEntries = Array.from(
      { length: chartPeriod },
      (_, index) => {
        const monthsBack = chartPeriod - 1 - index;

        const date = new Date(
          today.getFullYear(),
          today.getMonth() - monthsBack,
          1,
        );

        return {
          key: getMonthKey(date),
          month: date.toLocaleDateString("en-US", {
            month: "short",
          }),
          fullMonth: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          expenses: 0,
        };
      },
    );

    const expensesByMonth = transactions.reduce<
      Record<string, number>
    >((monthlyTotals, transaction) => {
      if (transaction.type !== "expense") {
        return monthlyTotals;
      }

      const transactionDate = parseTransactionDate(
        transaction.date,
      );

      if (!transactionDate) {
        return monthlyTotals;
      }

      const monthKey = getMonthKey(transactionDate);

      monthlyTotals[monthKey] =
        (monthlyTotals[monthKey] ?? 0) + transaction.amount;

      return monthlyTotals;
    }, {});

    return monthEntries.map((monthEntry) => ({
      month: monthEntry.month,
      fullMonth: monthEntry.fullMonth,
      expenses: Number(
        (expensesByMonth[monthEntry.key] ?? 0).toFixed(2),
      ),
    }));
  }, [chartPeriod, transactions]);

  const chartExpensesTotal = useMemo(() => {
    return spendingChartData.reduce(
      (total, month) => total + month.expenses,
      0,
    );
  }, [spendingChartData]);

  const highestSpendingMonth = useMemo(() => {
    if (spendingChartData.length === 0) {
      return null;
    }

    return spendingChartData.reduce((highest, current) =>
      current.expenses > highest.expenses ? current : highest,
    );
  }, [spendingChartData]);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddTransaction = (
    newTransaction: NewTransaction,
  ) => {
    const transaction: Transaction = {
      id: Date.now(),
      ...newTransaction,
    };

    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ]);
  };

  const handleUpdateTransaction = (
    updatedTransaction: Transaction,
  ) => {
    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.id === updatedTransaction.id
          ? updatedTransaction
          : transaction,
      ),
    );

    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (transactionId: number) => {
    const transactionToDelete = transactions.find(
      (transaction) => transaction.id === transactionId,
    );

    if (!transactionToDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${transactionToDelete.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setTransactions((currentTransactions) =>
      currentTransactions.filter(
        (transaction) => transaction.id !== transactionId,
      ),
    );

    if (editingTransaction?.id === transactionId) {
      handleCloseModal();
    }
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
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
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
                <span className="card-label">
                  Total balance
                </span>

                <h2>{formatCurrency(totals.balance)}</h2>
              </div>

              <div className="balance-icon">
                <Wallet size={25} />
              </div>
            </div>

            <div className="balance-change">
              <span>
                <TrendingUp size={16} />
                Live
              </span>

              based on recorded transactions
            </div>

            <div className="balance-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleOpenAddModal}
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
              <span className="card-label">
                BudgetBuddy AI
              </span>

              <h2>Your financial snapshot</h2>

              <p>
                Your balance is {formatCurrency(totals.balance)}.
                You have recorded{" "}
                {formatCurrency(totals.expenses)} in expenses and{" "}
                {formatCurrency(totals.income)} in income.
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

              <span className="trend positive">Income</span>
            </div>

            <span className="card-label">Total income</span>
            <h3>{formatCurrency(totals.income)}</h3>
            <p>Income from recorded transactions</p>
          </article>

          <article className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon expense-icon">
                <ArrowDownRight size={20} />
              </div>

              <span className="trend positive">Expenses</span>
            </div>

            <span className="card-label">Total expenses</span>
            <h3>{formatCurrency(totals.expenses)}</h3>
            <p>Expenses from recorded transactions</p>
          </article>

          <article className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon savings-icon">
                <PiggyBank size={20} />
              </div>

              <span className="trend positive">Available</span>
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

            <span className="card-label">
              Financial health
            </span>

            <h3>92 / 100</h3>
            <p>Your finances are currently stable</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel spending-panel">
            <div className="panel-header">
              <div>
                <span className="card-label">
                  Monthly activity
                </span>

                <h2>Spending overview</h2>
              </div>

              <select
                aria-label="Spending period"
                value={chartPeriod}
                onChange={(event) =>
                  setChartPeriod(
                    Number(event.target.value) as ChartPeriod,
                  )
                }
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>

            <div className="chart-summary">
              <div>
                <strong>
                  {formatCurrency(chartExpensesTotal)}
                </strong>

                <span>
                  Expenses over the last {chartPeriod} months
                </span>
              </div>

              {highestSpendingMonth &&
                highestSpendingMonth.expenses > 0 && (
                  <div className="chart-highest-month">
                    <span>Highest month</span>

                    <strong>
                      {highestSpendingMonth.month} ·{" "}
                      {formatCurrency(
                        highestSpendingMonth.expenses,
                      )}
                    </strong>
                  </div>
                )}
            </div>

            <div className="spending-chart-container">
              {chartExpensesTotal === 0 ? (
                <div className="chart-empty-state">
                  <ReceiptText size={28} />

                  <strong>No expenses in this period</strong>

                  <span>
                    Add an expense transaction to populate the
                    chart.
                  </span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={spendingChartData}
                    margin={{
                      top: 12,
                      right: 8,
                      left: -12,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.14)"
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8f96aa",
                        fontSize: 12,
                      }}
                      dy={8}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#8f96aa",
                        fontSize: 11,
                      }}
                      tickFormatter={(value) =>
                        formatCompactCurrency(Number(value))
                      }
                      width={58}
                    />

                    <Tooltip
                      cursor={{
                        fill: "rgba(111, 95, 255, 0.06)",
                      }}
                      contentStyle={{
                        border:
                          "1px solid rgba(148, 163, 184, 0.16)",
                        borderRadius: "12px",
                        background: "#171923",
                        boxShadow:
                          "0 14px 32px rgba(0, 0, 0, 0.28)",
                      }}
                      labelStyle={{
                        color: "#ffffff",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                      itemStyle={{
                        color: "#a99eff",
                      }}
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]
                          ?.payload as SpendingChartItem | undefined;

                        return item?.fullMonth ?? "";
                      }}
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "Expenses",
                      ]}
                    />

                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#7567ff"
                      radius={[9, 9, 3, 3]}
                      maxBarSize={54}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

          <article
            className="panel goal-panel"
            id="goals"
          >
            <div className="panel-header">
              <div>
                <span className="card-label">
                  Savings goal
                </span>

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

            <button
              type="button"
              className="ghost-button full-width"
            >
              Manage goal
            </button>
          </article>

          <article
            className="panel transactions-panel"
            id="transactions"
          >
            <div className="panel-header">
              <div>
                <span className="card-label">
                  Latest activity
                </span>

                <h2>Recent transactions</h2>
              </div>

              <span className="transaction-count">
                {filteredTransactions.length} found
              </span>
            </div>

            <div className="transaction-list">
              {filteredTransactions.length === 0 ? (
                <p className="empty-state">
                  {searchTerm
                    ? `No transactions found for "${searchTerm}".`
                    : "No transactions yet."}
                </p>
              ) : (
                filteredTransactions
                  .slice(0, 5)
                  .map((transaction) => (
                    <div
                      className="transaction-row"
                      key={transaction.id}
                    >
                      <div className="transaction-icon">
                        {transaction.type === "income" ? (
                          <CircleDollarSign size={20} />
                        ) : (
                          <ReceiptText size={20} />
                        )}
                      </div>

                      <div className="transaction-info">
                        <strong>
                          {transaction.name}
                        </strong>

                        <span>
                          {transaction.category} ·{" "}
                          {formatDate(transaction.date)}
                        </span>
                      </div>

                      <div className="transaction-actions">
                        <strong
                          className={
                            transaction.type === "income"
                              ? "transaction-amount income"
                              : "transaction-amount expense"
                          }
                        >
                          {transaction.type === "income"
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            transaction.amount,
                          )}
                        </strong>

                        <button
                          type="button"
                          className="transaction-edit-button"
                          aria-label={`Edit ${transaction.name}`}
                          title="Edit transaction"
                          onClick={() =>
                            handleOpenEditModal(transaction)
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="transaction-delete-button"
                          aria-label={`Delete ${transaction.name}`}
                          title="Delete transaction"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction.id,
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="panel budget-panel">
            <div className="panel-header">
              <div>
                <span className="card-label">
                  Budget status
                </span>

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
        transactionToEdit={editingTransaction}
        onClose={handleCloseModal}
        onAdd={handleAddTransaction}
        onUpdate={handleUpdateTransaction}
      />
    </div>
  );
}