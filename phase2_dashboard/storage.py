# storage.py
import csv
import os
from wallet import Transaction

CSV_FILE = "transactions.csv"

def save_transactions(transactions: list[Transaction], filename: str = CSV_FILE):
    """Overwrite CSV with current transactions list."""
    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Date", "Type", "Category", "Amount", "Balance"])
        for t in transactions:
            writer.writerow([t.date, t.t_type, t.category, f"{t.amount:.2f}", f"{t.balance:.2f}"])

def load_transactions(filename: str = CSV_FILE) -> list[Transaction]:
    """Load transactions from CSV and return list of Transaction objects (empty list if missing)."""
    transactions = []
    if not os.path.exists(filename):
        return transactions
    with open(filename, mode="r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                amount = float(row.get("Amount", 0))
                balance = float(row.get("Balance", 0))
                t_type = row.get("Type", "Expense")
                category = row.get("Category", "Other")
                date = row.get("Date", None)
                transactions.append(Transaction(t_type, category, amount, balance, date=date))
            except Exception:
                # skip malformed rows
                continue
    return transactions
