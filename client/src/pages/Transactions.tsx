import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ScanLine, Receipt as ReceiptIcon, Trash2, Pencil, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Transaction, Account, Category } from '../types';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Forms State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [addForm, setAddForm] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    description: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    status: 'COMPLETED' as 'COMPLETED' | 'PENDING',
  });

  const [editForm, setEditForm] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    description: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    status: 'COMPLETED' as 'COMPLETED' | 'PENDING',
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

  useEffect(() => {
    fetchInitialOptions();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [search, selectedAccount, selectedCategory, selectedType, selectedStatus, startDate, endDate, sortBy, sortOrder, page]);

  const fetchInitialOptions = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
      ]);

      if (accRes.data.success) {
        setAccounts(accRes.data.data);
        if (accRes.data.data.length > 0 && !addForm.accountId) {
          setAddForm((prev) => ({ ...prev, accountId: accRes.data.data[0].id }));
        }
      }

      if (catRes.data.success) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load transaction initial options:', err);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: {
          search,
          accountId: selectedAccount,
          categoryId: selectedCategory,
          type: selectedType,
          status: selectedStatus,
          startDate,
          endDate,
          sortBy,
          sortOrder,
          page,
          limit: 15,
        },
      });

      if (res.data.success) {
        setTransactions(res.data.data.transactions);
        setTotalPages(res.data.data.pagination.totalPages);
        setTotalCount(res.data.data.pagination.total);
      }
    } catch (err: any) {
      console.error('Failed to load transaction ledger:', err);
      showToast('Error', 'Unable to fetch transaction records.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const invalidateGlobalQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.accountId) {
      showToast('Validation Warning', 'Please select or add an account first.', 'warning');
      return;
    }
    if (!addForm.categoryId) {
      showToast('Validation Warning', 'Please select a category.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/transactions', addForm);
      if (res.data.success) {
        showToast('Transaction Saved', `Entry of ${formatCurrency(parseFloat(addForm.amount))} logged successfully.`, 'success');
        setIsAddModalOpen(false);
        setAddForm({
          accountId: accounts[0]?.id || '',
          categoryId: '',
          amount: '',
          type: 'EXPENSE',
          description: '',
          merchant: '',
          date: new Date().toISOString().split('T')[0],
          status: 'COMPLETED',
        });
        invalidateGlobalQueries();
        fetchTransactions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to save transaction.';
      showToast('Save Error', msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditForm({
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      amount: tx.amount.toString(),
      type: tx.type as 'EXPENSE' | 'INCOME',
      description: tx.description,
      merchant: tx.merchant || '',
      date: tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: tx.status || 'COMPLETED',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setIsSubmitting(true);
    try {
      const res = await api.put(`/transactions/${editingTransaction.id}`, editForm);
      if (res.data.success) {
        showToast('Transaction Updated', 'Record updated and account balances recalculated.', 'success');
        setEditingTransaction(null);
        invalidateGlobalQueries();
        fetchTransactions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update transaction.';
      showToast('Update Error', msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/transactions/${deletingTransaction.id}`);
      if (res.data.success) {
        showToast('Transaction Deleted', 'Record removed and account balance restored.', 'info');
        setDeletingTransaction(null);
        invalidateGlobalQueries();
        fetchTransactions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete transaction.';
      showToast('Delete Error', msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) return;
    setIsScanning(true);
    try {
      const data = new FormData();
      data.append('receipt', receiptFile);

      const res = await api.post('/transactions/scan-receipt', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setScannedResult(res.data.data);
        const { suggestedTransaction } = res.data.data;
        setAddForm((prev) => ({
          ...prev,
          merchant: suggestedTransaction.merchant || prev.merchant,
          amount: suggestedTransaction.amount ? suggestedTransaction.amount.toString() : prev.amount,
          description: `Scanned Receipt: ${suggestedTransaction.merchant || 'Expense'}`,
          date: suggestedTransaction.date || prev.date,
        }));
        showToast('OCR Complete', 'Receipt parsed cleanly into transaction fields.', 'success');
      }
    } catch (err: any) {
      showToast('OCR Warning', 'Receipt parsing failed. Using standard entry form.', 'warning');
    } finally {
      setIsScanning(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedAccount('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  // Filter categories by type for Add and Edit dialogs
  const availableAddCategories = categories.filter((c) => c.type === addForm.type || !c.type);
  const availableEditCategories = categories.filter((c) => c.type === editForm.type || !c.type);

  return (
    <div className="space-y-6">
      {/* Top Page Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Transactions</h2>
          <p className="text-xs text-slate-400">Complete transaction ledger backed by PostgreSQL with real-time balance calculations</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setIsScanModalOpen(true)}
            className="gap-2 text-indigo-300 border-indigo-500/30"
          >
            <ScanLine className="w-4 h-4 text-indigo-400" /> AI Receipt OCR
          </Button>

          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Reset */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search merchant or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={selectedAccount}
            onChange={(e) => { setSelectedAccount(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Accounts' },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />

          <Select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Types (Income & Expense)' },
              { value: 'EXPENSE', label: 'Expense Outflows' },
              { value: 'INCOME', label: 'Income Inflows' },
            ]}
          />
        </div>

        {/* Secondary Filter Row: Status, Date Range & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'PENDING', label: 'Pending' },
              ]}
              className="w-36 text-xs"
            />

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(search || selectedAccount || selectedCategory || selectedType || selectedStatus || startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-slate-400 text-xs">
                <X className="w-3.5 h-3.5" /> Clear Filters
              </Button>
            )}
            <Select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              options={[
                { value: 'date-desc', label: 'Sort: Newest First' },
                { value: 'date-asc', label: 'Sort: Oldest First' },
                { value: 'amount-desc', label: 'Sort: Highest Amount' },
                { value: 'amount-asc', label: 'Sort: Lowest Amount' },
              ]}
              className="w-44 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Transactions Data Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
              <ReceiptIcon className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-100">No Transactions Found</h3>
              <p className="text-xs text-slate-400">
                {search || selectedAccount || selectedCategory || selectedType || selectedStatus || startDate || endDate
                  ? 'No records match your active search and filter criteria.'
                  : 'Start logging your income and expenses to track your financial activity.'}
              </p>
            </div>
            {search || selectedAccount || selectedCategory || selectedType || selectedStatus || startDate || endDate ? (
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear Active Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Add Transaction
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold font-mono">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Merchant / Entry</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Account</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="p-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-slate-100">{tx.description}</div>
                            {tx.merchant && <div className="text-[10px] text-slate-400 font-normal">{tx.merchant}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="purple">{tx.category?.name || 'General'}</Badge>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">
                        {tx.account?.name || 'Primary'}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'} className="text-[10px]">
                          {tx.status || 'COMPLETED'}
                        </Badge>
                      </td>
                      <td className={`p-4 text-right font-mono font-extrabold text-sm whitespace-nowrap ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors"
                            title="Edit Record"
                            aria-label={`Edit ${tx.description}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTransaction(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Record"
                            aria-label={`Delete ${tx.description}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing <span className="font-bold text-slate-200">{transactions.length}</span> of <span className="font-bold text-slate-200">{totalCount}</span> records
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 px-2.5 py-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <span className="font-mono text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 px-2.5 py-1 text-xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Transaction Entry">
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Transaction Type"
              value={addForm.type}
              onChange={(e) => {
                const newType = e.target.value as 'EXPENSE' | 'INCOME';
                setAddForm({ ...addForm, type: newType, categoryId: '' });
              }}
              options={[
                { value: 'EXPENSE', label: 'Expense Outflow (-)' },
                { value: 'INCOME', label: 'Income Inflow (+)' },
              ]}
            />
            <Select
              label="Account"
              value={addForm.accountId}
              onChange={(e) => setAddForm({ ...addForm, accountId: e.target.value })}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={addForm.categoryId}
              onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
              options={[
                { value: '', label: '-- Select Category --' },
                ...availableAddCategories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description / Title"
            placeholder="e.g. Weekly organic groceries, Client invoice"
            value={addForm.description}
            onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
            required
          />

          <Input
            label="Merchant / Store (Optional)"
            placeholder="e.g. Whole Foods, Netflix, Tech Corp"
            value={addForm.merchant}
            onChange={(e) => setAddForm({ ...addForm, merchant: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={addForm.date}
              onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
              required
            />
            <Select
              label="Status"
              value={addForm.status}
              onChange={(e) => setAddForm({ ...addForm, status: e.target.value as any })}
              options={[
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal isOpen={!!editingTransaction} onClose={() => setEditingTransaction(null)} title="Edit Transaction Entry">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Transaction Type"
              value={editForm.type}
              onChange={(e) => {
                const newType = e.target.value as 'EXPENSE' | 'INCOME';
                setEditForm({ ...editForm, type: newType, categoryId: '' });
              }}
              options={[
                { value: 'EXPENSE', label: 'Expense Outflow (-)' },
                { value: 'INCOME', label: 'Income Inflow (+)' },
              ]}
            />
            <Select
              label="Account"
              value={editForm.accountId}
              onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={editForm.categoryId}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              options={[
                { value: '', label: '-- Select Category --' },
                ...availableEditCategories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              label="Amount ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              required
            />
          </div>

          <Input
            label="Description / Title"
            placeholder="e.g. Weekly organic groceries"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            required
          />

          <Input
            label="Merchant / Store"
            placeholder="e.g. Whole Foods, Netflix"
            value={editForm.merchant}
            onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              required
            />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
              options={[
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEditingTransaction(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingTransaction} onClose={() => setDeletingTransaction(null)} title="Confirm Transaction Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <h5 className="font-bold text-rose-200">Delete Record?</h5>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Are you sure you want to delete the transaction entry for <span className="font-bold text-white">{deletingTransaction?.description}</span> ({formatCurrency(deletingTransaction?.amount || 0)})? This will automatically recalculate and restore your account balance in PostgreSQL.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setDeletingTransaction(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={isSubmitting} onClick={handleDeleteConfirm}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* Gemini AI Receipt OCR Modal */}
      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="Gemini AI Receipt OCR Extractor">
        <form onSubmit={handleScanReceipt} className="space-y-4">
          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3 bg-slate-900/40">
            <ReceiptIcon className="w-10 h-10 text-indigo-400 mx-auto animate-bounce" />
            <div>
              <p className="text-xs font-bold text-slate-200">Upload Receipt Image or Drop File</p>
              <p className="text-[10px] text-slate-400">Gemini vision engine will extract merchant, total amount & date</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
          </div>

          {scannedResult && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
              <h5 className="font-bold text-emerald-400">OCR Extraction Success</h5>
              <p className="text-slate-300">Merchant: {scannedResult.suggestedTransaction.merchant}</p>
              <p className="text-slate-300">Amount: ${scannedResult.suggestedTransaction.amount}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsScanModalOpen(false)}>
              Close
            </Button>
            <Button type="submit" isLoading={isScanning}>
              Process Receipt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
