import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  PiggyBank,
  Briefcase,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

// Premium Color Palettes for Charts
const ASSET_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#eab308', '#f97316', '#ec4899', '#06b6d4'];
const INCOME_COLORS = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0'];

// Custom tooltip renderer for Recharts that matches dark premium theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
        <p className="font-bold text-slate-300 border-b border-slate-800/80 pb-1 mb-1">{label}</p>
        {payload.map((p: any, index: number) => (
          <div key={index} className="flex items-center gap-4 justify-between">
            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}:
            </span>
            <span className="font-extrabold text-slate-100">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Analytics: React.FC = () => {
  // 1. Date and range filtering states
  const [range, setRange] = useState<'current_month' | 'last_3_months' | 'last_6_months' | 'last_12_months' | 'custom'>('last_6_months');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // 2. Fetch Analytics via React Query
  const {
    data: analyticsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['analytics', range, startDate, endDate],
    queryFn: async () => {
      const params: any = { range };
      if (range === 'custom') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.get('/analytics', { params });
      return res.data.data;
    },
  });

  const handleRangeChange = (value: string) => {
    setRange(value as any);
    const now = new Date();
    if (value === 'current_month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (value === 'last_3_months') {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (value === 'last_6_months') {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (value === 'last_12_months') {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-96 rounded" />
          </div>
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <Card className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Failed to load analytics</h3>
        <p className="text-slate-400 text-xs">There was an error communicating with the PostgreSQL aggregates engine.</p>
        <Button size="sm" onClick={() => refetch()} className="gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </Button>
      </Card>
    );
  }

  const {
    trendData = [],
    savingsGrowth = [],
    netWorthHistory = [],
    spendingByCategory = [],
    largestExpenseCategories = [],
    incomeSources = [],
    budgetUtilization = [],
    healthMetrics = {},
    summary = { totalIncome: 0, totalExpense: 0, netSavings: 0 },
  } = analyticsData;

  const savingsRate = summary.totalIncome > 0 ? Math.round((summary.netSavings / summary.totalIncome) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Filters Selector */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Financial Intelligence & Analytics
          </h2>
          <p className="text-xs text-slate-400">Dynamically generated PostgreSQL aggregates mapping cash flow velocity, trendlines, and wealth health index</p>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="w-40 shrink-0">
            <Select
              value={range}
              onChange={(e) => handleRangeChange(e.target.value)}
              options={[
                { value: 'current_month', label: 'Current Month' },
                { value: 'last_3_months', label: 'Last 3 Months' },
                { value: 'last_6_months', label: 'Last 6 Months' },
                { value: 'last_12_months', label: 'Last 12 Months' },
                { value: 'custom', label: 'Custom Range' },
              ]}
            />
          </div>

          {range === 'custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-36 h-9 py-1 px-3 text-xs"
              />
              <span className="text-slate-500 text-xs">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-36 h-9 py-1 px-3 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Row KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Period Income</span>
              <h3 className="text-2xl font-extrabold text-emerald-400 tracking-tight font-mono mt-1">
                {formatCurrency(summary.totalIncome)}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-rose-500/10 hover:border-rose-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Period Spend</span>
              <h3 className="text-2xl font-extrabold text-rose-400 tracking-tight font-mono mt-1">
                {formatCurrency(summary.totalExpense)}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-blue-500/10 hover:border-blue-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Period Savings</span>
              <h3 className="text-2xl font-extrabold text-blue-400 tracking-tight font-mono mt-1">
                {formatCurrency(summary.netSavings)}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-purple-500/10 hover:border-purple-500/20 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Savings Rate</span>
              <h3 className="text-2xl font-extrabold text-purple-400 tracking-tight font-mono mt-1">
                {savingsRate}%
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Trends charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income & Spending Trend Lines */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
              Income & Spending Trends
            </h3>
            <p className="text-xs text-slate-400">Historical monthly flow comparisons</p>
          </div>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1.5, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Spending"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1.5, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Net Monthly Cash Flow Area Chart */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Net Cash Flow Trend</h3>
            <p className="text-xs text-slate-400">Surplus cash flow distribution over time</p>
          </div>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="cashflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cashFlow"
                  name="Net Cash Flow"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cashflowGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Net Worth & Savings Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth History Chart */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Historical Net Worth Progression</h3>
            <p className="text-xs text-slate-400">Calculated assets vs liabilities over time</p>
          </div>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory}>
                <defs>
                  <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="liabilitiesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="assets"
                  name="Assets"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#assetsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="liabilities"
                  name="Liabilities"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#liabilitiesGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  name="Net Worth"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0f172a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Savings Growth Area Chart */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Savings Growth Progression</h3>
            <p className="text-xs text-slate-400">Cumulative historical capital accumulation</p>
          </div>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsGrowth}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="savings"
                  name="Cumulative Savings"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#savingsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Spending Breakdown and Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category Donut */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Expense Distribution</h3>
            <p className="text-xs text-slate-400">Top spending categories in this period</p>
          </div>
          {spendingByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-mono">
              No expenses recorded in this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="amount"
                    >
                      {spendingByCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || ASSET_COLORS[index % ASSET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3.5 text-xs">
                {spendingByCategory.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || ASSET_COLORS[index % ASSET_COLORS.length] }}
                      />
                      <span className="text-slate-300 font-sans">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-100 font-extrabold font-mono block">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Largest Expense Categories (Horizontal Bar Chart) */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Top Spent Categories</h3>
            <p className="text-xs text-slate-400">Total period outflow size relative ranking</p>
          </div>
          {largestExpenseCategories.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-mono">
              No categories mapped.
            </div>
          ) : (
            <div className="h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={largestExpenseCategories.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16}>
                    {largestExpenseCategories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Income Distribution & Budget Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Sources Donut */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Income Inflow Sources</h3>
            <p className="text-xs text-slate-400">Proportions of incoming streams</p>
          </div>
          {incomeSources.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-mono">
              No income recorded in this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSources}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="amount"
                    >
                      {incomeSources.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || INCOME_COLORS[index % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3.5 text-xs">
                {incomeSources.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || INCOME_COLORS[index % INCOME_COLORS.length] }}
                      />
                      <span className="text-slate-300 font-sans">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-100 font-extrabold font-mono block">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Budget Utilization comparison (Grouped Bar Chart) */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">Monthly Budget Utilization</h3>
            <p className="text-xs text-slate-400">Comparing set allocations vs actual period spending</p>
          </div>
          {budgetUtilization.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-mono">
              No budgets established. Set budgets on the Budgets page to track adherence.
            </div>
          ) : (
            <div className="h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetUtilization.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="allocated" name="Allocated Budget" fill="#1e293b" stroke="#334155" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Actual Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Financial Health Metrics Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-100">Financial Health Summary</h3>
          <p className="text-xs text-slate-400">Analytical thresholds calculated from your data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Average Spending Card */}
          <Card className="p-4 border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Average Monthly Spend</span>
              <h4 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
                {formatCurrency(healthMetrics.averageMonthlySpending)}
              </h4>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1 font-mono">
              <div className="flex items-center justify-end gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span>Peak: {healthMetrics.highestSpendingMonthName}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300">
                {formatCurrency(healthMetrics.highestSpendingMonthAmount)}
              </p>
            </div>
          </Card>

          {/* Average Income Card */}
          <Card className="p-4 border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Average Monthly Inflow</span>
              <h4 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
                {formatCurrency(healthMetrics.averageMonthlyIncome)}
              </h4>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1 font-mono">
              <div className="flex items-center justify-end gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Peak: {healthMetrics.highestIncomeMonthName}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300">
                {formatCurrency(healthMetrics.highestIncomeMonthAmount)}
              </p>
            </div>
          </Card>

          {/* Average Savings Rate Card */}
          <Card className="p-4 border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Average Savings Rate</span>
              <h4 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
                {healthMetrics.averageSavingsRate}%
              </h4>
            </div>
            <Badge variant={healthMetrics.averageSavingsRate >= 20 ? 'success' : healthMetrics.averageSavingsRate >= 10 ? 'warning' : 'danger'}>
              {healthMetrics.averageSavingsRate >= 20 ? 'High Savings Velocity' : healthMetrics.averageSavingsRate >= 10 ? 'Moderate Growth' : 'Deficit Reserve Risk'}
            </Badge>
          </Card>

          {/* Largest Transaction */}
          <Card className="p-4 border-slate-800 flex flex-col justify-between h-28">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Largest Transaction</span>
            {healthMetrics.largestTransaction ? (
              <div className="flex items-center justify-between font-mono pt-1">
                <div>
                  <h5 className="font-bold text-slate-200 text-xs truncate max-w-[160px]">
                    {healthMetrics.largestTransaction.merchant}
                  </h5>
                  <p className="text-[9px] text-slate-500 mt-0.5">{healthMetrics.largestTransaction.date}</p>
                </div>
                <span className={`font-bold text-sm ${healthMetrics.largestTransaction.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {healthMetrics.largestTransaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(healthMetrics.largestTransaction.amount)}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-mono">No transactions recorded.</p>
            )}
          </Card>

          {/* Largest Single Expense */}
          <Card className="p-4 border-slate-800 flex flex-col justify-between h-28">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Largest Expense Item</span>
            {healthMetrics.largestExpense ? (
              <div className="flex items-center justify-between font-mono pt-1">
                <div>
                  <h5 className="font-bold text-rose-300 text-xs truncate max-w-[160px]">
                    {healthMetrics.largestExpense.merchant}
                  </h5>
                  <p className="text-[9px] text-slate-500 mt-0.5">{healthMetrics.largestExpense.date}</p>
                </div>
                <span className="font-extrabold text-sm text-rose-400">
                  -{formatCurrency(healthMetrics.largestExpense.amount)}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-mono">No expenses logged.</p>
            )}
          </Card>

          {/* Largest Single Income */}
          <Card className="p-4 border-slate-800 flex flex-col justify-between h-28">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Largest Income Inflow</span>
            {healthMetrics.largestIncome ? (
              <div className="flex items-center justify-between font-mono pt-1">
                <div>
                  <h5 className="font-bold text-emerald-300 text-xs truncate max-w-[160px]">
                    {healthMetrics.largestIncome.merchant}
                  </h5>
                  <p className="text-[9px] text-slate-500 mt-0.5">{healthMetrics.largestIncome.date}</p>
                </div>
                <span className="font-extrabold text-sm text-emerald-400">
                  +{formatCurrency(healthMetrics.largestIncome.amount)}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-mono">No income inflows logged.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
