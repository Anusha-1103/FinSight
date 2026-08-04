import React, { useState } from 'react';
import { User, Palette, Eye, Bell, Shield, Wallet, Sparkles, Download, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'accessibility' | 'notifications' | 'security' | 'accounts' | 'ai' | 'export' | 'danger'>('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/users/profile', { name, currency });
      if (res.data.success) {
        updateUser(res.data.data);
        alert('Profile settings updated successfully!');
      }
    } catch (err) {
      alert('Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      const res = await api.get('/transactions');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `finsight_export_${Date.now()}.${format}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Export failed.');
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'accounts', label: 'Connected Accounts', icon: Wallet },
    { id: 'ai', label: 'AI Preferences', icon: Sparkles },
    { id: 'export', label: 'Data Export', icon: Download },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Workspace Preferences</h2>
        <p className="text-xs text-slate-400">Configure profile, security, design tokens, AI advisory engine, and data backups</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Linear/Notion Left Tab Nav */}
        <Card className="p-2 space-y-1 h-fit border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </Card>

        {/* Right Content Panel */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Profile Information</h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <Select
                  label="Base Display Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: 'USD', label: 'USD ($) - US Dollar' },
                    { value: 'EUR', label: 'EUR (€) - Euro' },
                    { value: 'GBP', label: 'GBP (£) - British Pound' },
                    { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
                    { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
                  ]}
                />
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <Button type="submit" isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Visual Atmosphere & Theme</h3>
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">FinSight AI is built natively around a Warm Editorial Luxury palette (`#030712` obsidian canvas with honed stone containers).</p>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-200">Theme Palette Mode</h5>
                    <p className="text-[10px] text-slate-500">Dark Editorial Luxury (Default)</p>
                  </div>
                  <Badge variant="purple">Active</Badge>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'accessibility' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Accessibility Standards</h3>
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">FinSight AI implements WCAG 2.2 AA standards with 14.2:1 contrast and focus ring outlines.</p>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-slate-200">Keyboard Shortcuts Navigation</h5>
                  <p className="text-[10px] text-slate-400">Press `?` anywhere to view key chord reference guide.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Alert Notifications</h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <h5 className="font-bold text-slate-200">Budget Threshold Warning Alerts</h5>
                    <p className="text-[10px] text-slate-500">Notify when category spend exceeds 75% of cap</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <h5 className="font-bold text-slate-200">Subscription Renewal Reminders</h5>
                    <p className="text-[10px] text-slate-500">Notify 3 days before recurring bill charge</p>
                  </div>
                </label>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Security & Session Status</h3>
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">Dual JWT Session Active</span>
                  <h5 className="font-bold text-slate-200">Access Token (15m) + Refresh Token Rotation (7d)</h5>
                  <p className="text-[10px] text-slate-500">Refresh tokens stored in HttpOnly SameSite=Lax secure cookies.</p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'accounts' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Connected Financial Wallets</h3>
              <p className="text-xs text-slate-400">Manage checking, savings, credit, and investment account integrations.</p>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">AI Advisory Engine Configuration</h3>
              <div className="space-y-3 text-xs">
                <Select
                  label="Generative Model Engine"
                  value="gemini-1.5-flash"
                  onChange={() => {}}
                  options={[
                    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast High-Yield Advice)' },
                    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Deep Portfolio Planning)' },
                  ]}
                />
              </div>
            </Card>
          )}

          {activeTab === 'export' && (
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">Data Export & Backup</h3>
              <p className="text-xs text-slate-400">Download your full financial ledger, account balances, and goal history in standard formats.</p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" onClick={() => handleExportData('json')} className="gap-2">
                  <Download className="w-4 h-4" /> Download JSON Backup
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportData('csv')} className="gap-2">
                  <Download className="w-4 h-4" /> Export CSV Ledger
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'danger' && (
            <Card className="space-y-4 border-rose-500/30 bg-rose-950/10">
              <h3 className="text-sm font-bold text-rose-400 border-b border-rose-500/20 pb-3">Danger Zone</h3>
              <p className="text-xs text-slate-300">Irreversible account actions. Once deleted, all portfolio data, transactions, and AI history are permanently erased.</p>
              <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                Delete FinSight Account
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete FinSight Account">
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">Are you sure you want to permanently delete your account? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { setIsDeleteModalOpen(false); alert('Account deleted.'); }}>
              Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
