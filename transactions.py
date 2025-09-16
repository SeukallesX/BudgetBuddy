# transactions.py

class Transaction:
    def __init__(self, date, t_type, category, amount, balance):
        self.date = date
        self.t_type = t_type      # "Income" or "Expense"
        self.category = category  # Food, Rent, Shopping, Other
        self.amount = amount
        self.balance = balance
