import csv
import os
from datetime import datetime

CSV_FILE = os.path.join(os.path.dirname(__file__), "expenses.csv")

def add_expense(amount, category, description=""):
    """Add a new expense entry to the CSV file."""
    with open(CSV_FILE, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([datetime.now().strftime("%Y-%m-%d"), amount, category, description])
    print(f"✅ Added expense: ${amount} - {category} ({description})")

def view_expenses():
    """Display all expenses recorded in the CSV file."""
    if not os.path.exists(CSV_FILE):
        print("No expenses recorded yet.")
        return
    
    with open(CSV_FILE, mode="r") as file:
        reader = csv.reader(file)
        print("\n📊 Expense History:")
        print("Date        | Amount | Category   | Description")
        print("-" * 50)
        for row in reader:
            print(f"{row[0]} | ${row[1]} | {row[2]} | {row[3]}")

def main():
    print("💰 Budget Buddy - Phase 1: Tracker")
    while True:
        print("\nOptions: [1] Add Expense [2] View Expenses [3] Exit")
        choice = input("Choose an option: ")

        if choice == "1":
            amount = float(input("Enter amount: $"))
            category = input("Enter category (Food, Transport, etc.): ")
            description = input("Enter description (optional): ")
            add_expense(amount, category, description)
        elif choice == "2":
            view_expenses()
        elif choice == "3":
            print("👋 Goodbye! Your expenses are saved.")
            break
        else:
            print("❌ Invalid choice. Try again.")

if __name__ == "__main__":
    main()
