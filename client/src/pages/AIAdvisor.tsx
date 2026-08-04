import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';
import { AIInsight } from '../types';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const AIAdvisor: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/ai/insights');
      if (res.data.success) {
        setInsights(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            FinSight AI Financial Advisory Engine
            <Badge variant="purple">Gemini 2.5 Active</Badge>
          </h2>
          <p className="text-xs text-slate-400">Automated spending anomaly detection, cash flow optimization, and wealth building intelligence</p>
        </div>
      </div>

      {/* Main AI Insights Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card
              key={insight.id}
              className={`p-5 space-y-2 border transition-all ${
                insight.category === 'ANOMALY'
                  ? 'border-rose-500/30 bg-rose-950/10'
                  : insight.category === 'SAVING_TIP'
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : 'border-indigo-500/30 bg-indigo-950/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      insight.category === 'ANOMALY'
                        ? 'bg-rose-500/20 text-rose-400'
                        : insight.category === 'SAVING_TIP'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    {insight.category === 'ANOMALY' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Lightbulb className="w-5 h-5" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{insight.title}</h4>
                </div>
                <Badge
                  variant={
                    insight.category === 'ANOMALY' ? 'danger' : insight.category === 'SAVING_TIP' ? 'success' : 'purple'
                  }
                >
                  {insight.category}
                </Badge>
              </div>

              <p className="text-xs text-slate-300 pl-12 leading-relaxed">{insight.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
