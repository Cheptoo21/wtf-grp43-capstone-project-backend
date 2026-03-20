import Transaction from '../models/Transaction.js';
import { normalizeItem } from '../utils/normalizeItem.js';

export const addTransaction = async (req, res) => {
  try {
    const { rawText, transactionType, item, amount, date, currency } = req.body;

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
      quantity: req.body.quantity,
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const search = req.query.search?.trim();

    let  query = {user: req.user.id}

    if (type && type !== "all") {
      query.transactionType = type
    }

    if (search) {
      query.$or = [
        {item: {$regex: search, $options: "i"}}
      ]
    }
    const transactions = await Transaction
    .find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.status(200).json({ success: true, count: transactions.length, transactions, total, page, totalPages: Math.ceil(total/limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await transaction.deleteOne();
    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getDailySummary = async (req, res) => {
  try {
    const now = new Date();
    const startToday = new Date(now.setHours(0, 0, 0, 0));
    const endToday = new Date(now.setHours(23, 59, 59, 999));

    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const endYesterday = new Date(endToday);
    endYesterday.setDate(endYesterday.getDate() - 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTransactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthlyRevenue = monthTransactions
      .filter((t) => t.transactionType === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const itemSalesCount = {};
    monthTransactions.forEach((t) => {
      if (t.transactionType === 'sale') {
        const key = normalizeItem(t.item.toLowerCase());
        itemSalesCount[key] = (itemSalesCount[key] || 0) + t.quantity;
      }
    });
    
    const topSellingItems = Object.entries(itemSalesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));
    const topSellingItem = topSellingItems.length > 0 ? topSellingItems[0].item : null; 
    console.log(topSellingItem)   

    const todayTransactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: startToday, $lte: endToday },
    });
    const yesterdayTransactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: startYesterday, $lte: endYesterday },
    });
    const firstTransaction = await Transaction.findOne({ user: req.user.id }).sort({ date: 1 });
    const currency = firstTransaction ? firstTransaction.currency : 'NGN';

    const calculateProfit = (transactions) => {
      const sales = transactions
        .filter((t) => t.transactionType === 'sale')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter((t) => t.transactionType === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return sales - expenses;
    };
    const todayProfit = calculateProfit(todayTransactions);
    const yesterdayProfit = calculateProfit(yesterdayTransactions);
    const profitChange = yesterdayProfit === 0 || todayProfit === 0 ? 0 : ((todayProfit - yesterdayProfit) / Math.abs(yesterdayProfit)) * 100;
    res.status(200).json({
      success: true,
      data: {
        todayProfit,
        yesterdayProfit,
        currency,
        monthlyRevenue,
        topSellingItem,
        profitChange: profitChange !== null ? profitChange.toFixed(2) : 0.00,
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    if (transactions.length === 0) {
      const emptyAnalytics = {
      topSellingItems: [],
      topExpenses: [],
      transactionsByDayOfWeek: Object.fromEntries(days.map(d => [d, 0])),
      topItemByDayOfWeek: Object.fromEntries(days.map(d => [d, null])),
      monthlyBreakdown: {},
      monthlySales: [],
      totalSales: 0,
      totalExpenses: 0,
      totalProfit: 0,
    };
      return res.status(200).json({ success: true, analytics: emptyAnalytics });
    }
    const sales = transactions.filter((t) => t.transactionType === "sale");
    const expenses = transactions.filter((t) => t.transactionType === "expense");

    const itemSalesCount = {};
    sales.forEach((t) => {
      if (t.transactionType === 'sale') {
        const key = normalizeItem(t.item.toLowerCase());
        itemSalesCount[key] = (itemSalesCount[key] || 0) + t.quantity;
      }
    });
    
    const topSellingItems = Object.entries(itemSalesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));
    const topSellingItem = topSellingItems.length > 0 ? topSellingItems[0].item : null;    

    const expenseCount = {};
    expenses.forEach((t) => {
      const key = normalizeItem(t.item.toLowerCase());
      expenseCount[key] = (expenseCount[key] || 0) + 1;
    });

    const topExpenses = Object.entries(expenseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const byDayOfWeek = {};
    days.forEach((d) => (byDayOfWeek[d] = 0));

    transactions.forEach((t) => {
      const day = days[new Date(t.date).getDay()];
      byDayOfWeek[day]++;
    });

    const itemsByDay = {};
    days.forEach((d) => (itemsByDay[d] = {}));

    sales.forEach((t) => {
      const day = days[new Date(t.date).getDay()];
      const item = normalizeItem(t.item.toLowerCase());
      itemsByDay[day][item] = (itemsByDay[day][item] || 0) + 1;
    });

    const topItemByDay = {};
    days.forEach((day) => {
      const items = itemsByDay[day];

      if (Object.keys(items).length > 0) {
        const [item, count] = Object.entries(items).sort((a, b) => b[1] - a[1])[0];
        topItemByDay[day] = { item, count };
      } else {
        topItemByDay[day] = null;
      }
    });

    const monthlyBreakdown = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);

      // better key for sorting
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = {
          sales: 0,
          expenses: 0,
          profit: 0,
          date: new Date(d.getFullYear(), d.getMonth()),
        };
      }

      if (t.transactionType === "sale") {
        monthlyBreakdown[key].sales += t.amount;
      } else {
        monthlyBreakdown[key].expenses += t.amount;
      }

      monthlyBreakdown[key].profit =
        monthlyBreakdown[key].sales - monthlyBreakdown[key].expenses;
    });

    const monthlySales = Object.values(monthlyBreakdown)
      .sort((a, b) => a.date - b.date)
      .map((m) => ({
        month: m.date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        sales: m.sales,
      }));

    const formattedMonthlyBreakdown = {};

    Object.values(monthlyBreakdown).forEach((m) => {
      const label = m.date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      formattedMonthlyBreakdown[label] = {
        sales: m.sales,
        expenses: m.expenses,
        profit: m.profit,
      };
    });

    let analytics = {
        topSellingItems,
        topExpenses,
        transactionsByDayOfWeek: byDayOfWeek,
        topItemByDayOfWeek: topItemByDay,
        monthlyBreakdown: formattedMonthlyBreakdown,
        monthlySales, 
      }

      if (transactions.length === 0) {
        analytics= {
          topSellingItems: [],
          topExpenses: [],
          transactionsByDayOfWeek: {},
          topItemByDayOfWeek: {},
          monthlyBreakdown: {},
          monthlySales: [],
          totalSales: 0,
          totalExpenses: 0,
          totalProfit: 0,
        };
      }

    res.status(200).json({
      success: true,
      analytics: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};