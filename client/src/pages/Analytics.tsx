import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const categoryData = [
    { name: 'Housing & Utilities', value: 1450, color: '#3b82f6' },
    { name: 'Groceries', value: 640, color: '#f59e0b' },
    { name: 'Dining Out', value: 380, color: '#ef4444' },
    { name: 'Subscriptions', value: 180, color: '#8b5cf6' },
    { name: 'Travel & Transport', value: 240, color: '#06b6d4' },
  ];

  const cashFlowData = [
    { month: 'Mar', Income: 6000, Expense: 2800 },
    { month: 'Apr', Income: 6200, Expense: 2950 },
    { month: 'May', Income: 6500, Expense: 3100 },
    { month: 'Jun', Income: 6500, Expense: 2750 },
    { month: 'Jul', Income: 6800, Expense: 2890 },
    { month: 'Aug', Income: 6500, Expense: 2894 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Financial Intelligence Analytics</h2>
        <p className="text-xs text-slate-400">Deep visual breakdown of cash flow velocity, category proportions, and spending patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <Card className="space-y-4">
          <h3 className="font-bold text-base text-slate-100">30-Day Expense Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Spent']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate">{item.name}:</span>
                <span className="font-bold text-slate-100">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Income vs Expenses Bar Chart */}
        <Card className="space-y-4">
          <h3 className="font-bold text-base text-slate-100">Monthly Cash Flow (Income vs Expenses)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Amount']} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
