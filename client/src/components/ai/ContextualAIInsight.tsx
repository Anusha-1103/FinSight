import React from 'react';
import { Sparkles } from 'lucide-react';

export interface ContextualAIInsightProps {
  topic: string;
  insightText: string;
}

export const ContextualAIInsight: React.FC<ContextualAIInsightProps> = ({ topic, insightText }) => {
  return (
    <div className="p-4 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-950/20 flex items-start gap-3 text-xs">
      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>
      <div>
        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px] font-mono block mb-0.5">
          FinSight AI Analysis • {topic}
        </span>
        <p className="text-slate-300 leading-relaxed">{insightText}</p>
      </div>
    </div>
  );
};
