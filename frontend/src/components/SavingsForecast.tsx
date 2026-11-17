
import { useMemo, useState } from "react";
import { Target, TrendingUp } from "lucide-react";
import type { SavingsGoal } from "./SavingsGoalModal";

type SavingsForecastProps = {
  goal: SavingsGoal;
};

function money(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function SavingsForecast({
  goal,
}: SavingsForecastProps) {
  const [monthlySavings, setMonthlySavings] = useState(100);

  const forecast = useMemo(() => {
    const remaining = Math.max(
      0,
      goal.targetAmount - goal.savedAmount
    );

    const today = new Date();
    const deadline = new Date(`${goal.deadline}T12:00:00`);

    const monthsUntilDeadline = Math.max(
      0,
      (deadline.getFullYear() - today.getFullYear()) * 12 +
        deadline.getMonth() - today.getMonth() +
        (deadline.getDate() >= today.getDate() ? 1 : 0)
    );

    const monthlyRequired =
      remaining === 0
        ? 0
        : monthsUntilDeadline > 0
          ? remaining / monthsUntilDeadline
          : null;

    const monthsToComplete =
      remaining === 0
        ? 0
        : monthlySavings > 0
          ? Math.ceil(remaining / monthlySavings)
          : null;

    const estimatedCompletion =
      monthsToComplete === null
        ? null
        : new Date(
            today.getFullYear(),
            today.getMonth() + monthsToComplete,
            1
          );

    const projectedTotal =
      goal.savedAmount +
      monthlySavings * monthsUntilDeadline;

    const status =
      remaining === 0
        ? "Completed"
        : monthsUntilDeadline === 0
          ? "Deadline reached"
          : monthlySavings === 0
            ? "No savings plan"
            : projectedTotal >= goal.targetAmount
              ? "On track"
              : "Behind schedule";

    return {
      remaining,
      monthlyRequired,
      estimatedCompletion,
      status,
    };
  }, [goal, monthlySavings]);

  return (
    <div className="holo-savings-forecast">
      <div className="holo-panel-header">
        <div>
          <span className="holo-eyebrow">
            PHASE 4B.2 · SAVINGS FORECAST
          </span>
          <h3>Goal completion estimate</h3>
        </div>
        <Target size={21} color="#37e8ff" />
      </div>

      <div className="holo-forecast-controls">
        <label>
          Monthly savings contribution ($)
          <input
            type="number"
            min="0"
            step="10"
            value={monthlySavings}
            onChange={(event) =>
              setMonthlySavings(
                Math.max(0, Number(event.target.value) || 0)
              )
            }
          />
        </label>
      </div>

      <div className="holo-forecast-summary">
        <div>
          <small>Remaining to save</small>
          <strong>{money(forecast.remaining)}</strong>
        </div>

        <div>
          <small>Monthly savings needed</small>
          <strong>
            {forecast.monthlyRequired === null
              ? "Deadline reached"
              : money(forecast.monthlyRequired)}
          </strong>
        </div>

        <div>
          <small>Estimated completion</small>
          <strong>
            {forecast.remaining === 0
              ? "Goal reached"
              : forecast.estimatedCompletion
                ? forecast.estimatedCompletion.toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" }
                  )
                : "Not available"}
          </strong>
        </div>

        <div>
          <small>Goal status</small>
          <strong>{forecast.status}</strong>
        </div>
      </div>

      <p className="holo-forecast-note">
        <TrendingUp size={15} />
        {" "}This estimate assumes you save{" "}
        {money(monthlySavings)} every month.
        No money is transferred automatically.
      </p>
    </div>
  );
}
