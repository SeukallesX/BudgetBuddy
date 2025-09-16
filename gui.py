# gui.py

import tkinter as tk
from tkinter import ttk, messagebox
from wallet import Wallet
import storage
import os
from PIL import Image, ImageTk  # for resizing logo

class BudgetBuddyGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("💳 BudgetBuddy Wallet")
        self.root.geometry("650x600")

        self.wallet = Wallet()
        self.wallet.transactions = storage.load_transactions()
        if self.wallet.transactions:
            self.wallet.balance = self.wallet.transactions[-1].balance

        self.theme = "light"

        self.create_widgets()
        self.apply_theme()

    def create_widgets(self):
        # Load and resize logo
        logo_path = os.path.join("assets", "wallet.png")
        if os.path.exists(logo_path):
            logo_image = Image.open(logo_path)
            logo_image = logo_image.resize((100, 100))  # Resize logo
            self.logo_img = ImageTk.PhotoImage(logo_image)

            self.logo_label = tk.Label(self.root, image=self.logo_img, bg="white")
            self.logo_label.pack(pady=10)

        # Balance Display
        self.balance_label = tk.Label(
            self.root,
            text=f"Balance: ${self.wallet.get_balance():.2f}",
            font=("Arial", 18, "bold")
        )
        self.balance_label.pack(pady=10)

        # Category Dropdown
        self.category_var = tk.StringVar()
        self.category_var.set("Other")
        categories = ["Food", "Rent", "Shopping", "Other"]
        self.category_menu = ttk.Combobox(
            self.root, textvariable=self.category_var,
            values=categories, state="readonly"
        )
        self.category_menu.pack(pady=5)

        # Amount Entry with placeholder
        self.amount_entry = tk.Entry(self.root, font=("Arial", 14), fg="grey")
        self.amount_entry.insert(0, "Enter amount")
        self.amount_entry.bind("<FocusIn>", self.clear_placeholder)
        self.amount_entry.bind("<FocusOut>", self.add_placeholder)
        self.amount_entry.pack(pady=5)

        # Buttons
        self.income_btn = tk.Button(self.root, text="➕ Add Income", command=self.add_income)
        self.income_btn.pack(pady=5)

        self.expense_btn = tk.Button(self.root, text="➖ Add Expense", command=self.add_expense)
        self.expense_btn.pack(pady=5)

        # Transaction Table
        style = ttk.Style()
        style.configure("Treeview", rowheight=25)
        self.tree = ttk.Treeview(
            self.root,
            columns=("Date", "Type", "Category", "Amount", "Balance"),
            show="headings"
        )
        for col in ("Date", "Type", "Category", "Amount", "Balance"):
            self.tree.heading(col, text=col)
            self.tree.column(col, anchor="center", width=120)
        self.tree.pack(pady=10, fill="x")

        self.update_tree()

        # Theme Toggle
        self.theme_btn = tk.Button(self.root, text="🌙 Dark Mode", command=self.toggle_theme)
        self.theme_btn.pack(pady=10)

    # ---------------------
    # PLACEHOLDER HANDLING
    # ---------------------
    def clear_placeholder(self, event):
        if self.amount_entry.get() == "Enter amount":
            self.amount_entry.delete(0, tk.END)
            self.amount_entry.config(fg="black")

    def add_placeholder(self, event):
        if not self.amount_entry.get():
            self.amount_entry.insert(0, "Enter amount")
            self.amount_entry.config(fg="grey")

    # ---------------------
    # TRANSACTION LOGIC
    # ---------------------
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

    def update_ui(self):
        self.balance_label.config(text=f"Balance: ${self.wallet.get_balance():.2f}")
        self.update_tree()
        self.amount_entry.delete(0, tk.END)
        self.add_placeholder(None)

    def update_tree(self):
        for i in self.tree.get_children():
            self.tree.delete(i)
        for t in self.wallet.transactions:
            self.tree.insert("", "end", values=(
                t.date, t.t_type, t.category, f"${t.amount:.2f}", f"${t.balance:.2f}"
            ))

    # ---------------------
    # THEME HANDLING
    # ---------------------
    def toggle_theme(self):
        self.theme = "dark" if self.theme == "light" else "light"
        self.apply_theme()

    def apply_theme(self):
        if self.theme == "light":
            bg, fg, balance_fg = "white", "black", "green"
            btn_bg, btn_fg = "lightgray", "black"
            self.theme_btn.config(text="🌙 Dark Mode")
        else:
            bg, fg, balance_fg = "#1e1e1e", "white", "cyan"
            btn_bg, btn_fg = "#333", "white"
            self.theme_btn.config(text="🌞 Light Mode")

        self.root.configure(bg=bg)

        if hasattr(self, "logo_label"):
            self.logo_label.config(bg=bg)

        self.balance_label.config(bg=bg, fg=balance_fg)
        self.income_btn.config(bg=btn_bg, fg=btn_fg)
        self.expense_btn.config(bg=btn_bg, fg=btn_fg)
        self.theme_btn.config(bg=btn_bg, fg=btn_fg)

        self.amount_entry.config(
            bg="white" if self.theme == "light" else "#333",
            fg="black" if self.theme == "light" else "white",
            insertbackground=fg
        )

        # Treeview theme
        style = ttk.Style()
        style.theme_use("default")
        style.configure(
            "Treeview",
            background=bg,
            foreground=fg,
            fieldbackground=bg,
            rowheight=25
        )
        style.configure("Treeview.Heading", background=btn_bg, foreground=btn_fg)
