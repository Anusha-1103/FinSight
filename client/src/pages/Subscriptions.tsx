import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarDays, Pencil, Trash2, AlertTriangle, AlertCircle, RefreshCw, CreditCard, Clock, Play, Pause, CheckCircle2 } from 'lucide-react';
import { Subscription, Account } from '../types';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export const getDefaultNextDate = (cycle: 'MONTHLY' | 'ANNUAL'): string => {
  const d = new Date();
  d.setDate(d.getDate() + (cycle === 'ANNUAL' ? 365 : 30));
  return d.toISOString().split('T')[0];
};

export const getDueBadge = (daysRemaining?: number) => {
  if (daysRemaining === undefined) return null;
  if (daysRemaining < 0) {
    return <Badge variant="danger">Overdue ({Math.abs(daysRemaining)}d ago)</Badge>;
  }
  if (daysRemaining === 0) {
    return <Badge variant="warning">Due Today</Badge>;
  }
  if (daysRemaining <= 3) {
    return <Badge variant="warning" className="font-semibold">Due in {daysRemaining}d</Badge>;
  }
  return <Badge variant="purple">Due in {daysRemaining}d</Badge>;
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'PAUSED':
      return <Badge variant="warning">Paused</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="purple">{status}</Badge>;
  }
};

export const Subscriptions: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  // Modals & Active Subscriptions State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null);
  const [paymentSub, setPaymentSub] = useState<Subscription | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '',
    provider: '',
    amount: '',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'ANNUAL',
    nextBillingDate: getDefaultNextDate('MONTHLY'),
    reminderDaysBefore: '3',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    provider: '',
    amount: '',
    billingCycle: 'MONTHLY' as 'MONTHLY' | 'ANNUAL',
    nextBillingDate: getDefaultNextDate('MONTHLY'),
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
    reminderDaysBefore: '3',
  });

  // 1. Fetch Subscriptions via React Query
  const {
    data: subData,
    isLoading: isLoadingSubs,
    isError: isErrorSubs,
    refetch: refetchSubs,
  } = useQuery<{ subscriptions: Subscription[]; summary: any }>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data.data;
    },
  });

  // 2. Fetch Accounts for Record Payment modal via React Query
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data.data;
    },
  });

  const invalidateAllSubscriptionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['ai-summary'] });
  };

  const handleCycleChangeAdd = (cycle: 'MONTHLY' | 'ANNUAL') => {
    setAddForm((prev) => ({
      ...prev,
      billingCycle: cycle,
      nextBillingDate: getDefaultNextDate(cycle),
    }));
  };

  const validateSubscriptionForm = (name: string, provider: string, amount: string, date: string, isEdit: boolean = false) => {
    if (!name.trim()) {
      showToast('Validation Warning', 'Subscription name cannot be blank.', 'warning');
      return false;
    }
    if (!provider.trim()) {
      showToast('Validation Warning', 'Provider name cannot be blank.', 'warning');
      return false;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Validation Warning', 'Amount must be greater than zero.', 'warning');
      return false;
    }
    if (!isEdit) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selectedDate.getTime()) || selectedDate < today) {
        showToast('Validation Warning', 'Next billing date cannot be in the past.', 'warning');
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSubscriptionForm(addForm.name, addForm.provider, addForm.amount, addForm.nextBillingDate)) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/subscriptions', addForm);
      if (res.data.success) {
        showToast('Subscription Added', `${res.data.data.name} recurring billing tracked.`, 'success');
        setIsAddModalOpen(false);
        setAddForm({
          name: '',
          provider: '',
          amount: '',
          billingCycle: 'MONTHLY',
          nextBillingDate: getDefaultNextDate('MONTHLY'),
          reminderDaysBefore: '3',
        });
        invalidateAllSubscriptionQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to create subscription.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setEditForm({
      name: sub.name,
      provider: sub.provider,
      amount: sub.amount.toString(),
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.split('T')[0] : getDefaultNextDate('MONTHLY'),
      status: sub.status,
      reminderDaysBefore: (sub.reminderDaysBefore || 3).toString(),
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    if (!validateSubscriptionForm(editForm.name, editForm.provider, editForm.amount, editForm.nextBillingDate, true)) return;

    setIsSubmitting(true);
    try {
      const res = await api.put(`/subscriptions/${editingSub.id}`, editForm);
      if (res.data.success) {
        showToast('Subscription Updated', `${res.data.data.name} saved.`, 'success');
        setEditingSub(null);
        invalidateAllSubscriptionQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to update subscription.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePause = async (sub: Subscription) => {
    const newStatus = sub.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    try {
      const res = await api.put(`/subscriptions/${sub.id}`, { status: newStatus });
      if (res.data.success) {
        showToast(
          newStatus === 'PAUSED' ? 'Subscription Paused' : 'Subscription Resumed',
          `${sub.name} is now ${newStatus.toLowerCase()}.`,
          newStatus === 'PAUSED' ? 'warning' : 'success'
        );
        invalidateAllSubscriptionQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to toggle status.', 'danger');
    }
  };

  const handleOpenRecordPayment = (sub: Subscription) => {
    setPaymentSub(sub);
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSub || !selectedAccountId) {
      showToast('Validation Warning', 'Please select an account for payment.', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post(`/subscriptions/${paymentSub.id}/record-payment`, {
        accountId: selectedAccountId,
      });

      if (res.data.success) {
        showToast(
          'Payment Recorded',
          `Expense of ${formatCurrency(paymentSub.amount)} logged & next billing date advanced cleanly.`,
          'success'
        );
        setPaymentSub(null);
        invalidateAllSubscriptionQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to record payment.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSub) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/subscriptions/${deletingSub.id}`);
      if (res.data.success) {
        showToast('Subscription Removed', `${deletingSub.name} was removed from your tracking.`, 'info');
        setDeletingSub(null);
        invalidateAllSubscriptionQueries();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to delete subscription.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subscriptions = subData?.subscriptions || [];
  const summary = subData?.summary || { totalMonthlySpend: 0, totalAnnualSpend: 0, activeCount: 0, pausedCount: 0, cancelledCount: 0 };

  return (
    <div className="space-y-6">
      {/* Header Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-indigo-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Spend</span>
          <h3 className="text-xl font-extrabold text-slate-100 tracking-tight font-mono mt-1">{formatCurrency(summary.totalMonthlySpend)}</h3>
        </Card>
        <Card className="p-4 border-purple-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Annualized Spend</span>
          <h3 className="text-xl font-extrabold text-purple-300 tracking-tight font-mono mt-1">{formatCurrency(summary.totalAnnualSpend)}</h3>
        </Card>
        <Card className="p-4 border-emerald-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Subscriptions</span>
          <h3 className="text-xl font-extrabold text-emerald-400 tracking-tight font-mono mt-1">{summary.activeCount}</h3>
        </Card>
        <Card className="p-4 border-amber-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paused</span>
          <h3 className="text-xl font-extrabold text-amber-400 tracking-tight font-mono mt-1">{summary.pausedCount}</h3>
        </Card>
        <Card className="p-4 border-rose-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cancelled</span>
          <h3 className="text-xl font-extrabold text-rose-400 tracking-tight font-mono mt-1">{summary.cancelledCount}</h3>
        </Card>
      </div>

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            Subscriptions
          </h2>
          <p className="text-xs text-slate-400">Manage recurring bills, record payments, and track monthly burn rate</p>
        </div>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Subscription
        </Button>
      </div>

      {isLoadingSubs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : isErrorSubs ? (
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-xs text-slate-300">Unable to load subscriptions from database.</p>
          <Button size="sm" onClick={() => refetchSubs()} className="gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-100">No Subscriptions Tracked</h3>
            <p className="text-xs text-slate-400">Add Netflix, Spotify, AWS, or utility bills to record payments and automate cash flow analytics.</p>
          </div>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Your First Subscription
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id} hoverable className="space-y-4 border-slate-800 relative group flex flex-col justify-between">
              <div className="space-y-3">
                {/* Header: Icon, Clean Title, Provider secondary, Status Badges */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base shadow-md shrink-0">
                      {sub.provider ? sub.provider[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{sub.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{sub.provider}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(sub.status)}
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors"
                      title="Edit Subscription"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSub(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount & Billing Cycle */}
                <div className="pt-2 border-t border-slate-800/60 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Recurring Cost</span>
                    <h3 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">{formatCurrency(sub.amount)}</h3>
                  </div>
                  <div className="text-right">
                    <Badge variant="purple" className="text-[10px] uppercase font-mono">
                      {sub.billingCycle}
                    </Badge>
                  </div>
                </div>

                {/* Next Billing Date & Due Reminder */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Next: {formatDate(sub.nextBillingDate)}</span>
                  </div>
                  <div>{getDueBadge(sub.daysRemaining)}</div>
                </div>
              </div>

              {/* Action Toolbar: Record Payment & Pause/Resume */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => handleOpenRecordPayment(sub)}
                  disabled={sub.status === 'CANCELLED'}
                  className="w-full gap-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Record Payment
                </Button>

                <button
                  onClick={() => handleTogglePause(sub)}
                  disabled={sub.status === 'CANCELLED'}
                  className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors shrink-0"
                  title={sub.status === 'PAUSED' ? 'Resume Subscription' : 'Pause Subscription'}
                >
                  {sub.status === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Subscription Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Recurring Subscription">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Subscription Title"
            placeholder="e.g. Netflix Ultra HD, AWS Cloud Infrastructure"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
          />
          <Input
            label="Provider / Merchant"
            placeholder="e.g. Netflix, Amazon Web Services"
            value={addForm.provider}
            onChange={(e) => setAddForm({ ...addForm, provider: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              placeholder="19.99"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              required
            />
            <Select
              label="Billing Cycle"
              value={addForm.billingCycle}
              onChange={(e) => handleCycleChangeAdd(e.target.value as 'MONTHLY' | 'ANNUAL')}
              options={[
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'ANNUAL', label: 'Annual' },
              ]}
            />
          </div>

          <Input
            label="Next Billing Date (Auto-defaulted based on cycle)"
            type="date"
            min={todayStr}
            value={addForm.nextBillingDate}
            onChange={(e) => setAddForm({ ...addForm, nextBillingDate: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Subscription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Subscription Modal */}
      <Modal isOpen={!!editingSub} onClose={() => setEditingSub(null)} title={`Edit Subscription — ${editingSub?.name || ''}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Subscription Title"
            placeholder="e.g. Netflix Ultra HD"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Provider / Merchant"
            placeholder="e.g. Netflix"
            value={editForm.provider}
            onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              placeholder="19.99"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              required
            />
            <Select
              label="Billing Cycle"
              value={editForm.billingCycle}
              onChange={(e) => setEditForm({ ...editForm, billingCycle: e.target.value as any })}
              options={[
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'ANNUAL', label: 'Annual' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Next Billing Date"
              type="date"
              value={editForm.nextBillingDate}
              onChange={(e) => setEditForm({ ...editForm, nextBillingDate: e.target.value })}
              required
            />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingSub(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!paymentSub} onClose={() => setPaymentSub(null)} title={`Record Payment — ${paymentSub?.name || ''}`}>
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 space-y-1">
            <h5 className="font-bold text-sm text-slate-100">{paymentSub?.name}</h5>
            <p className="text-slate-300">Provider: {paymentSub?.provider}</p>
            <p className="text-slate-300">Amount Due: <span className="font-bold text-emerald-400 font-mono">{formatCurrency(paymentSub?.amount || 0)}</span></p>
          </div>

          <Select
            label="Deduct Payment From Account"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))}
          />

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Logging this payment will create a completed <span className="font-bold text-slate-200">EXPENSE</span> transaction, decrement the selected account balance, and advance the next billing date by +{paymentSub?.billingCycle === 'ANNUAL' ? '365' : '30'} days.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setPaymentSub(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirm & Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingSub} onClose={() => setDeletingSub(null)} title="Confirm Subscription Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <h5 className="font-bold text-rose-200">Remove {deletingSub?.name}?</h5>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-100">{deletingSub?.name}</span>? This subscription will be removed from your active recurring bill tracking.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setDeletingSub(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteConfirm}>
              Remove Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
