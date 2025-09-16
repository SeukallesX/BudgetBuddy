# storage.py

import csv
from transactions import Transaction

FILE = "transactions.csv"

def save_transactions(transactions):
    with open(FILE, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Date", "Type", "Category", "Amount", "Balance"])
        for t in transactions:
            writer.writerow([t.date, t.t_type, t.category, t.amount, t.balance])

def load_transactions():
    transactions = []
    try:
        with open(FILE, mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                t = Transaction(
                    row["Date"],
                    row["Type"],
                    row["Category"],
                    float(row["Amount"]),
                    float(row["Balance"]),
                )
                transactions.append(t)
    except FileNotFoundError:
        pass
    return transactions
