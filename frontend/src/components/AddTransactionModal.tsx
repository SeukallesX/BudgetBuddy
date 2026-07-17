import { useState } from "react";
import { X } from "lucide-react";

export type NewTransaction = {
  name: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
};

type AddTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: NewTransaction) => void;
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onAdd({
      name: name.trim(),
      category,
      amount: parsedAmount,
      type,
      date,
    });

    setName("");
    setAmount("");
    setCategory("Food");
    setType("expense");
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="card-label">New activity</span>
            <h2 id="transaction-modal-title">Add transaction</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            aria-label="Close transaction form"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <form className="transaction-form" onSubmit={handleSubmit}>
          <label>
            Transaction name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Groceries"
              required
            />
          </label>

          <div className="form-row">
            <label>
              Type
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "income" | "expense")
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Food</option>
                <option>Transportation</option>
                <option>Housing</option>
                <option>Entertainment</option>
                <option>Shopping</option>
                <option>Income</option>
                <option>Savings</option>
                <option>Crypto</option>
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary-button">
              Add transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}