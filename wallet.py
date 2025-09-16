# wallet.py

from transactions import Transaction
from datetime import datetime

class Wallet:
    def __init__(self):
        self.balance = 0.0
        self.transactions = []

    def add_income(self, amount, category="Other"):
        self.balance += amount
        t = Transaction(datetime.today().strftime("%Y-%m-%d"), "Income", category, amount, self.balance)
        self.transactions.append(t)
        return t

    def add_expense(self, amount, category="Other"):
        self.balance -= amount
        t = Transaction(datetime.today().strftime("%Y-%m-%d"), "Expense", category, amount, self.balance)
        self.transactions.append(t)
        return t

    def get_balance(self):
        return self.balance

    def get_transactions(self):
        return self.transactions
