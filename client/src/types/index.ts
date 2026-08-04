export type Role = 'USER' | 'ADMIN';
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'LOAN';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type SubscriptionCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  currency: string;
  theme: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  accountNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  merchant?: string;
  status: 'PENDING' | 'COMPLETED';
  isRecurring?: boolean;
  account?: Account;
  category?: Category;
}

export interface Subscription {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  provider: string;
  amount: number;
  billingCycle: SubscriptionCycle;
  nextBillingDate: string;
  status: SubscriptionStatus;
  category?: Category;
  reminderDaysBefore?: number;
  daysRemaining?: number;
  monthlyCost?: number;
  annualCost?: number;
  dueStatus?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'MONTHLY' | 'YEARLY';
  category: Category;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status?: 'HEALTHY' | 'NEAR_LIMIT' | 'OVER_BUDGET';
  isExceeded: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  color: string;
  status: 'IN_PROGRESS' | 'ACHIEVED' | 'CANCELLED';
  percentage?: number;
  remainingAmount?: number;
  daysRemaining?: number;
  remainingMonths?: number;
  monthlySavingsNeeded?: number;
  projectionStatus?: 'Completed' | 'Ahead of Schedule' | 'On Track' | 'Behind Schedule';
  isCompleted?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'BUDGET_ALERT' | 'BILL_DUE' | 'ANOMALY' | 'SYSTEM';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: 'ANOMALY' | 'ADVICE' | 'SAVING_TIP';
  scoreImpact: number;
  read: boolean;
  createdAt: string;
}

export interface HealthScore {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: {
    savingsRateScore: number;
    savingsRatePercentage: number;
    budgetAdherenceScore: number;
    budgetAdherencePercentage: number;
    debtRatioScore: number;
    debtRatioPercentage: number;
    emergencyFundScore: number;
    monthsCovered: number;
    investmentRatioScore: number;
    investmentRatioPercentage: number;
  };
  recommendations: string[];
}

export interface DashboardSummary {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  savingsRate: number;
  activeAccountsCount: number;
  monthlySubscriptionSpend?: number;
  annualSubscriptionSpend?: number;
  latestTransactions: Transaction[];
  topSpendingCategories: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    totalSpent: number;
  }>;
  largestExpense?: Transaction | null;
  largestIncome?: Transaction | null;
  goalsSummary?: {
    totalGoalValue: number;
    totalGoalSaved: number;
    overallGoalProgress: number;
    activeGoalsCount: number;
    completedGoalsCount: number;
  };
  kpi: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netSavings: number;
    savingsRate: number;
    activeAccountsCount?: number;
  };
  healthScore: HealthScore;
  netWorthTrend: Array<{ month: string; netWorth: number }>;
  upcomingBills: Array<{
    id: string;
    name: string;
    provider: string;
    amount: number;
    dueDate: string;
    category: string;
    color: string;
    daysRemaining: number;
  }>;
  subscriptionRenewals: Array<any>;
  budgetBurnRate: Array<{
    id: string;
    category: string;
    color: string;
    icon: string;
    allocated: number;
    spent: number;
    percentage: number;
  }>;
  savingsGoalProgress: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    color: string;
    percentage: number;
  }>;
  spendingHeatmap: Array<{ day: string; amount: number }>;
  recentActivity: Transaction[];
  notifications: NotificationItem[];
}
