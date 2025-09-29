# budgetbuddy_cli.py
from tracker import Wallet
import storage

def main():
    wallet = Wallet()
    wallet.transactions = storage.load_transactions()
    if wallet.transactions:
        wallet.balance = wallet.transactions[-1].balance

    while True:
        print("\n💳 BudgetBuddy CLI - Phase 1")
        print("1️⃣ Add Income")
        print("2️⃣ Add Expense")
        print("3️⃣ View Transactions")
        print("4️⃣ Exit")

        choice = input("👉 Choose an option: ")

        if choice == "1":
            amount = float(input("Enter income amount: "))
            category = input("Enter category (e.g., Salary, Bonus): ")
            wallet.add_income(amount, category)
            storage.save_transactions(wallet.transactions)
            print("✅ Income added!")

        elif choice == "2":
            amount = float(input("Enter expense amount: "))
            category = input("Enter category (e.g., Food, Rent): ")
            wallet.add_expense(amount, category)
            storage.save_transactions(wallet.transactions)
            print("✅ Expense added!")

        elif choice == "3":
            print("\n📜 Transaction History:")
            for t in wallet.transactions:
                print(f"{t.date} | {t.t_type} | {t.category} | ${t.amount:.2f} | Balance: ${t.balance:.2f}")

        elif choice == "4":
            print("👋 Exiting BudgetBuddy. Goodbye!")
            break

        else:
            print("⚠️ Invalid choice, try again.")

if __name__ == "__main__":
    main()
