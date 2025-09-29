# ai_insights.py
# Conversational rule-based AI assistant with simple memory and predefined prompts

from typing import List, Dict
import random

# Predefined prompts to show as quick buttons (text -> prompt)
predefined_prompts = {
    "How can I save more this month?": "How can I save more this month?",
    "Do I spend too much on food?": "Do I spend too much on food?",
    "What's my biggest expense?": "What's my biggest expense category?",
    "Do I have an emergency fund?": "Do I have enough emergency fund?",
    "6-month balance projection": "Give me a 6-month balance projection.",
    "Suggest passive income": "Suggest passive income ideas."
}

class BudgetBuddyAI:
    def __init__(self):
        self.chat_history: List[Dict[str,str]] = []  # list of {"q":..., "a":...}

    def get_response(self, transactions: List[Dict], question: str) -> str:
        # transactions: list of dicts with keys date,type,category,amount,balance
        if not transactions:
            reply = "📭 I have no transaction data yet. Add transactions to get insights."
            self._remember(question, reply)
            return reply

        # Basic aggregates
        total_income = sum(t["amount"] for t in transactions if t["type"].lower() in ("income", "deposit"))
        total_expense = sum(t["amount"] for t in transactions if t["type"].lower() in ("expense", "withdrawal"))
        balance = transactions[-1]["balance"] if transactions else 0.0

        # category breakdown for expenses
        cat = {}
        for t in transactions:
            if t["type"].lower() in ("expense", "withdrawal"):
                c = t["category"] or "Other"
                cat[c] = cat.get(c, 0.0) + t["amount"]

        # helpers
        top_category = max(cat.items(), key=lambda kv: kv[1])[0] if cat else None
        top_amount = cat.get(top_category, 0.0) if top_category else 0.0
        avg_monthly_expense = self._estimate_monthly_expense(transactions, total_expense)

        q = question.lower().strip()

        # Intent rules
        if "save" in q or "how can i save" in q:
            advice = []
            if top_category:
                advice.append(f"Try reducing spending on {top_category} (${top_amount:.2f}).")
            advice.append("Automate a small transfer to savings each payday (start with 5-10%).")
            reply = "💡 " + " ".join(advice)

        elif "food" in q:
            spent = cat.get("Food", 0.0)
            pct = (spent / total_expense * 100) if total_expense > 0 else 0
            reply = f"🍔 You've spent ${spent:.2f} on Food, about {pct:.1f}% of your expenses."

        elif "biggest" in q or "biggest expense" in q or "what's my biggest expense" in q:
            if top_category:
                reply = f"📊 Biggest expense category: {top_category} (${top_amount:.2f})."
            else:
                reply = "📊 No expense categories found."

        elif "emergency" in q:
            target = avg_monthly_expense * 3
            if balance >= target:
                reply = f"✅ You have ~{balance:.2f}, which covers ~{balance/avg_monthly_expense if avg_monthly_expense>0 else 0:.1f} months of expenses."
            else:
                reply = f"🚨 Emergency fund is low. Aim for ~${target:.2f} (3 months). Start by saving ${max(10, (target-balance)/6):.2f}/month."

        elif "projection" in q or "6-month" in q or "future" in q:
            monthly_net = total_income - total_expense
            future_6 = balance + monthly_net * 6
            reply = f"📈 If nothing changes, in 6 months you would have about ${future_6:.2f} (monthly net ${monthly_net:.2f})."

        elif "passive" in q or "side hustle" in q:
            # provide tailored suggestions by income level
            if total_income < 1000:
                reply = "💡 Start small: sell digital templates, microtasks, or use micro-investment apps."
            elif total_income < 3000:
                reply = "📈 Consider freelancing a few hours a week or small dividend ETFs for passive income."
            else:
                reply = "🚀 You can scale to products (courses), dividend portfolios, or fund investments."

        else:
            # friendly generic answer using some context
            choices = [
                f"Your current balance is ${balance:.2f}. Try to keep expenses under ~70% of income.",
                f"Biggest expense is {top_category} (${top_amount:.2f}). Consider setting a monthly cap.",
                f"You saved ${(total_income - total_expense):.2f} this period. Keep it consistent!"
            ]
            reply = random.choice(choices)

        # remember and return (with small contextual hint)
        self._remember(question, reply)
        return self._attach_context(reply)

    def _estimate_monthly_expense(self, transactions, total_expense):
        # naive: count distinct months present, compute avg per month
        months = set()
        for t in transactions:
            months.add(t["date"][:7])  # YYYY-MM
        months_count = max(1, len(months))
        return total_expense / months_count

    def _remember(self, q, a):
        self.chat_history.append({"q": q, "a": a})
        # keep history limited
        if len(self.chat_history) > 20:
            self.chat_history.pop(0)

    def _attach_context(self, reply):
        if len(self.chat_history) >= 2:
            prev_q = self.chat_history[-2]["q"]
            return f"{reply}\n\n(Previously you asked: \"{prev_q}\")"
        return reply
