# data_handler.py
import csv
from datetime import datetime

FILENAME = "budgetbuddy_advanced.csv"

def load_expenses():
    expenses = []
    try:
        with open(FILENAME, newline='') as file:
            reader = csv.DictReader(file)
            for row in reader:
                row["amount"] = float(row["amount"])
                expenses.append(row)
    except FileNotFoundError:
        pass
    return expenses

def save_expenses(expenses):
    with open(FILENAME, "w", newline='') as file:
        fieldnames = ["date", "amount", "category", "description"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for exp in expenses:
            writer.writerow(exp)

def filter_expenses(expenses, category=None, date=None):
    filtered = []
    for exp in expenses:
        if category and exp["category"] != category:
            continue
        if date and exp["date"] != date:
            continue
        filtered.append(exp)
    return filtered

def validate_date(date_str):
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False
