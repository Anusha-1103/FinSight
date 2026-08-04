import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Sunrise } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

export interface DailyReflectionProps {
  score: number;
  grade: string;
  recommendation: string;
}

export const DailyReflectionWidget: React.FC<DailyReflectionProps> = ({ score, grade, recommendation }) => {
  const { user } = useAuth();
  const hour = new Date().getHours();

  let greeting = 'Good evening';
  let Icon = Moon;

  if (hour < 12) {
    greeting = 'Good morning';
    Icon = Sunrise;
  } else if (hour < 18) {
    greeting = 'Good afternoon';
    Icon = Sun;
  }

  const quotes = [
    "\"Wealth consists not in having great possessions, but in having few wants.\" — Epictetus",
    "\"It is not the man who has too little, but the man who craves more, that is poor.\" — Seneca",
    "\"Small daily discipline compounds into profound long-term freedom.\" — FinSight Reflection",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">
              {greeting}, <span className="text-indigo-400">{user?.name}</span>
            </h3>
            <Badge variant="purple">Score: {score}/100 Grade {grade}</Badge>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-serif italic">{recommendation}</p>
          <p className="text-[11px] text-slate-500 font-mono pt-1">{randomQuote}</p>
        </div>
      </div>
    </motion.div>
  );
};
