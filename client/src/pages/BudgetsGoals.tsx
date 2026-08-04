import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Flame, Pencil, Trash2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { Budget, Goal, Category } from '../types';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export const getProgressBarColor = (percentage: number = 0): string => {
  if (percentage >= 100) return 'bg-emerald-500';
  if (percentage >= 70) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
};

export const getProjectionBadge = (status?: string) => {
  switch (status) {
    case 'Completed':
      return <Badge variant="success">🟢 Completed</Badge>;
    case 'Ahead of Schedule':
      return <Badge variant="purple">🔵 Ahead of Schedule</Badge>;
    case 'Behind Schedule':
      return <Badge variant="warning">🟡 Behind Schedule</Badge>;
    case 'On Track':
    default:
      return <Badge variant="success">🟢 On Track</Badge>;
  }
};

export const BudgetsGoals: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Modals & Submitting States
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms State
  const [budgetForm, setBudgetForm] = useState({ categoryId: '', amount: '', period: 'MONTHLY' });
  const [editBudgetForm, setEditBudgetForm] = useState({ categoryId: '', amount: '', period: 'MONTHLY' });

  const todayStr = new Date().toISOString().split('T')[0];
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', currentAmount: '0', targetDate: todayStr, color: '#10b981' });
  const [editGoalForm, setEditGoalForm] = useState({ name: '', targetAmount: '', currentAmount: '0', targetDate: todayStr, color: '#10b981' });

  // 1. Fetch live Budgets via React Query
  const {
    data: budgetsData,
    isLoading: isLoadingBudgets,
    isError: isErrorBudgets,
    refetch: refetchBudgets,
  } = useQuery<{ budgets: Budget[]; summary: any }>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.get('/budgets');
      return res.data.data;
    },
  });

  // 2. Fetch live Goals via React Query
  const {
    data: goalsData,
    isLoading: isLoadingGoals,
    isError: isErrorGoals,
    refetch: refetchGoals,
  } = useQuery<{ goals: Goal[]; summary: any }>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data.data;
    },
  });

  // 3. Fetch Categories via React Query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE' || !c.type);

  const invalidateGoalQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const invalidateBudgetQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  // Budget Handlers
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.categoryId || !budgetForm.amount) {
      showToast('Validation Error', 'Category and target amount are required.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/budgets', budgetForm);
      if (res.data.success) {
        showToast('Budget Created', 'Spending cap set successfully.', 'success');
        setIsAddBudgetOpen(false);
        setBudgetForm({ categoryId: '', amount: '', period: 'MONTHLY' });
        invalidateBudgetQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to create budget.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setEditBudgetForm({
      categoryId: b.categoryId,
      amount: b.amount.toString(),
      period: b.period || 'MONTHLY',
    });
  };

  const handleEditBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    setIsSubmitting(true);
    try {
      const res = await api.put(`/budgets/${editingBudget.id}`, editBudgetForm);
      if (res.data.success) {
        showToast('Budget Updated', 'Spending cap updated.', 'success');
        setEditingBudget(null);
        invalidateBudgetQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to update budget.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudgetConfirm = async () => {
    if (!deletingBudget) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/budgets/${deletingBudget.id}`);
      if (res.data.success) {
        showToast('Budget Removed', 'Category budget deleted.', 'info');
        setDeletingBudget(null);
        invalidateBudgetQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to delete budget.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Goal Handlers
  const validateGoalData = (name: string, targetAmount: string, currentAmount: string, targetDate: string) => {
    if (!name.trim()) {
      showToast('Validation Warning', 'Goal name cannot be blank.', 'warning');
      return false;
    }
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      showToast('Validation Warning', 'Target amount must be greater than zero.', 'warning');
      return false;
    }
    const current = parseFloat(currentAmount);
    if (isNaN(current) || current < 0) {
      showToast('Validation Warning', 'Current amount cannot be negative.', 'warning');
      return false;
    }
    const selectedDate = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(selectedDate.getTime()) || selectedDate < today) {
      showToast('Validation Warning', 'Target date cannot be in the past.', 'warning');
      return false;
    }
    return true;
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGoalData(goalForm.name, goalForm.targetAmount, goalForm.currentAmount, goalForm.targetDate)) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/goals', goalForm);
      if (res.data.success) {
        showToast('Goal Created', `${res.data.data.name} goal added successfully.`, 'success');
        setIsAddGoalOpen(false);
        setGoalForm({ name: '', targetAmount: '', currentAmount: '0', targetDate: todayStr, color: '#10b981' });
        invalidateGoalQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to create goal.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setEditGoalForm({
      name: g.name,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      targetDate: g.targetDate ? g.targetDate.split('T')[0] : todayStr,
      color: g.color || '#10b981',
    });
  };

  const handleEditGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    if (!validateGoalData(editGoalForm.name, editGoalForm.targetAmount, editGoalForm.currentAmount, editGoalForm.targetDate)) return;

    setIsSubmitting(true);
    try {
      const res = await api.put(`/goals/${editingGoal.id}`, editGoalForm);
      if (res.data.success) {
        showToast('Goal Updated', `${res.data.data.name} details saved.`, 'success');
        setEditingGoal(null);
        invalidateGoalQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to update goal.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoalConfirm = async () => {
    if (!deletingGoal) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/goals/${deletingGoal.id}`);
      if (res.data.success) {
        showToast('Goal Deleted', `${deletingGoal.name} was removed.`, 'info');
        setDeletingGoal(null);
        invalidateGoalQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to delete goal.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string, isExceeded?: boolean) => {
    if (status === 'OVER_BUDGET' || isExceeded) {
      return <Badge variant="danger">Over Budget</Badge>;
    }
    if (status === 'NEAR_LIMIT') {
      return <Badge variant="warning">Near Limit</Badge>;
    }
    return <Badge variant="success">Healthy</Badge>;
  };

  const getStatusColor = (status?: string, isExceeded?: boolean) => {
    if (status === 'OVER_BUDGET' || isExceeded) return 'bg-rose-500';
    if (status === 'NEAR_LIMIT') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const budgets = budgetsData?.budgets || [];
  const budgetSummary = budgetsData?.summary || { healthyCount: 0, nearLimitCount: 0, overBudgetCount: 0, totalAllocated: 0, totalSpent: 0 };

  const goals = goalsData?.goals || [];
  const goalSummary = goalsData?.summary || { totalGoalValue: 0, totalSaved: 0, overallProgress: 0, activeGoalsCount: 0, completedGoalsCount: 0 };

  return (
    <div className="space-y-10">
      {/* Section 1: Category Budgets */}
      <div className="space-y-4">
        {/* Summary KPI Header Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 border-indigo-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Allocated</span>
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono mt-1">{formatCurrency(budgetSummary.totalAllocated)}</h3>
          </Card>
          <Card className="p-4 border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
            <h3 className="text-xl font-extrabold text-slate-100 tracking-tight font-mono mt-1">{formatCurrency(budgetSummary.totalSpent)}</h3>
          </Card>
          <Card className="p-4 border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Healthy Budgets</span>
            <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight font-mono mt-1">{budgetSummary.healthyCount}</h3>
          </Card>
          <Card className="p-4 border-amber-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Near Limit</span>
            <h3 className="text-xl font-extrabold text-amber-400 tracking-tight font-mono mt-1">{budgetSummary.nearLimitCount}</h3>
          </Card>
          <Card className="p-4 border-rose-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Over Budget</span>
            <h3 className="text-xl font-extrabold text-rose-400 tracking-tight font-mono mt-1">{budgetSummary.overBudgetCount}</h3>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              Category Budgets & Velocity
            </h2>
            <p className="text-xs text-slate-400">Calculated in real time from live PostgreSQL expense transactions</p>
          </div>
          <Button size="sm" onClick={() => setIsAddBudgetOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Budget
          </Button>
        </div>

        {isLoadingBudgets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : isErrorBudgets ? (
          <Card className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-slate-300">Unable to load live budget metrics from database.</p>
            <Button size="sm" onClick={() => refetchBudgets()} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </Card>
        ) : budgets.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-100">No Category Budgets Set</h3>
              <p className="text-xs text-slate-400">Set monthly spending caps for groceries, dining out, or entertainment to control your burn rate.</p>
            </div>
            <Button size="sm" onClick={() => setIsAddBudgetOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Your First Budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => (
              <Card key={b.id} hoverable className="space-y-4 border-slate-800 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{b.category?.name || 'Uncategorized'}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{b.period || 'MONTHLY'} CAP</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(b.status, b.isExceeded)}
                    <button
                      onClick={() => handleOpenEditBudget(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors"
                      title="Edit Budget Cap"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBudget(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Spent: {formatCurrency(b.spent)}</span>
                    <span className="text-slate-200 font-bold">{b.percentageUsed}%</span>
                  </div>
                  <Progress
                    value={b.percentageUsed}
                    color={getStatusColor(b.status, b.isExceeded)}
                    size="md"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Limit: {formatCurrency(b.amount)}</span>
                  <span className={b.remaining === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    Rem: {formatCurrency(b.remaining)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Production Savings Goals Management */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        {/* Goals Summary Header KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 border-indigo-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Goal Target</span>
            <h3 className="text-xl font-extrabold text-white tracking-tight font-mono mt-1">{formatCurrency(goalSummary.totalGoalValue)}</h3>
          </Card>
          <Card className="p-4 border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Saved</span>
            <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight font-mono mt-1">{formatCurrency(goalSummary.totalSaved)}</h3>
          </Card>
          <Card className="p-4 border-purple-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Progress</span>
            <h3 className="text-xl font-extrabold text-purple-300 tracking-tight font-mono mt-1">{goalSummary.overallProgress}%</h3>
          </Card>
          <Card className="p-4 border-blue-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Goals</span>
            <h3 className="text-xl font-extrabold text-blue-400 tracking-tight font-mono mt-1">{goalSummary.activeGoalsCount}</h3>
          </Card>
          <Card className="p-4 border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Goals</span>
            <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight font-mono mt-1">{goalSummary.completedGoalsCount}</h3>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Wealth Savings Goals & Projections
            </h2>
            <p className="text-xs text-slate-400">Track target reserves, emergency funds, and estimated monthly savings projections</p>
          </div>
          <Button size="sm" onClick={() => setIsAddGoalOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </div>

        {isLoadingGoals ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : isErrorGoals ? (
          <Card className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-slate-300">Unable to load savings goals from database.</p>
            <Button size="sm" onClick={() => refetchGoals()} className="gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </Card>
        ) : goals.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-100">No Savings Goals Defined</h3>
              <p className="text-xs text-slate-400">Set target emergency funds, house down payments, or vacation reserves to project required monthly savings.</p>
            </div>
            <Button size="sm" onClick={() => setIsAddGoalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Your First Goal
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const pct = g.percentage !== undefined ? g.percentage : Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              const progressColor = getProgressBarColor(pct);

              return (
                <Card key={g.id} hoverable className="space-y-4 border-slate-800 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{g.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Target: {formatCurrency(g.targetAmount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getProjectionBadge(g.projectionStatus)}
                      <button
                        onClick={() => handleOpenEditGoal(g)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors"
                        title="Edit Goal"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingGoal(g)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Saved: {formatCurrency(g.currentAmount)}</span>
                      <span className="text-slate-100 font-extrabold">{pct}%</span>
                    </div>
                    <Progress value={pct} color={progressColor} size="md" />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>Remaining: {formatCurrency(g.remainingAmount || 0)}</span>
                      <span>Target: {formatDate(g.targetDate)}</span>
                    </div>
                  </div>

                  {/* Goal Projection Engine Box */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">Goal Projection</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Need to save:</span>
                      <span className="font-extrabold text-emerald-400 font-mono">
                        {g.monthlySavingsNeeded ? `${formatCurrency(g.monthlySavingsNeeded)}/month` : 'Goal Completed'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal isOpen={isAddBudgetOpen} onClose={() => setIsAddBudgetOpen(false)} title="Set Category Budget Cap">
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <Select
            label="Category"
            value={budgetForm.categoryId}
            onChange={(e) => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
            options={[
              { value: '', label: '-- Select Expense Category --' },
              ...expenseCategories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Input
            label="Monthly Cap Amount ($)"
            type="number"
            step="0.01"
            placeholder="500.00"
            value={budgetForm.amount}
            onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
            required
          />
          <Select
            label="Period"
            value={budgetForm.period}
            onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
            options={[
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'YEARLY', label: 'Yearly' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddBudgetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal isOpen={!!editingBudget} onClose={() => setEditingBudget(null)} title={`Edit Budget — ${editingBudget?.category?.name || ''}`}>
        <form onSubmit={handleEditBudgetSubmit} className="space-y-4">
          <Input
            label="Monthly Cap Amount ($)"
            type="number"
            step="0.01"
            placeholder="500.00"
            value={editBudgetForm.amount}
            onChange={(e) => setEditBudgetForm({ ...editBudgetForm, amount: e.target.value })}
            required
          />
          <Select
            label="Period"
            value={editBudgetForm.period}
            onChange={(e) => setEditBudgetForm({ ...editBudgetForm, period: e.target.value })}
            options={[
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'YEARLY', label: 'Yearly' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingBudget(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Budget Confirmation Modal */}
      <Modal isOpen={!!deletingBudget} onClose={() => setDeletingBudget(null)} title="Confirm Budget Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <h5 className="font-bold text-rose-200">Delete Budget Cap?</h5>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Are you sure you want to delete the spending budget for <span className="font-bold text-white">{deletingBudget?.category?.name}</span>?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setDeletingBudget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteBudgetConfirm}>
              Delete Budget
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Goal Modal */}
      <Modal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} title="New Wealth Savings Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Shield, House Down Payment"
            value={goalForm.name}
            onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount ($)"
              type="number"
              step="0.01"
              placeholder="10000.00"
              value={goalForm.targetAmount}
              onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
              required
            />
            <Input
              label="Initial Current Saved ($)"
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={goalForm.currentAmount}
              onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
            />
          </div>
          <Input
            label="Target Completion Date"
            type="date"
            min={todayStr}
            value={goalForm.targetDate}
            onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddGoalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal isOpen={!!editingGoal} onClose={() => setEditingGoal(null)} title={`Edit Goal — ${editingGoal?.name || ''}`}>
        <form onSubmit={handleEditGoalSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Shield"
            value={editGoalForm.name}
            onChange={(e) => setEditGoalForm({ ...editGoalForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount ($)"
              type="number"
              step="0.01"
              placeholder="10000.00"
              value={editGoalForm.targetAmount}
              onChange={(e) => setEditGoalForm({ ...editGoalForm, targetAmount: e.target.value })}
              required
            />
            <Input
              label="Current Saved ($)"
              type="number"
              step="0.01"
              placeholder="1000.00"
              value={editGoalForm.currentAmount}
              onChange={(e) => setEditGoalForm({ ...editGoalForm, currentAmount: e.target.value })}
              required
            />
          </div>
          <Input
            label="Target Completion Date"
            type="date"
            min={todayStr}
            value={editGoalForm.targetDate}
            onChange={(e) => setEditGoalForm({ ...editGoalForm, targetDate: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingGoal(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Goal Confirmation Modal */}
      <Modal isOpen={!!deletingGoal} onClose={() => setDeletingGoal(null)} title="Confirm Goal Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <h5 className="font-bold text-rose-200">Delete Savings Goal?</h5>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">{deletingGoal?.name}</span>? This action will permanently remove this savings milestone and its monthly projection calculations.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setDeletingGoal(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteGoalConfirm}>
              Delete Goal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
