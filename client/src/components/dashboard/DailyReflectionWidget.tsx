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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white border border-stone-200 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-stone-900">
              {greeting}, <span className="font-serif text-sm font-black text-stone-950">{user?.name}</span>
            </h3>
            <Badge variant="purple">Score: {score}/100 • Grade {grade}</Badge>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed font-serif italic">{recommendation}</p>
          <p className="text-[9px] text-stone-400 font-mono tracking-wide pt-0.5">{randomQuote}</p>
        </div>
      </div>
    </motion.div>
  );
};
