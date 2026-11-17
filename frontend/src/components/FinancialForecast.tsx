
import { useMemo, useState } from "react";
import {
  Activity,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ForecastTransaction = {
  id: number;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "income" | "expense";
};

type FinancialForecastProps = {
  transactions: ForecastTransaction[];
};

type ForecastPeriod = 3 | 6 | 12;

type MonthlyTotals = {
  key: string;
  income: number;
  expenses: number;
};

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function monthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function addMonths(date: Date, amount: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );
}

function calculateHistory(
  transactions: ForecastTransaction[],
): MonthlyTotals[] {
  const months = new Map<string, MonthlyTotals>();

  transactions.forEach((transaction) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date) ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0
    ) {
      return;
    }

    const key = transaction.date.slice(0, 7);

    const existing = months.get(key) ?? {
      key,
      income: 0,
      expenses: 0,
    };

    if (transaction.type === "income") {
      existing.income += transaction.amount;
    } else {
      existing.expenses += transaction.amount;
    }

    months.set(key, existing);
  });

  return [...months.values()].sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

export default function FinancialForecast({
  transactions,
}: FinancialForecastProps) {
  const [period, setPeriod] = useState<ForecastPeriod>(6);

  const history = useMemo(
    () => calculateHistory(transactions),
    [transactions],
  );

  const historicalTotals = useMemo(() => {
    const income = transactions.reduce(
      (sum, transaction) =>
        sum +
        (transaction.type === "income"
          ? transaction.amount
          : 0),
      0,
    );

    const expenses = transactions.reduce(
      (sum, transaction) =>
        sum +
        (transaction.type === "expense"
          ? transaction.amount
          : 0),
      0,
    );

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  // Use the last three calendar months ending with the
  // latest recorded transaction month.
  // Months without transactions count as zero.
  const averages = useMemo(() => {
    if (history.length === 0) {
      return {
        income: 0,
        expenses: 0,
        observedMonths: 0,
      };
    }

    const lastKey = history[history.length - 1].key;
    const lastDate = new Date(`${lastKey}-01T12:00:00`);

    const recentKeys = Array.from(
      { length: 3 },
      (_, index) => monthKey(addMonths(lastDate, index - 2)),
    );

    const recent = recentKeys.map(
      (key) =>
        history.find((item) => item.key === key) ?? {
          key,
          income: 0,
          expenses: 0,
        },
    );

    return {
      income: roundMoney(
        recent.reduce((sum, item) => sum + item.income, 0) /
          recent.length,
      ),
      expenses: roundMoney(
        recent.reduce(
          (sum, item) => sum + item.expenses,
          0,
        ) / recent.length,
      ),
      observedMonths: history.filter((item) =>
        recentKeys.includes(item.key),
      ).length,
    };
  }, [history]);

  const [incomeOverride, setIncomeOverride] =
    useState<string>("");

  const [expenseOverride, setExpenseOverride] =
    useState<string>("");

  const monthlyIncome =
    incomeOverride === ""
      ? averages.income
      : Number(incomeOverride);

  const monthlyExpenses =
    expenseOverride === ""
      ? averages.expenses
      : Number(expenseOverride);

  const validScenario =
    Number.isFinite(monthlyIncome) &&
    Number.isFinite(monthlyExpenses) &&
    monthlyIncome >= 0 &&
    monthlyExpenses >= 0;

  const safeIncome = validScenario ? monthlyIncome : 0;
  const safeExpenses = validScenario ? monthlyExpenses : 0;

  const monthlyNet = roundMoney(
    safeIncome - safeExpenses,
  );

  const projectedBalance = roundMoney(
    historicalTotals.balance + monthlyNet * period,
  );

  const hasHistory = history.length > 0;

  const referenceDate = useMemo(() => {
    const now = new Date();

    if (!hasHistory) {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );
    }

    const latestKey = history[history.length - 1].key;
    const latest = new Date(`${latestKey}-01T12:00:00`);

    // Do not start projections in the past.
    const latestMonth = new Date(
      latest.getFullYear(),
      latest.getMonth(),
      1,
    );

    const currentMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    return latestMonth > currentMonth
      ? latestMonth
      : currentMonth;
  }, [history, hasHistory]);

  const chartData = useMemo(() => {
    const startingBalance = historicalTotals.balance;

    return Array.from(
      { length: period + 1 },
      (_, index) => {
        const date = addMonths(referenceDate, index);

        return {
          month: monthLabel(date),
          balance: roundMoney(
            startingBalance + monthlyNet * index,
          ),
          income:
            index === 0 ? null : safeIncome,
          expenses:
            index === 0 ? null : safeExpenses,
        };
      },
    );
  }, [
    period,
    referenceDate,
    historicalTotals.balance,
    monthlyNet,
    safeIncome,
    safeExpenses,
  ]);

  function resetScenario() {
    setIncomeOverride("");
    setExpenseOverride("");
    setPeriod(6);
  }

  return (
    <section className="holo-panel holo-forecast-panel">
      <div className="holo-panel-header">
        <div>
          <span className="holo-eyebrow">
            PHASE 4B · FINANCIAL FORECASTING
          </span>

          <h2>Future cash flow simulator</h2>
        </div>

        <TrendingUp size={23} color="#37e8ff" />
      </div>

      <p className="holo-forecast-note">
        Explore possible future balances using recorded
        transactions and adjustable monthly assumptions.
        Projections are illustrative and are not guaranteed
        financial outcomes.
      </p>

      <div className="holo-forecast-controls">
        <label>
          Forecast horizon
          <select
            value={period}
            onChange={(event) =>
              setPeriod(
                Number(event.target.value) as ForecastPeriod,
              )
            }
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </label>

        <label>
          Monthly income ($)
          <input
            type="number"
            min="0"
            step="0.01"
            value={incomeOverride}
            placeholder={averages.income.toFixed(2)}
            onChange={(event) =>
              setIncomeOverride(event.target.value)
            }
          />
        </label>

        <label>
          Monthly expenses ($)
          <input
            type="number"
            min="0"
            step="0.01"
            value={expenseOverride}
            placeholder={averages.expenses.toFixed(2)}
            onChange={(event) =>
              setExpenseOverride(event.target.value)
            }
          />
        </label>

        <label>
          Forecast model
          <select value="average" disabled>
            <option value="average">
              Historical average
            </option>
          </select>
        </label>
      </div>

      {!validScenario && (
        <p className="holo-analytics-notice" role="alert">
          Enter valid non-negative income and expense
          amounts to calculate a forecast.
        </p>
      )}

      {hasHistory && averages.observedMonths < 3 && (
        <p className="holo-analytics-notice" role="status">
          Limited historical data: only{" "}
          {averages.observedMonths} of the last 3 months
          contain recorded transactions. The estimates
          may not reflect recurring income or spending.
        </p>
      )}

      {!hasHistory && (
        <p className="holo-analytics-notice" role="status">
          No transaction history is available. Add
          transactions or enter scenario values to explore
          a hypothetical projection.
        </p>
      )}

      <div className="holo-forecast-summary">
        <div>
          <small>Monthly projected income</small>
          <strong className="holo-green">
            {money(safeIncome)}
          </strong>
        </div>

        <div>
          <small>Monthly projected expenses</small>
          <strong className="holo-pink">
            {money(safeExpenses)}
          </strong>
        </div>

        <div>
          <small>Monthly projected cash flow</small>
          <strong
            className={
              monthlyNet >= 0
                ? "holo-green"
                : "holo-pink"
            }
          >
            {money(monthlyNet)}
          </strong>
        </div>

        <div>
          <small>Projected ending balance</small>
          <strong
            className={
              projectedBalance >= 0
                ? "holo-green"
                : "holo-pink"
            }
          >
            {money(projectedBalance)}
          </strong>
        </div>
      </div>

      <div
        className="holo-forecast-chart"
        aria-label="Projected balance chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              stroke="rgba(55,232,255,.10)"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: "#91a8c6", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#91a8c6", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                `$${value.toLocaleString("en-US")}`
              }
            />

            <Tooltip
              contentStyle={{
                background: "#101d32",
                border:
                  "1px solid rgba(55,232,255,.3)",
                borderRadius: 12,
                color: "#f3f8ff",
              }}
              formatter={(value) =>
                money(Number(value))
              }
            />

            <Legend />

            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,.25)"
            />

            <Line
              type="linear"
              dataKey="balance"
              name="Projected balance"
              stroke="#37e8ff"
              strokeWidth={3}
              dot={{
                r: 3,
                fill: "#37e8ff",
              }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="linear"
              dataKey="income"
              name="Assumed income"
              stroke="#00d9a0"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />

            <Line
              type="linear"
              dataKey="expenses"
              name="Assumed expenses"
              stroke="#ff92cb"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="holo-forecast-footer">
        <span>
          <Sparkles size={14} style={{
            verticalAlign: "middle",
            marginRight: 6,
          }} />
          Projection starts from your recorded balance
          of {money(historicalTotals.balance)}.
        </span>

        <button
          type="button"
          className="ghost-button"
          onClick={resetScenario}
        >
          <RotateCcw size={16} />
          Reset scenario
        </button>
      </div>

      <p className="holo-disclaimer">
        <Activity
          size={13}
          style={{
            verticalAlign: "middle",
            marginRight: 6,
          }}
        />
        Historical averages use the three calendar months
        ending with the latest recorded transaction month.
        Months without transactions are counted as zero.
        Savings goal contributions are not deducted from
        projected balances because they are simulated
        separately from wallet transactions.
      </p>
    </section>
  );
}
