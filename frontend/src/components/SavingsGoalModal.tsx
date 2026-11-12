
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { Target, X } from "lucide-react";

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  createdAt: string;
};

export type SavingsGoalInput = {
  name: string;
  targetAmount: number;
  deadline: string;
};

type Props = {
  isOpen: boolean;
  goalToEdit?: SavingsGoal | null;
  onClose: () => void;
  onSave: (goal: SavingsGoalInput) => void;
};

export default function SavingsGoalModal({
  isOpen,
  goalToEdit = null,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setName(goalToEdit?.name ?? "");
    setTargetAmount(
      goalToEdit ? String(goalToEdit.targetAmount) : "",
    );
    setDeadline(goalToEdit?.deadline ?? "");
    setError("");
  }, [isOpen, goalToEdit]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(targetAmount);

    if (!name.trim()) {
      setError("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid target amount.");
      return;
    }

    if (!deadline) {
      setError("Please select a target date.");
      return;
    }

    onSave({
      name: name.trim(),
      targetAmount: Math.round(amount * 100) / 100,
      deadline,
    });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="transaction-modal savings-goal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="card-label">
              Savings management
            </span>

            <h2 id="goal-modal-title">
              {goalToEdit
                ? "Edit savings goal"
                : "Create savings goal"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form
          className="transaction-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="goal-name">Goal name</label>

            <input
              id="goal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Emergency Fund"
              maxLength={60}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-target">
              Target amount ($)
            </label>

            <input
              id="goal-target"
              type="number"
              min="0.01"
              step="0.01"
              value={targetAmount}
              onChange={(event) =>
                setTargetAmount(event.target.value)
              }
              placeholder="4000.00"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-deadline">
              Target date
            </label>

            <input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(event) =>
                setDeadline(event.target.value)
              }
              required
            />
          </div>

          {goalToEdit && (
            <p className="goal-form-note">
              Your existing savings balance will be preserved.
            </p>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              <Target size={17} />
              {goalToEdit
                ? "Save changes"
                : "Create goal"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
