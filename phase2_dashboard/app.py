# app.py - BudgetBuddy Phase 2 Dashboard
import tkinter as tk
from tkinter import ttk, messagebox
from wallet import Wallet
import storage
from ai_insights import BudgetBuddyAI
from visualization import plot_balance_chart, plot_category_chart

class BudgetBuddyApp:
    def __init__(self, root):
        self.root = root
        self.root.title("💳 BudgetBuddy - Smart Wallet")
        self.root.geometry("800x650")
        self.root.configure(bg="#f0f8ff")  # light blue background

        self.wallet = Wallet()
        self.wallet.transactions = storage.load_transactions()
        if self.wallet.transactions:
            self.wallet.balance = self.wallet.transactions[-1].balance

        self.create_widgets()

    def create_widgets(self):
        style = ttk.Style()
        style.configure("Treeview", background="#ffffff", foreground="#000000", rowheight=25, fieldbackground="#ffffff")
        style.configure("TButton", font=("Arial", 11), padding=6)

        # Balance
        self.balance_label = tk.Label(
            self.root,
            text=f"Balance: ${self.wallet.get_balance():.2f}",
            font=("Arial", 20, "bold"),
            bg="#f0f8ff",
            fg="#2e8b57"
        )
        self.balance_label.pack(pady=10)

        # Category
        self.category_var = tk.StringVar()
        self.category_var.set("Other")
        categories = ["Food", "Rent", "Shopping", "Entertainment", "Savings", "Other"]
        self.category_menu = ttk.Combobox(self.root, textvariable=self.category_var, values=categories, state="readonly")
        self.category_menu.pack(pady=5)

        # Amount
        self.amount_entry = tk.Entry(self.root, font=("Arial", 14), fg="gray")
        self.amount_entry.pack(pady=5)
        self.amount_entry.insert(0, "Enter amount")

        # Buttons
        btn_frame = tk.Frame(self.root, bg="#f0f8ff")
        btn_frame.pack(pady=5)

        self.income_btn = tk.Button(btn_frame, text="➕ Add Income", bg="#32cd32", fg="white", command=self.add_income)
        self.income_btn.grid(row=0, column=0, padx=5)

        self.expense_btn = tk.Button(btn_frame, text="➖ Add Expense", bg="#ff4500", fg="white", command=self.add_expense)
        self.expense_btn.grid(row=0, column=1, padx=5)

        self.remove_btn = tk.Button(btn_frame, text="🗑 Remove Transaction", bg="#ff6347", fg="white", command=self.remove_transaction)
        self.remove_btn.grid(row=0, column=2, padx=5)

        # Transactions Table
        self.tree = ttk.Treeview(self.root, columns=("Date", "Type", "Category", "Amount", "Balance"), show="headings")
        for col in ("Date", "Type", "Category", "Amount", "Balance"):
            self.tree.heading(col, text=col)
            self.tree.column(col, anchor="center", width=120)
        self.tree.pack(pady=10, fill="x")
        self.update_tree()

        # Charts
        chart_frame = tk.Frame(self.root, bg="#f0f8ff")
        chart_frame.pack(pady=10)
        tk.Button(chart_frame, text="📈 Balance Trend", bg="#4682b4", fg="white", command=self.show_balance_chart).grid(row=0, column=0, padx=5)
        tk.Button(chart_frame, text="🥧 Spending by Category", bg="#6a5acd", fg="white", command=self.show_category_chart).grid(row=0, column=1, padx=5)

        # AI Assistant
        self.ai_question = tk.Entry(self.root, font=("Arial", 12))
        self.ai_question.pack(pady=5, fill="x", padx=10)
        self.ai_question.insert(0, "Ask BudgetBuddy AI...")

        self.ai_btn = tk.Button(self.root, text="Ask AI 💬", bg="#1e90ff", fg="white", command=self.ask_ai)
        self.ai_btn.pack(pady=5)

        self.ai_response_label = tk.Label(self.root, text="", wraplength=700, justify="left", font=("Arial", 11), bg="#f0f8ff", fg="#00008b")
        self.ai_response_label.pack(pady=5)

    def add_income(self):
        try:
            amount = float(self.amount_entry.get())
            category = self.category_var.get()
            self.wallet.add_income(amount, category)
            storage.save_transactions(self.wallet.transactions)
            self.update_ui()
        except ValueError:
            messagebox.showerror("Error", "Please enter a valid amount")

    def add_expense(self):
        try:
            amount = float(self.amount_entry.get())
            category = self.category_var.get()
            self.wallet.add_expense(amount, category)
            storage.save_transactions(self.wallet.transactions)
            self.update_ui()
        except ValueError:
            messagebox.showerror("Error", "Please enter a valid amount")

    def remove_transaction(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a transaction to remove.")
            return
        index = self.tree.index(selected[0])
        self.wallet.transactions.pop(index)
        if self.wallet.transactions:
            self.wallet.balance = self.wallet.transactions[-1].balance
        else:
            self.wallet.balance = 0.0
        storage.save_transactions(self.wallet.transactions)
        self.update_ui()

    def update_ui(self):
        self.balance_label.config(text=f"Balance: ${self.wallet.get_balance():.2f}")
        self.update_tree()

    def update_tree(self):
        for i in self.tree.get_children():
            self.tree.delete(i)
        for t in self.wallet.transactions:
            self.tree.insert("", "end", values=(t.date, t.t_type, t.category, f"${t.amount:.2f}", f"${t.balance:.2f}"))

    def show_balance_chart(self):
        plot_balance_chart(self.wallet.transactions)

    def show_category_chart(self):
        plot_category_chart(self.wallet.transactions)

    def ask_ai(self):
        question = self.ai_question.get()
        tx_list = [{
            "date": t.date,
            "type": t.t_type,
            "category": t.category,
            "amount": t.amount,
            "balance": t.balance
        } for t in self.wallet.transactions]

        response = BudgetBuddyAI(tx_list, question)
        self.ai_response_label.config(text=response)


if __name__ == "__main__":
    root = tk.Tk()
    app = BudgetBuddyApp(root)
    root.mainloop()
