import Transaction from '../models/Transaction.js';

// ─── Add a transaction ───────────────────────────────────────────
// The frontend AI already parsed the input — backend just saves it
// POST /api/transactions
export const addTransaction = async (req, res) => {
  try {
    const { rawText, transactionType, item, amount, date, currency } = req.body;

    // Validate required fields
    if (!transactionType || !item || !amount) {
      return res.status(400).json({
        success: false,
        message: 'transactionType, item, and amount are required',
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      rawText,
      transactionType,
      item,
      amount,
      date: date || Date.now(),
      currency: currency || 'NGN',
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get all transactions for logged-in user ─────────────────────
// GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });

    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete a transaction ─────────────────────────────────────────
// DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Make sure user owns this transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await transaction.deleteOne();
    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Profit Summary ───────────────────────────────────────────────
// GET /api/transactions/summary
export const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    const totalSales = transactions
      .filter((t) => t.transactionType === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = totalSales - totalExpenses;

    res.status(200).json({
      success: true,
      summary: {
        totalSales,
        totalExpenses,
        profit,
        totalTransactions: transactions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Analytics ────────────────────────────────────────────────────
// GET /api/transactions/analytics
export const getAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    if (transactions.length === 0) {
      return res.status(200).json({ success: true, analytics: {} });
    }

    const sales = transactions.filter((t) => t.transactionType === 'sale');
    const expenses = transactions.filter((t) => t.transactionType === 'expense');

    // ── 1. Most sold items ──────────────────────────────────────
    const itemSalesCount = {};
    sales.forEach((t) => {
      const key = t.item.toLowerCase();
      itemSalesCount[key] = (itemSalesCount[key] || 0) + 1;
    });
    const topSellingItems = Object.entries(itemSalesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));

    // ── 2. Most common expenses ─────────────────────────────────
    const expenseCount = {};
    expenses.forEach((t) => {
      const key = t.item.toLowerCase();
      expenseCount[key] = (expenseCount[key] || 0) + 1;
    });
    const topExpenses = Object.entries(expenseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));

    // ── 3. Transactions by day of week ──────────────────────────
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const byDayOfWeek = {};
    days.forEach((d) => (byDayOfWeek[d] = 0));
    transactions.forEach((t) => {
      const day = days[new Date(t.date).getDay()];
      byDayOfWeek[day]++;
    });

    // ── 4. Most requested item per day of week (sales only) ────
    const itemsByDay = {};
    days.forEach((d) => (itemsByDay[d] = {}));
    sales.forEach((t) => {
      const day = days[new Date(t.date).getDay()];
      const item = t.item.toLowerCase();
      itemsByDay[day][item] = (itemsByDay[day][item] || 0) + 1;
    });
    const topItemByDay = {};
    days.forEach((day) => {
      const items = itemsByDay[day];
      if (Object.keys(items).length > 0) {
        const top = Object.entries(items).sort((a, b) => b[1] - a[1])[0];
        topItemByDay[day] = { item: top[0], count: top[1] };
      } else {
        topItemByDay[day] = null;
      }
    });

    // ── 5. Monthly breakdown ────────────────────────────────────
    const monthlyBreakdown = {};
    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { sales: 0, expenses: 0, profit: 0 };
      }
      if (t.transactionType === 'sale') {
        monthlyBreakdown[month].sales += t.amount;
      } else {
        monthlyBreakdown[month].expenses += t.amount;
      }
      monthlyBreakdown[month].profit =
        monthlyBreakdown[month].sales - monthlyBreakdown[month].expenses;
    });

    res.status(200).json({
      success: true,
      analytics: {
        topSellingItems,
        topExpenses,
        transactionsByDayOfWeek: byDayOfWeek,
        topItemByDayOfWeek: topItemByDay,
        monthlyBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};