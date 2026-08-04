import { prisma } from '../config/db';

export interface FinancialHealthBreakdown {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: {
    savingsRateScore: number;       // Weight 25%
    savingsRatePercentage: number;
    budgetAdherenceScore: number;   // Weight 25%
    budgetAdherencePercentage: number;
    debtRatioScore: number;         // Weight 20%
    debtRatioPercentage: number;
    emergencyFundScore: number;     // Weight 15%
    monthsCovered: number;
    investmentRatioScore: number;   // Weight 15%
    investmentRatioPercentage: number;
  };
  recommendations: string[];
}

export class FinancialHealthService {
  static async calculateHealthScore(userId: string): Promise<FinancialHealthBreakdown> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Fetch Accounts
    const accounts = await prisma.account.findMany({ where: { userId } });
    let totalAssets = 0;
    let totalLiabilities = 0;
    let liquidCash = 0;
    let investments = 0;

    for (const acc of accounts) {
      if (acc.type === 'LOAN' || acc.type === 'CREDIT_CARD') {
        if (acc.balance > 0) {
          totalLiabilities += acc.balance;
        } else {
          totalAssets += Math.abs(acc.balance);
        }
      } else if (acc.type === 'INVESTMENT') {
        investments += Math.max(0, acc.balance);
        totalAssets += Math.max(0, acc.balance);
      } else {
        liquidCash += Math.max(0, acc.balance);
        totalAssets += Math.max(0, acc.balance);
      }
    }

    // 2. Fetch 30-Day Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const tx of recentTransactions) {
      if (tx.type === 'INCOME') monthlyIncome += tx.amount;
      else if (tx.type === 'EXPENSE') monthlyExpenses += tx.amount;
    }

    // Default minimum monthly baseline if no recent income/expense
    const effectiveIncome = Math.max(monthlyIncome, 1);
    const effectiveExpenses = Math.max(monthlyExpenses, 1);

    // --- Factor 1: Savings Rate (Weight 25%) ---
    const netSavings = monthlyIncome - monthlyExpenses;
    const savingsRate = Math.max(0, netSavings / effectiveIncome);
    // 30% savings rate = 100 points
    const savingsRateScore = Math.min(100, Math.round((savingsRate / 0.30) * 100));

    // --- Factor 2: Budget Adherence (Weight 25%) ---
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    let withinBudgetCount = 0;
    if (budgets.length > 0) {
      for (const b of budgets) {
        const spent = recentTransactions
          .filter((t) => t.categoryId === b.categoryId && t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);
        if (spent <= b.amount) withinBudgetCount++;
      }
    }
    const budgetAdherencePercentage = budgets.length > 0
      ? (withinBudgetCount / budgets.length) * 100
      : 85; // Default if no budgets set yet
    const budgetAdherenceScore = Math.round(budgetAdherencePercentage);

    // --- Factor 3: Debt Ratio (Weight 20%) ---
    const totalCapital = totalAssets + totalLiabilities;
    const debtRatioPercentage = totalCapital > 0 ? (totalLiabilities / totalCapital) * 100 : 0;
    // Debt ratio <= 10% = 100 pts, >= 70% = 0 pts
    let debtRatioScore = 100;
    if (debtRatioPercentage > 10) {
      debtRatioScore = Math.max(0, Math.round(100 - ((debtRatioPercentage - 10) / 60) * 100));
    }

    // --- Factor 4: Emergency Fund Ratio (Weight 15%) ---
    const monthsCovered = liquidCash / (effectiveExpenses || 1);
    // 6 months covered = 100 pts
    const emergencyFundScore = Math.min(100, Math.round((monthsCovered / 6) * 100));

    // --- Factor 5: Investment Ratio (Weight 15%) ---
    const netWorth = Math.max(1, totalAssets - totalLiabilities);
    const investmentRatioPercentage = (investments / netWorth) * 100;
    // 25% investment ratio = 100 pts
    const investmentRatioScore = Math.min(100, Math.round((investmentRatioPercentage / 25) * 100));

    // --- Calculate Composite Score ---
    const totalScore = Math.round(
      savingsRateScore * 0.25 +
      budgetAdherenceScore * 0.25 +
      debtRatioScore * 0.20 +
      emergencyFundScore * 0.15 +
      investmentRatioScore * 0.15
    );

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 60) grade = 'C';
    else if (totalScore >= 50) grade = 'D';
    else grade = 'F';

    const recommendations: string[] = [];
    if (savingsRateScore < 70) {
      recommendations.push('Increase your monthly net savings rate toward 20%-30% to build wealth faster.');
    }
    if (emergencyFundScore < 70) {
      recommendations.push(`Liquid cash covers ${monthsCovered.toFixed(1)} months of expenses. Target 3-6 months in savings.`);
    }
    if (debtRatioScore < 70) {
      recommendations.push('High debt ratio detected. Focus on paying down high-interest credit card balance.');
    }
    if (budgetAdherenceScore < 80) {
      recommendations.push('Several category budgets were exceeded this month. Review high-spend merchant transactions.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Outstanding financial health! Maintain current asset allocation and savings discipline.');
    }

    return {
      totalScore,
      grade,
      metrics: {
        savingsRateScore,
        savingsRatePercentage: Math.round(savingsRate * 100),
        budgetAdherenceScore,
        budgetAdherencePercentage: Math.round(budgetAdherencePercentage),
        debtRatioScore,
        debtRatioPercentage: Math.round(debtRatioPercentage),
        emergencyFundScore,
        monthsCovered: Number(monthsCovered.toFixed(1)),
        investmentRatioScore,
        investmentRatioPercentage: Math.round(investmentRatioPercentage),
      },
      recommendations,
    };
  }
}
