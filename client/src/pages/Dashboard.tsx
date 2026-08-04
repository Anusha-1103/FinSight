import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  ShieldCheck,
  Calendar,
  Flame,
  Target,
  Activity,
  Layers,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DashboardSummary } from '../types';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { DailyReflectionWidget } from '../components/dashboard/DailyReflectionWidget';

export const Dashboard: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    },
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-100">Failed to Load Dashboard</h3>
          <p className="text-xs text-slate-400">
            {(error as any)?.response?.data?.error || 'Unable to fetch financial metrics from database.'}
          </p>
        </div>
        <Button size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </Card>
    );
  }

  const {
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    cashFlow,
    savingsRate,
    activeAccountsCount,
    latestTransactions = [],
    topSpendingCategories = [],
    largestExpense,
    largestIncome,
    healthScore,
    netWorthTrend = [],
    upcomingBills = [],
    budgetBurnRate = [],
    savingsGoalProgress = [],
    spendingHeatmap = [],
  } = data;

  const hasNoData = activeAccountsCount === 0 && latestTransactions.length === 0;

  return (
    <div className="space-y-6">
      {/* Daily Reflection Engine */}
      {healthScore && (
        <DailyReflectionWidget
          score={healthScore.totalScore}
          grade={healthScore.grade}
          recommendation={healthScore.recommendations?.[0] || 'Keep optimizing your portfolio savings.'}
        />
      )}

      {/* Empty State Banner if no active accounts */}
      {hasNoData && (
        <Card className="p-8 border-indigo-500/30 bg-indigo-950/10 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-100">Welcome to FinSight AI</h3>
            <p className="text-xs text-slate-400">
              Link your checking, savings, or credit accounts to start computing live net worth and tracking monthly cash flow.
            </p>
          </div>
        </Card>
      )}

      {/* 6 Key PostgreSQL KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Net Worth */}
        <Card hoverable className="border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Worth</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono">{formatCurrency(netWorth)}</h3>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> Assets minus liabilities
            </p>
          </div>
        </Card>

        {/* Monthly Income */}
        <Card hoverable className="border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono">{formatCurrency(monthlyIncome)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">30-day inflows</p>
          </div>
        </Card>

        {/* Monthly Expenses */}
        <Card hoverable className="border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono">{formatCurrency(monthlyExpenses)}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">30-day outflows</p>
          </div>
        </Card>

        {/* Net Cash Flow */}
        <Card hoverable className="border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cash Flow</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-xl font-extrabold tracking-tight font-mono ${cashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(cashFlow)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Income minus expenses</p>
          </div>
        </Card>

        {/* Savings Rate */}
        <Card hoverable className="border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Savings Rate</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono">{savingsRate}%</h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Target: &gt; 25%</p>
          </div>
        </Card>

        {/* Active Accounts Count */}
        <Card hoverable className="border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Accounts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono">{activeAccountsCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Linked portfolios</p>
          </div>
        </Card>
      </div>

      {/* Row 2: Net Worth Growth Trajectory Chart & Financial Health Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-100">Net Worth Growth Trajectory</h3>
              <p className="text-xs text-slate-400">6-month portfolio assets accumulation</p>
            </div>
            <Badge variant="success">+18.5% YTD</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Net Worth']} />
                <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {healthScore && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Financial Health Index
              </h3>
              <Badge variant="purple">{healthScore.grade} Rating</Badge>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="54" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={339}
                    strokeDashoffset={339 - (339 * healthScore.totalScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white font-mono">{healthScore.totalScore}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">/ 100 Pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Savings Rate Score</span>
                <span className="font-bold text-slate-200">{healthScore.metrics.savingsRateScore}/100</span>
              </div>
              <Progress value={healthScore.metrics.savingsRateScore} color="bg-emerald-500" size="sm" />

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Budget Adherence Score</span>
                <span className="font-bold text-slate-200">{healthScore.metrics.budgetAdherenceScore}/100</span>
              </div>
              <Progress value={healthScore.metrics.budgetAdherenceScore} color="bg-indigo-500" size="sm" />
            </div>
          </Card>
        )}
      </div>

      {/* Row 3: Top 5 Spending Categories & Largest Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top 5 Spending Categories */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Top 5 Spending Categories
            </h3>
            <span className="text-xs text-slate-400 font-mono">30 Days</span>
          </div>

          {topSpendingCategories.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No expense transactions recorded this month.</p>
          ) : (
            <div className="space-y-3.5">
              {topSpendingCategories.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-slate-200 font-bold font-mono">{formatCurrency(cat.totalSpent)}</span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round((cat.totalSpent / (monthlyExpenses || 1)) * 100))}
                    color="bg-indigo-500"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Largest Single Expense Record */}
        <Card className="space-y-4 border-rose-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
              Largest Single Expense
            </h3>
            <Badge variant="danger">Peak Outflow</Badge>
          </div>
          {largestExpense ? (
            <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-base font-extrabold text-white">{largestExpense.description}</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{largestExpense.merchant || largestExpense.category?.name}</span>
                <span className="font-extrabold text-rose-400 font-mono text-lg">
                  -{formatCurrency(largestExpense.amount)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Account: {largestExpense.account?.name}</span>
                <span>{formatDate(largestExpense.date)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No expense transactions found.</p>
          )}
        </Card>

        {/* Largest Single Income Record */}
        <Card className="space-y-4 border-emerald-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Largest Single Income
            </h3>
            <Badge variant="success">Peak Inflow</Badge>
          </div>
          {largestIncome ? (
            <div className="space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-base font-extrabold text-white">{largestIncome.description}</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{largestIncome.merchant || largestIncome.category?.name}</span>
                <span className="font-extrabold text-emerald-400 font-mono text-lg">
                  +{formatCurrency(largestIncome.amount)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Account: {largestIncome.account?.name}</span>
                <span>{formatDate(largestIncome.date)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No income transactions found.</p>
          )}
        </Card>
      </div>

      {/* Row 4: Latest 10 Transactions Table & Spending Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Day-of-Week Heatmap
            </h3>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingHeatmap}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Latest Transactions</h3>
              <p className="text-xs text-slate-400">Most recent 10 database records</p>
            </div>
            <span className="text-xs text-indigo-400 font-medium">View Full Ledger →</span>
          </div>

          {latestTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No recent transaction entries found.</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {latestTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                        tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-200">{tx.description}</h5>
                      <p className="text-[10px] text-slate-400">
                        {tx.merchant || tx.category?.name || 'General'} • {tx.account?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold font-mono ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">{formatDate(tx.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
