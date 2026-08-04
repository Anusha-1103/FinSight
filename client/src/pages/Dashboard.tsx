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
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-60 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto my-12 bg-white border border-stone-200">
        <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-900">Failed to Load Portfolio</h3>
          <p className="text-xs text-stone-500">
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
        <Card className="p-8 border border-stone-200 bg-white text-center space-y-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-stone-150 text-stone-700 mx-auto flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xs font-bold text-stone-900">Welcome to FinSight</h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Link your checking, savings, or credit accounts to start computing live net worth and tracking monthly cash flow.
            </p>
          </div>
        </Card>
      )}

      {/* 6 Key PostgreSQL KPI Metric Cards - Editorial Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Net Worth */}
        <Card hoverable className="border-stone-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500">Net Worth</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-mono leading-none">{formatCurrency(netWorth)}</h3>
            <p className="text-[9px] text-[#747c5e] font-medium flex items-center gap-0.5 mt-1 font-mono">
              <ArrowUpRight className="w-3 h-3 text-[#8f9779]" /> Assets less liabilities
            </p>
          </div>
        </Card>

        {/* Monthly Income */}
        <Card hoverable className="border-stone-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500">Monthly Inflow</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-mono leading-none">{formatCurrency(monthlyIncome)}</h3>
            <p className="text-[9px] text-stone-500 mt-1 font-mono">30-day deposits</p>
          </div>
        </Card>

        {/* Monthly Expenses */}
        <Card hoverable className="border-stone-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500">Monthly Outflow</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-mono leading-none">{formatCurrency(monthlyExpenses)}</h3>
            <p className="text-[9px] text-stone-500 mt-1 font-mono">30-day purchases</p>
          </div>
        </Card>

        {/* Net Cash Flow */}
        <Card hoverable className="border-stone-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500">Net Flow</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className={`text-base font-bold tracking-tight font-mono leading-none ${cashFlow >= 0 ? 'text-[#747c5e]' : 'text-[#a15d39]'}`}>
              {formatCurrency(cashFlow)}
            </h3>
            <p className="text-[9px] text-stone-500 mt-1 font-mono">Net cash change</p>
          </div>
        </Card>

        {/* Savings Rate */}
        <Card hoverable className="border-stone-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500">Savings Rate</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-mono leading-none">{savingsRate}%</h3>
            <p className="text-[9px] text-[#747c5e] font-medium mt-1 font-mono">Target: &gt; 20%</p>
          </div>
        </Card>

        {/* Active Accounts Count */}
        <Card hoverable className="border-stone-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-stone-500">Active Accounts</span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-mono leading-none">{activeAccountsCount}</h3>
            <p className="text-[9px] text-stone-500 mt-1 font-mono">Linked vaults</p>
          </div>
        </Card>
      </div>

      {/* Row 2: Net Worth Growth Trajectory Chart & Financial Health Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4 bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-950">Net Worth Growth Trajectory</h3>
              <p className="text-[11px] text-stone-500">6-month portfolio accumulation trend</p>
            </div>
            <Badge variant="success">Assets Growth</Badge>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8f9779" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8f9779" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#78716c" fontSize={10} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Net Worth']} />
                <Area type="monotone" dataKey="netWorth" stroke="#8f9779" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {healthScore && (
          <Card className="space-y-4 bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-[#747c5e]" />
                Financial Health Index
              </h3>
              <Badge variant="purple">{healthScore.grade} Rating</Badge>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#f4f1eb" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="#8f9779" // Sage Green
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * healthScore.totalScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-stone-900 font-mono leading-none">{healthScore.totalScore}</span>
                  <span className="text-[8px] text-stone-500 uppercase tracking-widest mt-1">/ 100 Pts</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-[11px] font-sans">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Savings Velocity Score</span>
                  <span className="font-bold text-stone-900 font-mono">{healthScore.metrics.savingsRateScore}/100</span>
                </div>
                <Progress value={healthScore.metrics.savingsRateScore} color="bg-[#8f9779]" size="sm" />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Budget Cap Adherence</span>
                  <span className="font-bold text-stone-900 font-mono">{healthScore.metrics.budgetAdherenceScore}/100</span>
                </div>
                <Progress value={healthScore.metrics.budgetAdherenceScore} color="bg-stone-800" size="sm" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Row 3: Top 5 Spending Categories & Largest Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top 5 Spending Categories */}
        <Card className="space-y-4 bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#d4af37]" />
              Top 5 Outflow Categories
            </h3>
            <span className="text-[10px] text-stone-500 font-mono">30 Days</span>
          </div>

          {topSpendingCategories.length === 0 ? (
            <p className="text-[11px] text-stone-400 py-6 text-center">No expense logs found.</p>
          ) : (
            <div className="space-y-4">
              {topSpendingCategories.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-stone-700">
                    <span>{cat.name}</span>
                    <span className="text-stone-950 font-bold font-mono">{formatCurrency(cat.totalSpent)}</span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round((cat.totalSpent / (monthlyExpenses || 1)) * 100))}
                    color="bg-stone-800"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Largest Single Expense Record */}
        <Card className="space-y-4 bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-[#c87a53]" />
              Largest Single Expense
            </h3>
            <Badge variant="danger">Outflow</Badge>
          </div>
          {largestExpense ? (
            <div className="space-y-3.5 p-4 rounded-lg bg-stone-50 border border-stone-200">
              <h4 className="text-sm font-bold text-stone-900 font-sans leading-snug">{largestExpense.description}</h4>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-stone-500">{largestExpense.merchant || largestExpense.category?.name}</span>
                <span className="font-bold text-[#c87a53] font-mono text-base">
                  -{formatCurrency(largestExpense.amount)}
                </span>
              </div>
              <div className="pt-2.5 border-t border-stone-200/80 flex justify-between text-[9px] text-stone-500 font-mono">
                <span>Account: {largestExpense.account?.name}</span>
                <span>{formatDate(largestExpense.date)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-stone-400 py-6 text-center">No expense logs registered.</p>
          )}
        </Card>

        {/* Largest Single Income Record */}
        <Card className="space-y-4 bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#8f9779]" />
              Largest Single Income
            </h3>
            <Badge variant="success">Inflow</Badge>
          </div>
          {largestIncome ? (
            <div className="space-y-3.5 p-4 rounded-lg bg-stone-50 border border-stone-200">
              <h4 className="text-sm font-bold text-stone-900 font-sans leading-snug">{largestIncome.description}</h4>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-stone-500">{largestIncome.merchant || largestIncome.category?.name}</span>
                <span className="font-bold text-[#747c5e] font-mono text-base">
                  +{formatCurrency(largestIncome.amount)}
                </span>
              </div>
              <div className="pt-2.5 border-t border-stone-200/80 flex justify-between text-[9px] text-stone-500 font-mono">
                <span>Account: {largestIncome.account?.name}</span>
                <span>{formatDate(largestIncome.date)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-stone-400 py-6 text-center">No income logs registered.</p>
          )}
        </Card>
      </div>

      {/* Row 4: Latest 10 Transactions Table & Spending Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="space-y-4 bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-xs text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7da2a9]" />
              Day-of-Week Heatmap
            </h3>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingHeatmap}>
                <XAxis dataKey="day" stroke="#78716c" fontSize={9} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={9} tickLine={false} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']} />
                <Bar dataKey="amount" fill="#8f9779" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2 space-y-4 bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-950">Latest Transactions</h3>
              <p className="text-[10px] text-stone-500">Most recent portfolio logs</p>
            </div>
          </div>

          {latestTransactions.length === 0 ? (
            <p className="text-[11px] text-stone-400 py-8 text-center">No transactions recorded.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {latestTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7.5 h-7.5 rounded flex items-center justify-center ${
                        tx.type === 'INCOME' ? 'bg-[#8f9779]/10 text-[#747c5e]' : 'bg-[#c87a53]/10 text-[#a15d39]'
                      }`}
                    >
                      {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-stone-900 leading-tight">{tx.description}</h5>
                      <p className="text-[9px] text-stone-500 mt-0.5">
                        {tx.merchant || tx.category?.name || 'General'} • {tx.account?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold font-mono ${tx.type === 'INCOME' ? 'text-[#747c5e]' : 'text-stone-900'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <p className="text-[9px] text-stone-400 font-mono mt-0.5">{formatDate(tx.date)}</p>
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
