# wallet.py
from datetime import datetime

class Transaction:
    def __init__(self, t_type: str, category: str, amount: float, balance: float, date: str = None):
        self.date = date if date else datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.t_type = t_type            # "Income" or "Expense"
        self.category = category
        self.amount = float(amount)
        self.balance = float(balance)

    def to_dict(self):
        return {
            "Date": self.date,
            "Type": self.t_type,
            "Category": self.category,
            "Amount": f"{self.amount:.2f}",
            "Balance": f"{self.balance:.2f}"
        }

class Wallet:
    def __init__(self):
        self.balance = 0.0
        self.transactions: list[Transaction] = []

    def add_income(self, amount: float, category: str = "Other"):
        self.balance += float(amount)
        t = Transaction("Income", category, float(amount), self.balance)
        self.transactions.append(t)

    def add_expense(self, amount: float, category: str = "Other"):
        self.balance -= float(amount)
        t = Transaction("Expense", category, float(amount), self.balance)
        self.transactions.append(t)

    def remove_transaction(self, index: int) -> bool:
        if 0 <= index < len(self.transactions):
            del self.transactions[index]
            self.recalculate_balances()
            return True
        return False

    def edit_transaction(self, index: int, t_type: str, category: str, amount: float) -> bool:
        """
        Edit a transaction (type, category, amount) and recalculate balances.
        amount: positive number (for both Income and Expense), t_type determines sign when computing balances.
        """
        if 0 <= index < len(self.transactions):
            # overwrite fields (date kept)
            t = self.transactions[index]
            t.t_type = t_type
            t.category = category
            t.amount = float(amount)
            self.recalculate_balances()
            return True
        return False

    def recalculate_balances(self):
        """Recompute running balances from scratch based on transactions order."""
        bal = 0.0
        for t in self.transactions:
            if t.t_type == "Income":
                bal += t.amount
            else:
                bal -= t.amount
            t.balance = bal
        self.balance = bal

    def get_balance(self) -> float:
        return self.balance
