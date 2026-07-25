import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { Save, X } from "lucide-react";

export type TransactionType = "income" | "expense";

export type NewTransaction = {
  name: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
};

export type EditableTransaction = NewTransaction & {
  id: number;
};

type AddTransactionModalProps = {
  isOpen: boolean;
  transactionToEdit?: EditableTransaction | null;
  onClose: () => void;
  onAdd: (transaction: NewTransaction) => void;
  onUpdate: (transaction: EditableTransaction) => void;
};

type TransactionFormState = {
  name: string;
  category: string;
  date: string;
  amount: string;
  type: TransactionType;
};

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const getEmptyForm = (): TransactionFormState => ({
  name: "",
  category: "",
  date: getTodayDate(),
  amount: "",
  type: "expense",
});

export default function AddTransactionModal({
  isOpen,
  transactionToEdit = null,
  onClose,
  onAdd,
  onUpdate,
}: AddTransactionModalProps) {
  const [form, setForm] = useState<TransactionFormState>(getEmptyForm);
  const [error, setError] = useState("");

  const isEditing = transactionToEdit !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError("");

    if (transactionToEdit) {
      setForm({
        name: transactionToEdit.name,
        category: transactionToEdit.category,
        date: transactionToEdit.date,
        amount: transactionToEdit.amount.toString(),
        type: transactionToEdit.type,
      });

      return;
    }

    setForm(getEmptyForm());
  }, [isOpen, transactionToEdit]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedCategory = form.category.trim();
    const parsedAmount = Number(form.amount);

    if (!trimmedName) {
      setError("Enter a transaction name.");
      return;
    }

    if (!trimmedCategory) {
      setError("Select or enter a category.");
      return;
    }

    if (!form.date) {
      setError("Select a transaction date.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than $0.");
      return;
    }

    const transactionData: NewTransaction = {
      name: trimmedName,
      category: trimmedCategory,
      date: form.date,
      amount: parsedAmount,
      type: form.type,
    };

    if (transactionToEdit) {
      onUpdate({
        id: transactionToEdit.id,
        ...transactionData,
      });
    } else {
      onAdd(transactionData);
    }

    setForm(getEmptyForm());
    setError("");
    onClose();
  };

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <section
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="card-label">
              {isEditing ? "Update activity" : "New activity"}
            </span>

            <h2 id="transaction-modal-title">
              {isEditing ? "Edit transaction" : "Add transaction"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            aria-label="Close transaction form"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="transaction-name">Transaction name</label>

            <input
              id="transaction-name"
              name="name"
              type="text"
              placeholder="Example: Groceries"
              value={form.name}
              onChange={handleInputChange}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transaction-amount">Amount</label>

              <input
                id="transaction-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={form.amount}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="transaction-type">Type</label>

              <select
                id="transaction-type"
                name="type"
                value={form.type}
                onChange={handleInputChange}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transaction-category">Category</label>

              <select
                id="transaction-category"
                name="category"
                value={form.category}
                onChange={handleInputChange}
              >
                <option value="">Select category</option>
                <option value="Income">Income</option>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Savings">Savings</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="transaction-date">Date</label>

              <input
                id="transaction-date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleInputChange}
              />
            </div>
          </div>

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

            <button type="submit" className="primary-button">
              <Save size={18} />

              {isEditing ? "Save changes" : "Add transaction"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}