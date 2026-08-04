import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ArrowRight, ShieldCheck, DollarSign, Target, Globe } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [initialAccountName, setInitialAccountName] = useState('Primary Checking');
  const [initialBalance, setInitialBalance] = useState('5000');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Emergency Reserve']);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await api.put('/users/profile', { currency });
      updateUser({ currency });

      if (initialBalance) {
        await api.post('/accounts', {
          name: initialAccountName,
          type: 'CHECKING',
          balance: parseFloat(initialBalance),
          currency,
        });
      }

      onClose();
    } catch (err) {
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg glass-panel border border-slate-800 rounded-2xl p-6 relative z-10 shadow-2xl space-y-6"
        >
          {/* Header Progress indicator */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Welcome to FinSight AI</h3>
            </div>
            <span className="text-xs font-mono text-indigo-400">Step {step} of 3</span>
          </div>

          {/* Step 1: Base Currency & Personalization */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-100">Choose Your Base Currency</h4>
                <p className="text-xs text-slate-400">All portfolio balances and AI insights will be formatted in your primary currency.</p>
              </div>

              <Select
                label="Primary Portfolio Currency"
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

              <div className="pt-4 flex justify-end">
                <Button size="sm" onClick={() => setStep(2)} className="gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Primary Account Setup */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-100">Connect Your Primary Account</h4>
                <p className="text-xs text-slate-400">Set up your initial checking or liquid savings balance to calculate your Financial Health Score.</p>
              </div>

              <Input
                label="Account Name"
                placeholder="e.g. Chase Primary Checking"
                value={initialAccountName}
                onChange={(e) => setInitialAccountName(e.target.value)}
              />

              <Input
                label="Initial Balance ($)"
                type="number"
                placeholder="5000"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button size="sm" onClick={() => setStep(3)} className="gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Financial Goals Selection */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-100">Select Your Wealth Intentions</h4>
                <p className="text-xs text-slate-400">FinSight AI will tailor budget velocity recommendations around your long-term goals.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  'Emergency Reserve',
                  'Home Down Payment',
                  'Travel Fund',
                  'Debt Payoff',
                  'Retirement Fund',
                  'Investment Reserve',
                ].map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{goal}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button size="sm" onClick={handleFinish} isLoading={isLoading}>
                  Launch FinSight AI Workspace
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
