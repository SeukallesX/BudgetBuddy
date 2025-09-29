# visualization.py
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

def plot_balance_chart(transactions):
    if not transactions:
        print("No transactions to plot.")
        return
    dates = [t.date for t in transactions]
    balances = [t.balance for t in transactions]

    plt.figure(figsize=(8,4))
    plt.plot(dates, balances, marker="o", linestyle="-", color="#2c7be5")
    plt.fill_between(dates, balances, color="#2c7be5", alpha=0.1)
    plt.title("Wallet Balance Over Time")
    plt.ylabel("Balance ($)")
    plt.xlabel("Date")
    plt.xticks(rotation=45, ha="right")
    plt.grid(alpha=0.25)
    plt.tight_layout()
    plt.show()

def plot_category_chart(transactions):
    expenses = {}
    for t in transactions:
        if t.t_type.lower() == "expense":
            expenses[t.category] = expenses.get(t.category, 0.0) + t.amount

    if not expenses:
        print("No expense data to plot.")
        return

    labels = list(expenses.keys())
    sizes = list(expenses.values())
    colors = plt.cm.Pastel1(range(len(labels)))

    plt.figure(figsize=(6,6))
    plt.pie(sizes, labels=labels, autopct="%1.1f%%", colors=colors, startangle=140)
    plt.title("Spending by Category")
    plt.tight_layout()
    plt.show()
