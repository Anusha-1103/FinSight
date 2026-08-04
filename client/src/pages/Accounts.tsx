import React, { useState, useEffect } from 'react';
import { Plus, Landmark, PiggyBank, CreditCard, TrendingUp, Wallet, Pencil, Trash2, AlertTriangle, Coins } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Account } from '../types';
import { api } from '../lib/api';
import { formatCurrency, maskAccountNumber } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';

export const getAccountColor = (type: string): string => {
  switch (type) {
    case 'CHECKING': return '#3b82f6'; // Blue
    case 'SAVINGS': return '#10b981'; // Green
    case 'CREDIT_CARD': return '#ef4444'; // Red
    case 'INVESTMENT': return '#8b5cf6'; // Purple
    case 'CASH': return '#eab308'; // Yellow
    case 'LOAN': return '#f97316'; // Orange
    default: return '#3b82f6';
  }
};

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'CHECKING',
    balance: '',
    accountNumber: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    type: 'CHECKING',
    balance: '',
    accountNumber: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
      showToast('Error', 'Unable to fetch accounts.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...createForm,
        color: getAccountColor(createForm.type),
      };
      const res = await api.post('/accounts', payload);
      if (res.data.success) {
        setAccounts((prev) => [...prev, res.data.data]);
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', type: 'CHECKING', balance: '', accountNumber: '' });
        showToast('Account Added', `${res.data.data.name} has been added successfully.`, 'success');
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to add account.';
      showToast('Add Failed', msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditForm({
      name: acc.name,
      type: acc.type,
      balance: acc.balance.toString(),
      accountNumber: acc.accountNumber || '', // Full unmasked value inside edit modal
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...editForm,
        color: getAccountColor(editForm.type),
      };
      const res = await api.put(`/accounts/${editingAccount.id}`, payload);
      if (res.data.success) {
        const updated = res.data.data;
        setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setEditingAccount(null);
        showToast('Account Updated', `${updated.name} details saved.`, 'success');
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update account.';
      showToast('Update Failed', msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/accounts/${deletingAccount.id}`);
      if (res.data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== deletingAccount.id));
        showToast('Account Deleted', `${deletingAccount.name} was removed.`, 'info');
        setDeletingAccount(null);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete account.';
      showToast('Delete Failed', msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CHECKING': return <Landmark className="w-5 h-5" />;
      case 'SAVINGS': return <PiggyBank className="w-5 h-5" />;
      case 'CREDIT_CARD': return <CreditCard className="w-5 h-5" />;
      case 'INVESTMENT': return <TrendingUp className="w-5 h-5" />;
      case 'CASH': return <Coins className="w-5 h-5" />;
      default: return <Wallet className="w-5 h-5" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'CHECKING': return 'Checking';
      case 'SAVINGS': return 'Savings';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'INVESTMENT': return 'Investment';
      case 'CASH': return 'Cash';
      case 'LOAN': return 'Loan';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Accounts</h2>
          <p className="text-xs text-slate-400">Manage checking, high-yield savings, credit card liabilities, and investment portfolios</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-100">No Accounts Added</h3>
            <p className="text-xs text-slate-400">Add your checking, savings, or credit accounts to calculate your net worth and track cash flow.</p>
          </div>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Account
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const cardColor = getAccountColor(acc.type);
            return (
              <Card key={acc.id} hoverable className="space-y-4 border-slate-800 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                      style={{ backgroundColor: cardColor }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">{acc.name}</h4>
                      </div>
                      {/* Masked account number everywhere except inside edit modal */}
                      <p className="text-[11px] text-slate-400 font-mono tracking-wider">
                        {maskAccountNumber(acc.accountNumber)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    <Badge variant="purple" className="mr-1 text-[10px]">
                      {getAccountTypeLabel(acc.type)}
                    </Badge>
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors"
                      title="Edit Account"
                      aria-label={`Edit ${acc.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Account"
                      aria-label={`Delete ${acc.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Current Balance</span>
                    <h3 className={`text-2xl font-extrabold tracking-tight ${acc.type === 'CREDIT_CARD' || acc.type === 'LOAN' ? 'text-rose-400' : 'text-white'}`}>
                      {formatCurrency(acc.balance, acc.currency)}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{acc.currency || 'USD'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Bank / Institution"
            placeholder="e.g. Chase, Vanguard, Fidelity"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            required
          />
          <Select
            label="Account Type"
            value={createForm.type}
            onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
            options={[
              { value: 'CHECKING', label: 'Checking Account' },
              { value: 'SAVINGS', label: 'High-Yield Savings' },
              { value: 'CREDIT_CARD', label: 'Credit Card' },
              { value: 'INVESTMENT', label: 'Investment Portfolio' },
              { value: 'CASH', label: 'Cash Wallet' },
              { value: 'LOAN', label: 'Loan Liability' },
            ]}
          />
          <Input
            label="Current Balance ($)"
            type="number"
            step="0.01"
            placeholder="5000.00"
            value={createForm.balance}
            onChange={(e) => setCreateForm({ ...createForm, balance: e.target.value })}
            required
          />
          <Input
            label="Account Number (Masked on cards as ••••1234)"
            placeholder="e.g. 8842 or 12345678"
            value={createForm.accountNumber}
            onChange={(e) => setCreateForm({ ...createForm, accountNumber: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title={`Edit Account — ${editingAccount?.name || ''}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Bank / Institution"
            placeholder="e.g. Chase, Vanguard, Fidelity"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Select
            label="Account Type"
            value={editForm.type}
            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            options={[
              { value: 'CHECKING', label: 'Checking Account' },
              { value: 'SAVINGS', label: 'High-Yield Savings' },
              { value: 'CREDIT_CARD', label: 'Credit Card' },
              { value: 'INVESTMENT', label: 'Investment Portfolio' },
              { value: 'CASH', label: 'Cash Wallet' },
              { value: 'LOAN', label: 'Loan Liability' },
            ]}
          />
          <Input
            label="Current Balance ($)"
            type="number"
            step="0.01"
            placeholder="5000.00"
            value={editForm.balance}
            onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
            required
          />
          {/* Account Number in edit mode displays unmasked value */}
          <Input
            label="Account Number (Unmasked in edit mode)"
            placeholder="e.g. 8842 or 12345678"
            value={editForm.accountNumber}
            onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingAccount(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingAccount} onClose={() => setDeletingAccount(null)} title="Confirm Account Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <h5 className="font-bold text-rose-200">Delete {deletingAccount?.name}?</h5>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-white">{deletingAccount?.name}</span>? This action cannot be undone. Linked transaction records will remain in your ledger but will no longer contribute to this account's balance.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setDeletingAccount(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteConfirm}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
