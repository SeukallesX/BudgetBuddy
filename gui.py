# gui.py
import tkinter as tk
from tkinter import ttk, messagebox
from tkcalendar import DateEntry  # pip install tkcalendar
from datetime import datetime
from collections import Counter
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt

from data_handler import load_expenses, save_expenses, filter_expenses
from charts import plot_pie_chart
from utils import format_currency

class BudgetBuddyGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("💰 BudgetBuddy Advanced")
        self.root.geometry("900x700")
        self.root.configure(bg="#f0f8ff")  # Light pastel background

        self.expenses = load_expenses()
        self.create_widgets()
        self.update_tree()

    def create_widgets(self):
        # ---- Header ----
        header = tk.Label(self.root, text="BudgetBuddy", font=("Comic Sans MS", 28, "bold"), bg="#f0f8ff", fg="#2e8b57")
        header.grid(row=0, column=0, columnspan=4, pady=10)

        # ---- Input Frame ----
        input_frame = tk.Frame(self.root, bg="#e6f2ff", padx=10, pady=10, relief=tk.RIDGE, bd=2)
        input_frame.grid(row=1, column=0, columnspan=2, padx=10, pady=5, sticky="nsew")

        tk.Label(input_frame, text="Date:", bg="#e6f2ff").grid(row=0, column=0, sticky="e")
        self.date_entry = DateEntry(input_frame, width=12, background='darkblue', foreground='white', borderwidth=2)
        self.date_entry.grid(row=0, column=1, padx=5, pady=2)

        tk.Label(input_frame, text="Amount:", bg="#e6f2ff").grid(row=1, column=0, sticky="e")
        self.amount_entry = tk.Entry(input_frame)
        self.amount_entry.grid(row=1, column=1, padx=5, pady=2)

        tk.Label(input_frame, text="Category:", bg="#e6f2ff").grid(row=2, column=0, sticky="e")
        self.category_entry = tk.Entry(input_frame)
        self.category_entry.grid(row=2, column=1, padx=5, pady=2)

        tk.Label(input_frame, text="Description:", bg="#e6f2ff").grid(row=3, column=0, sticky="e")
        self.desc_entry = tk.Entry(input_frame)
        self.desc_entry.grid(row=3, column=1, padx=5, pady=2)

        add_btn = tk.Button(input_frame, text="➕ Add Expense", command=self.add_expense, bg="#2e8b57", fg="white", font=("Arial", 10, "bold"))
        add_btn.grid(row=4, column=0, columnspan=2, pady=5, sticky="ew")

        chart_btn = tk.Button(input_frame, text="📊 Show Pie Chart", command=self.show_pie_chart, bg="#ff8c00", fg="white", font=("Arial", 10, "bold"))
        chart_btn.grid(row=5, column=0, columnspan=2, pady=5, sticky="ew")

        # ---- Filter Frame ----
        filter_frame = tk.Frame(self.root, bg="#fff0f5", padx=10, pady=10, relief=tk.RIDGE, bd=2)
        filter_frame.grid(row=1, column=2, columnspan=2, padx=10, pady=5, sticky="nsew")

        tk.Label(filter_frame, text="Filter Category:", bg="#fff0f5").grid(row=0, column=0, sticky="e")
        self.filter_category_entry = tk.Entry(filter_frame)
        self.filter_category_entry.grid(row=0, column=1, padx=5, pady=2)

        tk.Label(filter_frame, text="Filter Date:", bg="#fff0f5").grid(row=1, column=0, sticky="e")
        self.filter_date_entry = DateEntry(filter_frame, width=12, background='darkblue', foreground='white', borderwidth=2)
        self.filter_date_entry.grid(row=1, column=1, padx=5, pady=2)

        apply_btn = tk.Button(filter_frame, text="🔍 Apply Filters", command=self.apply_filters, bg="#8a2be2", fg="white", font=("Arial", 10, "bold"))
        apply_btn.grid(row=2, column=0, columnspan=2, pady=5, sticky="ew")

        reset_btn = tk.Button(filter_frame, text="♻️ Reset Filters", command=self.reset_filters, bg="#dc143c", fg="white", font=("Arial", 10, "bold"))
        reset_btn.grid(row=3, column=0, columnspan=2, pady=5, sticky="ew")

        # ---- Expense Table ----
        self.tree = ttk.Treeview(self.root, columns=("ID", "Date", "Amount", "Category", "Description"), show="headings", height=15)
        for col in ("ID", "Date", "Amount", "Category", "Description"):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=140)
        self.tree.grid(row=2, column=0, columnspan=4, padx=10, pady=10, sticky="nsew")

        # ---- Style ----
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Treeview", font=("Helvetica", 10), rowheight=25)
        style.configure("Treeview.Heading", font=("Helvetica", 12, "bold"))

        # ---- Dashboard Frame ----
        self.dashboard_frame = tk.Frame(self.root, bg="#fafad2", padx=10, pady=10, relief=tk.RIDGE, bd=2)
        self.dashboard_frame.grid(row=3, column=0, columnspan=4, padx=10, pady=5, sticky="nsew")

        self.total_today_label = tk.Label(self.dashboard_frame, text="Total Today: $0.00", font=("Arial", 12, "bold"), bg="#fafad2", fg="#2f4f4f")
        self.total_today_label.grid(row=0, column=0, padx=10, pady=5)

        self.total_month_label = tk.Label(self.dashboard_frame, text="Total This Month: $0.00", font=("Arial", 12, "bold"), bg="#fafad2", fg="#2f4f4f")
        self.total_month_label.grid(row=0, column=1, padx=10, pady=5)

        self.top_categories_label = tk.Label(self.dashboard_frame, text="Top Categories: N/A", font=("Arial", 12, "bold"), bg="#fafad2", fg="#2f4f4f")
        self.top_categories_label.grid(row=1, column=0, columnspan=2, padx=10, pady=5)

        # ---- Category Bar Chart Frame ----
        self.chart_frame = tk.Frame(self.root, bg="#fafad2")
        self.chart_frame.grid(row=4, column=0, columnspan=4, padx=10, pady=5, sticky="nsew")

    # ---------- Functions ----------
    def add_expense(self):
        try:
            amount = float(self.amount_entry.get())
        except ValueError:
            messagebox.showerror("Error", "Invalid amount")
            return
        date = self.date_entry.get()
        category = self.category_entry.get()
        description = self.desc_entry.get()
        self.expenses.append({"date": date, "amount": amount, "category": category, "description": description})
        save_expenses(self.expenses)
        self.update_tree()
        self.amount_entry.delete(0, tk.END)
        self.category_entry.delete(0, tk.END)
        self.desc_entry.delete(0, tk.END)
        messagebox.showinfo("Success", "Expense added!")

    def update_tree(self, filtered_expenses=None):
        for row in self.tree.get_children():
            self.tree.delete(row)
        data = filtered_expenses if filtered_expenses is not None else self.expenses
        for i, exp in enumerate(data, start=1):
            self.tree.insert("", tk.END, values=(i, exp["date"], format_currency(exp["amount"]), exp["category"], exp["description"]))

        # Update dashboard and chart
        self.update_dashboard()
        self.update_category_chart()

    def show_pie_chart(self):
        plot_pie_chart(self.expenses)

    def apply_filters(self):
        cat = self.filter_category_entry.get()
        date = self.filter_date_entry.get()
        filtered = filter_expenses(self.expenses, category=cat if cat else None, date=date if date else None)
        self.update_tree(filtered_expenses=filtered)

    def reset_filters(self):
        self.filter_category_entry.delete(0, tk.END)
        self.filter_date_entry.set_date(datetime.today())
        self.update_tree()

    # ---------- Dashboard & Charts ----------
    def update_dashboard(self):
        today_str = datetime.today().strftime("%Y-%m-%d")
        month_str = datetime.today().strftime("%Y-%m")

        total_today = sum(exp["amount"] for exp in self.expenses if exp["date"] == today_str)
        total_month = sum(exp["amount"] for exp in self.expenses if exp["date"].startswith(month_str))

        category_counter = Counter()
        for exp in self.expenses:
            category_counter[exp["category"]] += exp["amount"]
        top3 = category_counter.most_common(3)
        top3_text = ", ".join([f"{cat}: ${amt:.2f}" for cat, amt in top3]) if top3 else "N/A"

        self.total_today_label.config(text=f"Total Today: ${total_today:.2f}")
        self.total_month_label.config(text=f"Total This Month: ${total_month:.2f}")
        self.top_categories_label.config(text=f"Top Categories: {top3_text}")

    def update_category_chart(self):
        # Clear previous chart
        for widget in self.chart_frame.winfo_children():
            widget.destroy()

        category_counter = Counter()
        for exp in self.expenses:
            category_counter[exp["category"]] += exp["amount"]

        if not category_counter:
            return  # nothing to plot

        categories = list(category_counter.keys())
        amounts = list(category_counter.values())

        fig, ax = plt.subplots(figsize=(7, 3))
        ax.bar(categories, amounts, color="#2e8b57")
        ax.set_title("Spending by Category")
        ax.set_ylabel("Amount ($)")
        ax.set_xlabel("Category")
        ax.tick_params(axis='x', rotation=45)

        canvas = FigureCanvasTkAgg(fig, master=self.chart_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
