
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AddTransactionModal, {
  type EditableTransaction,
  type NewTransaction,
} from "../components/AddTransactionModal";

import SavingsGoalModal, {
  type SavingsGoal,
  type SavingsGoalInput,
} from "../components/SavingsGoalModal";

import "../styles/holo-2.1-layout.css";

import FinancialForecast from "../components/FinancialForecast";
import "../styles/holo-forecast.css";
import SavingsForecast from "../components/SavingsForecast";

import HoloEffects, {
  TiltCard,
  useHolo,
} from "../components/HoloEffects";

type Transaction = EditableTransaction;
type ContributionType = "deposit" | "withdrawal";
type ChartPeriod = 3 | 6 | 12;
type ChartMode = "both" | "income" | "expenses";
type ViewName =
  | "dashboard"
  | "wallet"
  | "transactions"
  | "goals"
  | "advisor"
  | "settings";

type Contribution = {
  id: string;
  goalId: string;
  amount: number;
  type: ContributionType;
  createdAt: string;
};

type ChartPoint = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
};

const TRANSACTION_KEY = "budgetbuddy-transactions";
const GOAL_KEY = "budgetbuddy-savings-goals";
const CONTRIBUTION_KEY = "budgetbuddy-goal-contributions";

const CATEGORY_BUDGETS: Record<string, number> = {
  Food: 550,
  Transportation: 400,
  Entertainment: 300,
  Housing: 1200,
  Utilities: 350,
  Shopping: 300,
  Healthcare: 250,
  Education: 400,
  Savings: 500,
  Other: 250,
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
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

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function dateLabel(value: string) {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value,
  );

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function dateTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function newId() {
  return crypto.randomUUID();
}

function readSaved<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    const value: unknown = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function validTransactions(
  value: unknown,
): value is Transaction[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;

      const t = item as Partial<Transaction>;

      return (
        typeof t.id === "number" &&
        typeof t.name === "string" &&
        typeof t.category === "string" &&
        typeof t.date === "string" &&
        typeof t.amount === "number" &&
        Number.isFinite(t.amount) &&
        t.amount > 0 &&
        (t.type === "income" || t.type === "expense")
      );
    })
  );
}

function validGoals(value: unknown): value is SavingsGoal[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;

      const g = item as Partial<SavingsGoal>;

      return (
        typeof g.id === "string" &&
        typeof g.name === "string" &&
        typeof g.targetAmount === "number" &&
        Number.isFinite(g.targetAmount) &&
        g.targetAmount > 0 &&
        typeof g.savedAmount === "number" &&
        Number.isFinite(g.savedAmount) &&
        g.savedAmount >= 0 &&
        typeof g.deadline === "string" &&
        typeof g.createdAt === "string"
      );
    })
  );
}

function validContributions(
  value: unknown,
): value is Contribution[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object") return false;

      const c = item as Partial<Contribution>;

      return (
        typeof c.id === "string" &&
        typeof c.goalId === "string" &&
        typeof c.amount === "number" &&
        Number.isFinite(c.amount) &&
        c.amount > 0 &&
        (c.type === "deposit" ||
          c.type === "withdrawal") &&
        typeof c.createdAt === "string"
      );
    })
  );
}

function percent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function getMonthKey(value: string) {
  return value.slice(0, 7);
}

function HoloOrb({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`holo-ai-orb ${small ? "orb-small" : ""}`}
      aria-hidden="true"
    >
      <div className="orb-halo" />
      <div className="orb-ring orb-ring-one" />
      <div className="orb-ring orb-ring-two" />
      <div className="orb-core">
        <Sparkles size={small ? 22 : 35} />
      </div>
      <div className="orb-satellite orb-satellite-one" />
      <div className="orb-satellite orb-satellite-two" />
    </div>
  );
}

function DashboardContent() {
  const { settings, updateSettings, resetSettings } =
    useHolo();

  const [transactions, setTransactions] = useState<
    Transaction[]
  >(() =>
    readSaved(
      TRANSACTION_KEY,
      DEFAULT_TRANSACTIONS,
      validTransactions,
    ),
  );

  const [goals, setGoals] = useState<SavingsGoal[]>(() =>
    readSaved(GOAL_KEY, [], validGoals),
  );

  const [contributions, setContributions] = useState<
    Contribution[]
  >(() =>
    readSaved(CONTRIBUTION_KEY, [], validContributions),
  );

  const [view, setView] = useState<ViewName>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] =
    useState("all");
  const [transactionCategory, setTransactionCategory] =
    useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [chartPeriod, setChartPeriod] =
    useState<ChartPeriod>(6);
  const [chartMode, setChartMode] =
    useState<ChartMode>("both");
  const [chartAnchor, setChartAnchor] = useState<"latest" | "current">("latest");

  const [transactionModalOpen, setTransactionModalOpen] =
    useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] =
    useState<SavingsGoal | null>(null);
  const [goalManagerOpen, setGoalManagerOpen] =
    useState(false);
  const [selectedGoalId, setSelectedGoalId] =
    useState<string | null>(null);

  const [contributionGoalId, setContributionGoalId] =
    useState<string | null>(null);
  const [contributionType, setContributionType] =
    useState<ContributionType>("deposit");
  const [contributionAmount, setContributionAmount] =
    useState("");
  const [contributionError, setContributionError] =
    useState("");

  const [showAllActivity, setShowAllActivity] =
    useState(false);

  useEffect(() => {
    localStorage.setItem(
      TRANSACTION_KEY,
      JSON.stringify(transactions),
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      GOAL_KEY,
      JSON.stringify(goals),
    );
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(
      CONTRIBUTION_KEY,
      JSON.stringify(contributions),
    );
  }, [contributions]);

  const totals = useMemo(() => {
    const income = transactions.reduce(
      (sum, t) =>
        sum + (t.type === "income" ? t.amount : 0),
      0,
    );

    const expenses = transactions.reduce(
      (sum, t) =>
        sum + (t.type === "expense" ? t.amount : 0),
      0,
    );

    return {
      income,
      expenses,
      balance: income - expenses,
      surplus: income - expenses,
    };
  }, [transactions]);

  const totalGoalSavings = goals.reduce(
    (sum, g) => sum + g.savedAmount,
    0,
  );

  const selectedGoal =
    goals.find((g) => g.id === selectedGoalId) ??
    goals[0] ??
    null;

  const contributionGoal =
    goals.find((g) => g.id === contributionGoalId) ??
    null;

  const goalProgress = selectedGoal
    ? Math.min(
        100,
        percent(
          selectedGoal.savedAmount,
          selectedGoal.targetAmount,
        ),
      )
    : 0;

  const goalMilestones = [25, 50, 75, 100];

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();

    const result = transactions.filter((t) => {
      const matchesSearch =
        !q ||
        [
          t.name,
          t.category,
          t.type,
          t.date,
          String(t.amount),
          money(t.amount),
        ].some((value) =>
          value.toLowerCase().includes(q),
        );

      const matchesType =
        transactionType === "all" ||
        t.type === transactionType;

      const matchesCategory =
        transactionCategory === "all" ||
        t.category === transactionCategory;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      );
    });

    return [...result].sort((a, b) => {
      if (sortOrder === "highest") {
        return b.amount - a.amount;
      }

      if (sortOrder === "lowest") {
        return a.amount - b.amount;
      }

      const comparison = a.date.localeCompare(b.date);

      return sortOrder === "oldest"
        ? comparison
        : -comparison;
    });
  }, [
    transactions,
    search,
    transactionType,
    transactionCategory,
    sortOrder,
  ]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(transactions.map((t) => t.category)),
      ).sort(),
    [transactions],
  );

  const chartData = useMemo<ChartPoint[]>(() => {
    const mostRecent = transactions.reduce<string>((latest, transaction) => {
      const month = getMonthKey(transaction.date);
      return /^\d{4}-\d{2}$/.test(month) && month > latest ? month : latest;
    }, "");
    const today = chartAnchor === "latest" && mostRecent
      ? new Date(`${mostRecent}-01T12:00:00`)
      : new Date();

    return Array.from(
      { length: chartPeriod },
      (_, index) => {
        const date = new Date(
          today.getFullYear(),
          today.getMonth() -
            (chartPeriod - 1 - index),
          1,
        );

        const key = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
        ].join("-");

        const items = transactions.filter(
          (t) => getMonthKey(t.date) === key,
        );

        const income = items
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = items
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          month: date.toLocaleDateString("en-US", {
            month: "short",
          }),
          label: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          income,
          expenses,
          net: income - expenses,
        };
      },
    );
  }, [transactions, chartPeriod, chartAnchor]);

  const chartTotals = chartData.reduce(
    (result, point) => ({
      income: result.income + point.income,
      expenses: result.expenses + point.expenses,
    }),
    { income: 0, expenses: 0 },
  );

  const latestChartMonth = chartData[chartData.length - 1];
  const previousChartMonth = chartData[chartData.length - 2];
  const periodNet = chartTotals.income - chartTotals.expenses;
  const periodSavingsRate = chartTotals.income > 0
    ? (periodNet / chartTotals.income) * 100
    : null;
  const chartHasActivity = chartData.some(
    (point) => point.income !== 0 || point.expenses !== 0,
  );
  const monthExpenseDelta = latestChartMonth && previousChartMonth
    ? latestChartMonth.expenses - previousChartMonth.expenses
    : 0;
  const monthIncomeDelta = latestChartMonth && previousChartMonth
    ? latestChartMonth.income - previousChartMonth.income
    : 0;

  const categorySpending = useMemo(() => {
    const amounts: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type !== "expense") return;

      amounts[t.category] =
        (amounts[t.category] ?? 0) + t.amount;
    });

    return Object.entries(amounts)
      .map(([category, spent]) => {
        const budget =
          CATEGORY_BUDGETS[category] ?? 300;

        return {
          category,
          spent,
          budget,
          used: percent(spent, budget),
          over: spent > budget,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [transactions]);

  const insights = useMemo(() => {
    const result: {
      title: string;
      message: string;
      tone: "good" | "warning" | "neutral";
    }[] = [];

    if (transactions.length === 0) {
      return [
        {
          title: "Start tracking",
          message:
            "Add your first transaction to generate insights.",
          tone: "neutral" as const,
        },
      ];
    }

    if (totals.balance >= 0) {
      result.push({
        title: "Positive recorded balance",
        message: `Your recorded income exceeds expenses by ${money(
          totals.balance,
        )}.`,
        tone: "good",
      });
    } else {
      result.push({
        title: "Negative recorded balance",
        message: `Recorded expenses exceed income by ${money(
          Math.abs(totals.balance),
        )}.`,
        tone: "warning",
      });
    }

    const top = categorySpending[0];

    if (top) {
      result.push({
        title: "Largest expense category",
        message: `${top.category} accounts for ${money(
          top.spent,
        )} of your recorded spending.`,
        tone: "neutral",
      });
    }

    const overBudget = categorySpending.filter(
      (item) => item.over,
    );

    if (overBudget.length > 0) {
      result.push({
        title: "Budget alert",
        message: `${overBudget.length} ${
          overBudget.length === 1
            ? "category is"
            : "categories are"
        } above the configured budget limit.`,
        tone: "warning",
      });
    } else if (categorySpending.length > 0) {
      result.push({
        title: "Categories within limits",
        message:
          "Your recorded category totals are within their configured limits.",
        tone: "good",
      });
    }

    if (goals.length > 0) {
      result.push({
        title: "Savings goals",
        message: `You have ${goals.length} ${
          goals.length === 1 ? "goal" : "goals"
        } with ${money(totalGoalSavings)} recorded in savings.`,
        tone: "neutral",
      });
    }

    return result;
  }, [
    transactions.length,
    totals.balance,
    categorySpending,
    goals.length,
    totalGoalSavings,
  ]);

  const activity = useMemo(() => {
    const transactionItems = transactions.map((t) => ({
      id: `transaction-${t.id}`,
      title: t.name,
      subtitle: t.category,
      date: t.date,
      amount: t.amount,
      type: t.type,
    }));

    const contributionItems = contributions
      .filter((c) =>
        goals.some((g) => g.id === c.goalId),
      )
      .map((c) => {
        const goal = goals.find(
          (g) => g.id === c.goalId,
        );

        return {
          id: `contribution-${c.id}`,
          title:
            c.type === "deposit"
              ? "Savings deposit"
              : "Savings withdrawal",
          subtitle: goal?.name ?? "Savings goal",
          date: c.createdAt,
          amount: c.amount,
          type: c.type,
        };
      });

    return [...transactionItems, ...contributionItems]
      .sort((a, b) => {
        const left =
          dateTime(a.date) ||
          dateTime(`${a.date}T00:00:00`);
        const right =
          dateTime(b.date) ||
          dateTime(`${b.date}T00:00:00`);

        return right - left;
      });
  }, [transactions, contributions, goals]);

  function navigate(next: ViewName) {
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAddTransaction() {
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  }

  function closeTransactionModal() {
    setEditingTransaction(null);
    setTransactionModalOpen(false);
  }

  function addTransaction(input: NewTransaction) {
    setTransactions((current) => [
      {
        ...input,
        id: Date.now() + Math.random(),
      },
      ...current,
    ]);

    closeTransactionModal();
  }

  function updateTransaction(input: Transaction) {
    setTransactions((current) =>
      current.map((t) =>
        t.id === input.id ? input : t,
      ),
    );

    closeTransactionModal();
  }

  function deleteTransaction(t: Transaction) {
    if (!window.confirm(`Delete "${t.name}"?`)) {
      return;
    }

    setTransactions((current) =>
      current.filter((item) => item.id !== t.id),
    );
  }

  function openGoalModal(goal: SavingsGoal | null = null) {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  }

  function saveGoal(input: SavingsGoalInput) {
    if (editingGoal) {
      setGoals((current) =>
        current.map((goal) =>
          goal.id === editingGoal.id
            ? {
                ...goal,
                name: input.name,
                targetAmount: input.targetAmount,
                deadline: input.deadline,
              }
            : goal,
        ),
      );
    } else {
      const goal: SavingsGoal = {
        id: newId(),
        name: input.name,
        targetAmount: input.targetAmount,
        savedAmount: 0,
        deadline: input.deadline,
        createdAt: new Date().toISOString(),
      };

      setGoals((current) => [...current, goal]);
      setSelectedGoalId(goal.id);
    }

    setGoalModalOpen(false);
    setEditingGoal(null);
  }

  function deleteGoal(goal: SavingsGoal) {
    if (
      !window.confirm(
        `Delete "${goal.name}" and its contribution history?`,
      )
    ) {
      return;
    }

    setGoals((current) =>
      current.filter((g) => g.id !== goal.id),
    );

    setContributions((current) =>
      current.filter((c) => c.goalId !== goal.id),
    );

    if (selectedGoalId === goal.id) {
      setSelectedGoalId(null);
    }

    if (contributionGoalId === goal.id) {
      setContributionGoalId(null);
    }
  }

  function openContribution(
    goal: SavingsGoal,
    type: ContributionType,
  ) {
    setContributionGoalId(goal.id);
    setContributionType(type);
    setContributionAmount("");
    setContributionError("");
  }

  function saveContribution(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!contributionGoal) return;

    const amount = Number(contributionAmount);
    const rounded = Math.round(amount * 100) / 100;

    if (!Number.isFinite(amount) || rounded <= 0) {
      setContributionError("Enter a valid amount.");
      return;
    }

    if (
      contributionType === "withdrawal" &&
      rounded > contributionGoal.savedAmount
    ) {
      setContributionError(
        "You cannot withdraw more than the saved amount.",
      );
      return;
    }

    const delta =
      contributionType === "deposit"
        ? rounded
        : -rounded;

    setGoals((current) =>
      current.map((g) =>
        g.id === contributionGoal.id
          ? {
              ...g,
              savedAmount:
                Math.round(
                  (g.savedAmount + delta) * 100,
                ) / 100,
            }
          : g,
      ),
    );

    setContributions((current) => [
      {
        id: newId(),
        goalId: contributionGoal.id,
        amount: rounded,
        type: contributionType,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);

    setContributionGoalId(null);
    setContributionAmount("");
    setContributionError("");
  }

  const navItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "wallet" as const,
      label: "Wallet",
      icon: Wallet,
    },
    {
      id: "transactions" as const,
      label: "Transactions",
      icon: ReceiptText,
    },
    {
      id: "goals" as const,
      label: "Savings Goals",
      icon: Target,
    },
    {
      id: "advisor" as const,
      label: "AI Advisor",
      icon: Bot,
    },
    {
      id: "settings" as const,
      label: "Holo Settings",
      icon: Settings,
    },
  ];

  const showOverview = view === "dashboard";
  const showWallet = showOverview || view === "wallet";
  const showAnalytics = showOverview || view === "wallet";
  const showGoals = showOverview || view === "goals";
  const showTransactions =
    showOverview || view === "transactions";
  const showInsights = showOverview || view === "advisor";
  const showActivity =
    showOverview || view === "transactions";

  return (
    <div className="app-shell holo-shell">
      {mobileOpen && (
        <button
          type="button"
          className="holo-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar holo-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={22} />
          </div>

          <div>
            <strong>BudgetBuddy</strong>
            <span>Holo 2.1 · Smart Wallet</span>
          </div>
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item holo-nav-button ${
                  view === item.id ? "active" : ""
                }`}
                onClick={() => navigate(item.id)}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <ShieldCheck size={22} />
            <div>
              <strong>Local preview mode</strong>
              <span>
                Blockchain connection pending
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content holo-main">
        <header className="topbar holo-topbar">
          <div className="holo-topbar-left">
            <button
              type="button"
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div className="page-heading">
              <p>BudgetBuddy · Holographic Interface</p>

              <h1>
                {navItems.find((item) => item.id === view)
                  ?.label ?? "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="holo-status-pill"
              onClick={() => navigate("settings")}
            >
              <span className="holo-status-dot" />
              Holo active
            </button>

            <button
              type="button"
              className="wallet-button"
              onClick={() => navigate("wallet")}
            >
              <Wallet size={16} />
              Wallet preview
            </button>
          </div>
        </header>

        <div className={`holo-content holo-page-${view}`}>
          {showWallet && (
            <section className="holo-hero-grid">
              <TiltCard className="holo-wallet-card">
                <div className="wallet-card-top">
                  <span>
                    <Wallet size={19} />
                    BUDGETBUDDY / DIGITAL WALLET
                  </span>

                  <span className="holo-chip">
                    <Activity size={15} />
                    LOCAL
                  </span>
                </div>

                <div className="wallet-card-center">
                  <span className="holo-eyebrow">
                    TOTAL RECORDED BALANCE
                  </span>

                  <h2>{money(totals.balance)}</h2>

                  <p>
                    <span className="holo-status-dot" />
                    Updated from local transactions
                  </p>
                </div>

                <div className="wallet-card-bottom">
                  <div>
                    <small>INCOME</small>
                    <strong>
                      {money(totals.income)}
                    </strong>
                  </div>

                  <div>
                    <small>EXPENSES</small>
                    <strong>
                      {money(totals.expenses)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={openAddTransaction}
                  >
                    <Plus size={17} />
                    Add transaction
                  </button>
                </div>

                <div
                  className="wallet-holo-emblem"
                  aria-hidden="true"
                >
                  <div className="wallet-emblem-ring" />
                  <CreditCard size={65} />
                </div>
              </TiltCard>

              <div className="holo-ai-card">
                <HoloOrb />

                <div className="holo-ai-copy">
                  <span className="holo-eyebrow">
                    FINANCIAL INTELLIGENCE
                  </span>

                  <h2>BudgetBuddy AI</h2>

                  <p>
                    {insights[0]?.message ??
                      "Your financial insights will appear here."}
                  </p>

                  <span className="holo-preview-tag">
                    Rule-based preview · AI not connected
                  </span>

                  <button
                    type="button"
                    className="holo-link"
                    onClick={() => navigate("advisor")}
                  >
                    Explore insights
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {(showOverview || view === "wallet") && (
            <section className="holo-stat-grid">
              {[
                {
                  label: "Total income",
                  value: totals.income,
                  icon: ArrowUpRight,
                  color: "green",
                },
                {
                  label: "Total expenses",
                  value: totals.expenses,
                  icon: ArrowDownRight,
                  color: "pink",
                },
                {
                  label: "Net cash flow",
                  value: totals.surplus,
                  icon: PiggyBank,
                  color: "violet",
                },
                {
                  label: "Goal savings",
                  value: totalGoalSavings,
                  icon: Target,
                  color: "cyan",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <TiltCard
                    key={item.label}
                    className="holo-stat-card"
                  >
                    <div
                      className={`holo-stat-icon ${item.color}`}
                    >
                      <Icon size={21} />
                    </div>

                    <span className="holo-eyebrow">
                      {item.label}
                    </span>

                    <strong>
                      {money(item.value)}
                    </strong>

                    <div className="holo-stat-line" />
                  </TiltCard>
                );
              })}
            </section>
          )}

          {(showAnalytics || showGoals) && (
            <section className="holo-feature-grid">
              {showAnalytics && (
                <article className="holo-panel holo-chart-panel">
                  <div className="holo-panel-header">
                    <div>
                      <span className="holo-eyebrow">
                        FINANCIAL ANALYTICS
                      </span>

                      <h2>Income & spending</h2>
                    </div>

                    <div className="holo-analytics-selectors">
                    <select
                      aria-label="Chart ending month"
                      value={chartAnchor}
                      onChange={(event) => setChartAnchor(event.target.value as "latest" | "current")}
                    >
                      <option value="latest">Latest activity</option>
                      <option value="current">Current month</option>
                    </select>
                    <select
                      value={chartPeriod}
                      aria-label="Chart period"
                      onChange={(event) =>
                        setChartPeriod(
                          Number(
                            event.target.value,
                          ) as ChartPeriod,
                        )
                      }
                    >
                      <option value={3}>
                        3 months
                      </option>
                      <option value={6}>
                        6 months
                      </option>
                      <option value={12}>
                        12 months
                      </option>
                    </select>
                    </div>
                  </div>

                  <div className="holo-chart-controls">
                    {(
                      [
                        ["both", "Compare"],
                        ["income", "Income"],
                        ["expenses", "Expenses"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={
                          chartMode === id
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setChartMode(id)
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="holo-chart-totals">
                    <div>
                      <small>Period income</small>
                      <strong className="holo-green">
                        {money(chartTotals.income)}
                      </strong>
                    </div>

                    <div>
                      <small>Period expenses</small>
                      <strong className="holo-pink">
                        {money(chartTotals.expenses)}
                      </strong>
                    </div>
                  </div>

                  <div className="holo-analytics-metrics" aria-label="Selected period summary">
                    <div className="holo-analytics-metric">
                      <small>Net cash flow</small>
                      <strong className={periodNet >= 0 ? "holo-green" : "holo-pink"}>{money(periodNet)}</strong>
                      <span>Income minus expenses</span>
                    </div>
                    <div className="holo-analytics-metric">
                      <small>Cash-flow rate</small>
                      <strong>{periodSavingsRate === null ? "N/A" : `${periodSavingsRate.toFixed(1)}%`}</strong>
                      <span>Net flow / income</span>
                    </div>
                    <div className="holo-analytics-metric">
                      <small>Income vs prior month</small>
                      <strong className={monthIncomeDelta >= 0 ? "holo-green" : "holo-pink"}>
                        {monthIncomeDelta > 0 ? "+" : ""}{money(monthIncomeDelta)}
                      </strong>
                      <span>{latestChartMonth?.month ?? "—"} compared with {previousChartMonth?.month ?? "—"}</span>
                    </div>
                    <div className="holo-analytics-metric">
                      <small>Expenses vs prior month</small>
                      <strong className={monthExpenseDelta <= 0 ? "holo-green" : "holo-pink"}>
                        {monthExpenseDelta > 0 ? "+" : ""}{money(monthExpenseDelta)}
                      </strong>
                      <span>Lower expenses are favorable</span>
                    </div>
                  </div>
                  {!chartHasActivity && (
                    <p className="holo-analytics-notice" role="status">
                      No recorded transactions in this period. Try “Latest activity” or select a longer range.
                    </p>
                  )}

                  <div className="holo-chart-area">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <ComposedChart
                        data={chartData}
                        margin={{
                          top: 16,
                          right: 12,
                          left: -8,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="holoIncome"
                            x1="0"
                            y1="1"
                            x2="0"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="#00d9a0"
                            />
                            <stop
                              offset="100%"
                              stopColor="#7affdc"
                            />
                          </linearGradient>

                          <linearGradient
                            id="holoExpense"
                            x1="0"
                            y1="1"
                            x2="0"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="#886bff"
                            />
                            <stop
                              offset="100%"
                              stopColor="#37e8ff"
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          stroke="rgba(55,232,255,0.10)"
                          strokeDasharray="4 5"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#91a8c6" }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={65}
                          tick={{ fill: "#91a8c6" }}
                          tickFormatter={(value) =>
                            `$${value}`
                          }
                        />

                        <Tooltip
                          contentStyle={{
                            background: "#101d32",
                            border:
                              "1px solid rgba(55,232,255,.3)",
                            borderRadius: 12,
                          }}
                          labelStyle={{
                            color: "#f3f8ff",
                          }}
                          formatter={(value) =>
                            money(Number(value))
                          }
                        />

                        <Legend />

                        {(chartMode === "both" ||
                          chartMode === "income") && (
                          <Bar
                            dataKey="income"
                            name="Income"
                            fill="url(#holoIncome)"
                            radius={[7, 7, 0, 0]}
                            maxBarSize={35}
                            animationDuration={1100}
                          />
                        )}

                        {(chartMode === "both" ||
                          chartMode === "expenses") && (
                          <Bar
                            dataKey="expenses"
                            name="Expenses"
                            fill="url(#holoExpense)"
                            radius={[7, 7, 0, 0]}
                            maxBarSize={35}
                            animationDuration={1400}
                          />
                        )}

                        {chartMode === "both" && (
                          <Line
                            dataKey="net"
                            name="Net"
                            stroke="#ffb4ec"
                            strokeWidth={2}
                            dot={false}
                            type="monotone"
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              )}

              {showGoals && (
                <article className="holo-panel holo-goal-panel">
                  <div className="holo-panel-header">
                    <div>
                      <span className="holo-eyebrow">
                        SAVINGS MILESTONES
                      </span>

                      <h2>
                        {selectedGoal
                          ? selectedGoal.name
                          : "Savings goals"}
                      </h2>
                    </div>

                    <Target
                      size={23}
                      color="#37e8ff"
                    />
                  </div>

                  {!selectedGoal ? (
                    <div className="holo-empty">
                      <PiggyBank size={36} />
                      <p>
                        Create a savings goal to
                        track your milestones.
                      </p>

                      <button
                        className="primary-button"
                        type="button"
                        onClick={() =>
                          openGoalModal()
                        }
                      >
                        <Plus size={17} />
                        Create goal
                      </button>
                    </div>
                  ) : (
                    <>
                      {goals.length > 1 && (
                        <select
                          className="holo-goal-select"
                          aria-label="Select goal"
                          value={selectedGoal.id}
                          onChange={(event) =>
                            setSelectedGoalId(
                              event.target.value,
                            )
                          }
                        >
                          {goals.map((goal) => (
                            <option
                              key={goal.id}
                              value={goal.id}
                            >
                              {goal.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="holo-goal-center">
                        <div
                          className={`holo-progress-orbit ${
                            goalProgress >= 100
                              ? "goal-complete"
                              : ""
                          }`}
                        >
                          <div
                            className="holo-progress-ring"
                            style={{
                              background: `conic-gradient(
                                #37e8ff 0%,
                                #886bff ${goalProgress}%,
                                rgba(110,130,180,.15) 0
                              )`,
                            }}
                          >
                            <div className="holo-progress-inner">
                              <strong>
                                {Math.round(
                                  goalProgress,
                                )}
                                %
                              </strong>
                              <small>
                                COMPLETE
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="holo-goal-amount">
                          <strong>
                            {money(
                              selectedGoal.savedAmount,
                            )}
                          </strong>

                          <span>
                            of{" "}
                            {money(
                              selectedGoal.targetAmount,
                            )}
                          </span>

                          <small>
                            Target{" "}
                            {dateLabel(
                              selectedGoal.deadline,
                            )}
                          </small>
                        </div>
                      </div>

                      <div className="holo-milestones">
                        {goalMilestones.map((step) => (
                          <div
                            key={step}
                            className={
                              goalProgress >= step
                                ? "reached"
                                : ""
                            }
                          >
                            <span>
                              {goalProgress >= step ? (
                                <Check size={13} />
                              ) : (
                                <Zap size={12} />
                              )}
                            </span>
                            <small>{step}%</small>
                          </div>
                        ))}
                      </div>

                      <div className="holo-progress-track">
                        <span
                          style={{
                            width: `${goalProgress}%`,
                          }}
                        />
                      </div>

                      <p className="holo-goal-remaining">
                        {goalProgress >= 100
                          ? "Milestone complete! Goal reached."
                          : `${money(
                              Math.max(
                                0,
                                selectedGoal.targetAmount -
                                  selectedGoal.savedAmount,
                              ),
                            )} remaining`}
                      </p>

                        <SavingsForecast
                          key={selectedGoal.id}
                          goal={selectedGoal}
                        />

                      <div className="holo-goal-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            openContribution(
                              selectedGoal,
                              "deposit",
                            )
                          }
                        >
                          <Plus size={16} />
                          Add savings
                        </button>

                        <button
                          type="button"
                          className="ghost-button"
                          disabled={
                            selectedGoal.savedAmount <= 0
                          }
                          onClick={() =>
                            openContribution(
                              selectedGoal,
                              "withdrawal",
                            )
                          }
                        >
                          Withdraw
                        </button>
                      </div>

                      <button
                        type="button"
                        className="ghost-button holo-full-button"
                        onClick={() =>
                          setGoalManagerOpen(true)
                        }
                      >
                        Manage goals ({goals.length})
                      </button>
                    </>
                  )}
                </article>
              )}
            </section>
          )}

          {/* PHASE 4B — FINANCIAL FORECASTING */}
          {showOverview && (
            <FinancialForecast
              transactions={transactions}
            />
          )}

          {showInsights && (
            <section className="holo-panel holo-insights-panel">
              <div className="holo-panel-header">
                <div>
                  <span className="holo-eyebrow">
                    DATA-DRIVEN INSIGHTS
                  </span>
                  <h2>Financial intelligence</h2>
                </div>

                <Sparkles
                  size={22}
                  color="#37e8ff"
                />
              </div>

              <div className="holo-insights-grid">
                {insights.map((insight, index) => (
                  <div
                    className={`holo-insight ${insight.tone}`}
                    key={`${insight.title}-${index}`}
                  >
                    <div className="holo-insight-icon">
                      {insight.tone === "warning" ? (
                        <AlertTriangle size={19} />
                      ) : insight.tone === "good" ? (
                        <TrendingUp size={19} />
                      ) : (
                        <Activity size={19} />
                      )}
                    </div>

                    <div>
                      <strong>
                        {insight.title}
                      </strong>

                      <p>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="holo-disclaimer">
                These insights are calculated from
                locally recorded data. They are not
                personalized financial advice or
                AI-generated recommendations.
              </p>
            </section>
          )}

          {showTransactions && (
            <section className="holo-panel holo-transactions-panel">
              <div className="holo-panel-header">
                <div>
                  <span className="holo-eyebrow">
                    TRANSACTION MANAGEMENT
                  </span>
                  <h2>
                    {view === "transactions"
                      ? "All transactions"
                      : "Recent transactions"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={openAddTransaction}
                >
                  <Plus size={17} />
                  Add
                </button>
              </div>

              <div className="holo-filter-bar">
                <label className="holo-search">
                  <Search size={17} />
                  <input
                    type="search"
                    placeholder="Search transactions"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </label>

                <select
                  aria-label="Filter transaction type"
                  value={transactionType}
                  onChange={(event) =>
                    setTransactionType(
                      event.target.value,
                    )
                  }
                >
                  <option value="all">
                    All types
                  </option>
                  <option value="income">
                    Income
                  </option>
                  <option value="expense">
                    Expenses
                  </option>
                </select>

                <select
                  aria-label="Filter category"
                  value={transactionCategory}
                  onChange={(event) =>
                    setTransactionCategory(
                      event.target.value,
                    )
                  }
                >
                  <option value="all">
                    All categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Sort transactions"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value)
                  }
                >
                  <option value="newest">
                    Newest
                  </option>
                  <option value="oldest">
                    Oldest
                  </option>
                  <option value="highest">
                    Highest amount
                  </option>
                  <option value="lowest">
                    Lowest amount
                  </option>
                </select>
              </div>

              <div className="holo-transaction-list">
                {filteredTransactions.length === 0 ? (
                  <div className="holo-empty">
                    No matching transactions.
                  </div>
                ) : (
                  filteredTransactions
                    .slice(
                      0,
                      view === "transactions"
                        ? undefined
                        : 5,
                    )
                    .map((transaction) => (
                      <div
                        className="holo-transaction"
                        key={transaction.id}
                      >
                        <div
                          className={`holo-transaction-icon ${
                            transaction.type
                          }`}
                        >
                          {transaction.type ===
                          "income" ? (
                            <ArrowDownLeft size={19} />
                          ) : (
                            <ArrowUpRight size={19} />
                          )}
                        </div>

                        <div className="holo-transaction-details">
                          <strong>
                            {transaction.name}
                          </strong>

                          <span>
                            {transaction.category} ·{" "}
                            {dateLabel(
                              transaction.date,
                            )}
                          </span>
                        </div>

                        <strong
                          className={`holo-transaction-amount ${
                            transaction.type
                          }`}
                        >
                          {transaction.type === "income"
                            ? "+"
                            : "-"}
                          {money(
                            transaction.amount,
                          )}
                        </strong>

                        <button
                          type="button"
                          className="holo-icon-action"
                          aria-label={`Edit ${transaction.name}`}
                          onClick={() => {
                            setEditingTransaction(
                              transaction,
                            );
                            setTransactionModalOpen(
                              true,
                            );
                          }}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="holo-icon-action danger"
                          aria-label={`Delete ${transaction.name}`}
                          onClick={() =>
                            deleteTransaction(
                              transaction,
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                )}
              </div>

              {view === "dashboard" &&
                filteredTransactions.length > 5 && (
                  <button
                    type="button"
                    className="holo-link"
                    onClick={() =>
                      navigate("transactions")
                    }
                  >
                    View all transactions
                    <ChevronRight size={17} />
                  </button>
                )}
            </section>
          )}

          {showActivity && (
            <section className="holo-panel holo-activity-panel">
              <div className="holo-panel-header">
                <div>
                  <span className="holo-eyebrow">
                    FINANCIAL ACTIVITY
                  </span>
                  <h2>Activity timeline</h2>
                </div>

                <Activity
                  size={21}
                  color="#37e8ff"
                />
              </div>

              <div className="holo-timeline">
                {activity.length === 0 ? (
                  <div className="holo-empty">
                    Your activity will appear here.
                  </div>
                ) : (
                  activity
                    .slice(
                      0,
                      showAllActivity
                        ? undefined
                        : 6,
                    )
                    .map((item) => (
                      <div
                        className="holo-timeline-item"
                        key={item.id}
                      >
                        <div className="holo-timeline-node" />

                        <div className="holo-timeline-info">
                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            {item.subtitle} ·{" "}
                            {dateLabel(item.date)}
                          </span>
                        </div>

                        <strong
                          className={
                            item.type === "income" ||
                            item.type === "deposit"
                              ? "holo-green"
                              : "holo-pink"
                          }
                        >
                          {item.type === "income" ||
                          item.type === "deposit"
                            ? "+"
                            : "-"}
                          {money(item.amount)}
                        </strong>
                      </div>
                    ))
                )}
              </div>

              {activity.length > 6 && (
                <button
                  type="button"
                  className="holo-link"
                  onClick={() =>
                    setShowAllActivity(
                      (current) => !current,
                    )
                  }
                >
                  {showAllActivity
                    ? "Show less"
                    : "Show full timeline"}
                  <ChevronRight size={16} />
                </button>
              )}
            </section>
          )}

          {showOverview && (
            <section className="holo-panel holo-budget-panel">
              <div className="holo-panel-header">
                <div>
                  <span className="holo-eyebrow">
                    SPENDING BREAKDOWN
                  </span>
                  <h2>Budget categories</h2>
                </div>

                <BarChart3
                  size={21}
                  color="#37e8ff"
                />
              </div>

              {categorySpending.length > 0 && (
                <div className="holo-spending-summary">
                  <div>
                    <small>Recorded expenses</small>
                    <strong>{money(totals.expenses)}</strong>
                  </div>
                  <div>
                    <small>Largest spending category</small>
                    <strong>{categorySpending[0].category}</strong>
                    <span>{percent(categorySpending[0].spent, totals.expenses).toFixed(1)}% of all recorded expenses</span>
                  </div>
                  <div>
                    <small>Categories over limit</small>
                    <strong>{categorySpending.filter((item) => item.over).length}</strong>
                  </div>
                </div>
              )}
              {categorySpending.length === 0 ? (
                <div className="holo-empty">
                  No expense categories yet.
                </div>
              ) : (
                <div className="holo-budget-grid">
                  {categorySpending
                    .slice(0, 6)
                    .map((item) => (
                      <div
                        className="holo-budget-item"
                        key={item.category}
                      >
                        <div className="holo-budget-top">
                          <strong>
                            {item.category}
                          </strong>

                          <span>
                            {money(item.spent)} /{" "}
                            {money(item.budget)}
                          </span>
                        </div>

                        <div className="holo-progress-track">
                          <span
                            className={
                              item.over
                                ? "over-budget"
                                : ""
                            }
                            style={{
                              width: `${Math.min(
                                100,
                                item.used,
                              )}%`,
                            }}
                          />
                        </div>

                        <small>
                          {Math.round(
                            item.used,
                          )}
                          % used · {percent(item.spent, totals.expenses).toFixed(1)}% of recorded expenses
                          {item.over
                            ? " · Over budget"
                            : ""}
                        </small>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {view === "settings" && (
            <section className="holo-panel holo-settings-panel">
              <div className="holo-panel-header">
                <div>
                  <span className="holo-eyebrow">
                    INTERFACE CUSTOMIZATION
                  </span>

                  <h2>Holographic settings</h2>
                </div>

                <Settings
                  size={22}
                  color="#37e8ff"
                />
              </div>

              <div className="holo-setting-row">
                <div>
                  <strong>
                    Holographic glow
                  </strong>

                  <p>
                    Adjust the brightness of
                    holographic lighting.
                  </p>
                </div>

                <div className="holo-setting-control">
                  <strong>
                    {settings.glow}%
                  </strong>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.glow}
                    onChange={(event) =>
                      updateSettings({
                        glow: Number(
                          event.target.value,
                        ),
                      })
                    }
                  />
                </div>
              </div>

              <div className="holo-setting-row">
                <div>
                  <strong>
                    Animation intensity
                  </strong>

                  <p>
                    Choose how much movement the
                    dashboard uses.
                  </p>
                </div>

                <select
                  value={settings.motion}
                  onChange={(event) =>
                    updateSettings({
                      motion: event.target
                        .value as
                        | "minimal"
                        | "balanced"
                        | "immersive",
                    })
                  }
                >
                  <option value="minimal">
                    Minimal
                  </option>
                  <option value="balanced">
                    Balanced
                  </option>
                  <option value="immersive">
                    Immersive
                  </option>
                </select>
              </div>

              <div className="holo-setting-row">
                <div>
                  <strong>
                    Floating particles
                  </strong>

                  <p>
                    Ambient animated particles
                    in the background.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.particles}
                  onChange={(event) =>
                    updateSettings({
                      particles:
                        event.target.checked,
                    })
                  }
                />
              </div>

              <div className="holo-setting-row">
                <div>
                  <strong>
                    3D card movement
                  </strong>

                  <p>
                    Allow the wallet card to
                    tilt with your pointer.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.tilt}
                  onChange={(event) =>
                    updateSettings({
                      tilt: event.target.checked,
                    })
                  }
                />
              </div>

              <button
                type="button"
                className="ghost-button"
                onClick={resetSettings}
              >
                <RotateCcw size={17} />
                Reset to Holo defaults
              </button>

              <p className="holo-disclaimer">
                Your appearance preferences are
                saved locally. System reduced-motion
                preferences take priority.
              </p>
            </section>
          )}
        </div>
      </main>

      <AddTransactionModal
        isOpen={transactionModalOpen}
        transactionToEdit={editingTransaction}
        onClose={closeTransactionModal}
        onAdd={addTransaction}
        onUpdate={updateTransaction}
      />

      <SavingsGoalModal
        isOpen={goalModalOpen}
        goalToEdit={editingGoal}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={saveGoal}
      />

      {goalManagerOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setGoalManagerOpen(false);
            }
          }}
        >
          <section
            className="transaction-modal holo-manager-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="holo-manager-title"
          >
            <div className="modal-header">
              <div>
                <span className="card-label">
                  GOAL MANAGEMENT
                </span>
                <h2 id="holo-manager-title">
                  Savings goals
                </h2>
              </div>

              <button
                type="button"
                className="holo-icon-action"
                aria-label="Close"
                onClick={() =>
                  setGoalManagerOpen(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="holo-manager-summary">
              <span>Total saved</span>
              <strong>
                {money(totalGoalSavings)}
              </strong>
            </div>

            <div className="holo-manager-list">
              {goals.map((goal) => (
                <div
                  className="holo-manager-item"
                  key={goal.id}
                >
                  <strong>
                    {goal.name}
                  </strong>

                  <span>
                    {money(goal.savedAmount)} /{" "}
                    {money(goal.targetAmount)}
                  </span>

                  <small>
                    Target {dateLabel(goal.deadline)}
                  </small>

                  <div className="holo-progress-track">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          percent(
                            goal.savedAmount,
                            goal.targetAmount,
                          ),
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="holo-manager-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setGoalManagerOpen(false);
                        navigate("goals");
                      }}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setGoalManagerOpen(false);
                        openGoalModal(goal);
                      }}
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        deleteGoal(goal)
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedGoal && (
              <div className="holo-manager-history">
                <h3>
                  {selectedGoal.name} history
                </h3>

                {contributions
                  .filter(
                    (c) =>
                      c.goalId === selectedGoal.id,
                  )
                  .sort(
                    (a, b) =>
                      dateTime(b.createdAt) -
                      dateTime(a.createdAt),
                  )
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      className="holo-manager-history-row"
                      key={c.id}
                    >
                      <span>
                        {c.type === "deposit"
                          ? "Deposit"
                          : "Withdrawal"}
                        <small>
                          {dateLabel(c.createdAt)}
                        </small>
                      </span>

                      <strong>
                        {c.type === "deposit"
                          ? "+"
                          : "-"}
                        {money(c.amount)}
                      </strong>
                    </div>
                  ))}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setGoalManagerOpen(false)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setGoalManagerOpen(false);
                  openGoalModal();
                }}
              >
                <Plus size={16} />
                New goal
              </button>
            </div>
          </section>
        </div>
      )}

      {contributionGoal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setContributionGoalId(null);
            }
          }}
        >
          <section
            className="transaction-modal holo-manager-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="holo-contribution-title"
          >
            <div className="modal-header">
              <div>
                <span className="card-label">
                  {contributionGoal.name}
                </span>

                <h2 id="holo-contribution-title">
                  {contributionType === "deposit"
                    ? "Add savings"
                    : "Withdraw savings"}
                </h2>
              </div>

              <button
                type="button"
                className="holo-icon-action"
                aria-label="Close"
                onClick={() =>
                  setContributionGoalId(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={saveContribution}
            >
              <div className="holo-manager-summary">
                <span>Currently saved</span>
                <strong>
                  {money(
                    contributionGoal.savedAmount,
                  )}
                </strong>
              </div>

              <div className="form-group">
                <label htmlFor="holo-amount">
                  Amount ($)
                </label>

                <input
                  id="holo-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(event) => {
                    setContributionAmount(
                      event.target.value,
                    );
                    setContributionError("");
                  }}
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>

              {contributionError && (
                <p
                  className="form-error"
                  role="alert"
                >
                  {contributionError}
                </p>
              )}

              <p className="holo-disclaimer">
                This is a simulated savings record.
                It does not move money or change
                your transaction balance.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    setContributionGoalId(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Confirm{" "}
                  {contributionType === "deposit"
                    ? "deposit"
                    : "withdrawal"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <HoloEffects>
      <DashboardContent />
    </HoloEffects>
  );
}
