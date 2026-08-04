import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Send,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const AIAdvisor: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch AI Summary Report using React Query
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['ai-summary'],
    queryFn: async () => {
      const res = await api.get('/ai/summary');
      return res.data.data;
    },
  });

  const scrollChatToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollChatToBottom();
    }
  }, [chatMessages, activeTab]);

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend.trim(),
        conversationId: conversationId || undefined,
      });

      if (res.data.success) {
        const reply = res.data.data.message;
        setConversationId(res.data.data.conversationId);
        
        setChatMessages((prev) => [
          ...prev,
          {
            id: reply.id,
            role: 'assistant',
            content: reply.content,
            createdAt: reply.createdAt,
          },
        ]);
        
        // Invalidate related dashboard metrics
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.error || 'Failed to retrieve AI advice.', 'danger');
    } finally {
      setIsSending(false);
    }
  };

  // Custom inline Markdown parser to style text outputs beautifully
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    let inList = false;
    let listItems: React.ReactNode[] = [];
    const renderedElements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      let cleanLine = line.trim();
      
      // Handle unordered lists
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const itemText = cleanLine.substring(2);
        listItems.push(
          <li
            key={`li-${index}`}
            className="list-disc ml-5 mb-1 text-slate-300 text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseInlineStyles(itemText) }}
          />
        );
        return;
      } else {
        if (inList) {
          inList = false;
          renderedElements.push(
            <ul key={`ul-${index}`} className="space-y-1 my-2">
              {listItems}
            </ul>
          );
        }
      }
      
      // Handle Headers
      if (cleanLine.startsWith('### ')) {
        renderedElements.push(
          <h4 key={index} className="text-xs font-extrabold text-indigo-400 mt-4 mb-2 tracking-wide uppercase">
            {cleanLine.substring(4)}
          </h4>
        );
      } else if (cleanLine.startsWith('## ')) {
        renderedElements.push(
          <h3 key={index} className="text-sm font-bold text-white mt-5 mb-3 border-b border-slate-800 pb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            {cleanLine.substring(3)}
          </h3>
        );
      } else if (cleanLine.startsWith('# ')) {
        renderedElements.push(
          <h2 key={index} className="text-base font-black text-white mt-6 mb-4">
            {cleanLine.substring(2)}
          </h2>
        );
      } else if (cleanLine === '') {
        renderedElements.push(<div key={index} className="h-1.5" />);
      } else {
        renderedElements.push(
          <p
            key={index}
            className="text-xs text-slate-300 leading-relaxed mb-2.5"
            dangerouslySetInnerHTML={{ __html: parseInlineStyles(cleanLine) }}
          />
        );
      }
    });
    
    if (inList) {
      renderedElements.push(
        <ul key="ul-final" className="space-y-1 my-2">
          {listItems}
        </ul>
      );
    }
    
    return <div className="markdown-content">{renderedElements}</div>;
  };

  const parseInlineStyles = (text: string): string => {
    // Bold tags
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    // Backticks inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[10px] text-pink-400">$1</code>');
    return html;
  };

  if (isLoadingSummary) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isErrorSummary || !summaryData) {
    return (
      <Card className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Failed to connect to AI summary engine</h3>
        <p className="text-slate-400 text-xs">Ensure your server environment has a valid GEMINI_API_KEY configured.</p>
        <Button size="sm" onClick={() => refetchSummary()} className="gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </Card>
    );
  }

  const { summaryMarkdown, context } = summaryData;
  const savingsRate = context.savingsRate || 0;

  const suggestedPrompts = [
    'Analyze my spending',
    'How can I save more?',
    'Review my subscriptions',
    'Am I overspending?',
    'What should I improve?',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          FinSight AI Financial Advisor
          <Badge variant="purple" className="font-mono text-[10px] uppercase">
            Gemini Active
          </Badge>
        </h2>
        <p className="text-xs text-slate-400">Contextual deep analytical wealth strategist mapping cash inflows, budget caps, and savings progression</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Financial Health Summary Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Health Index Card */}
          <Card className="border-indigo-500/10 hover:border-indigo-500/20 transition-colors">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Financial Health Index
            </h3>
            
            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Net Worth</span>
                <span className="font-bold text-white text-sm">{formatCurrency(context.netWorth)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Monthly Inflow</span>
                <span className="font-bold text-emerald-400">{formatCurrency(context.monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Monthly Outflow</span>
                <span className="font-bold text-rose-400">{formatCurrency(context.monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans">Cash Flow Surplus</span>
                <span className="font-bold text-blue-400">{formatCurrency(context.cashFlow)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Savings Rate</span>
                <span className="font-bold text-purple-400">{savingsRate}%</span>
              </div>

              {/* Savings Rate Bar */}
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 10 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Connected Accounts Card */}
          <Card className="border-indigo-500/10">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Connected Accounts
            </h3>
            <div className="space-y-3.5 max-h-56 overflow-y-auto text-xs pr-1">
              {context.accounts.map((acc: any, index: number) => (
                <div key={index} className="flex items-center justify-between font-mono">
                  <div>
                    <h5 className="font-semibold text-slate-200 truncate max-w-[140px] font-sans">{acc.name}</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">{acc.maskedNumber} • {acc.type}</p>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Budgets & Goals Card */}
          <Card className="border-indigo-500/10">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              Goal Progression
            </h3>
            <div className="space-y-4">
              {context.goals.slice(0, 3).map((g: any, index: number) => (
                <div key={index} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-300 font-sans truncate max-w-[160px] font-semibold">{g.name}</span>
                    <span className="text-slate-400 font-bold">{g.status}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((g.current / g.target) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Tabbed Interface - Analysis vs Chat */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tab Navigation buttons */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'analysis'
                  ? 'border-indigo-500 text-white font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Advisor Analysis Report
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-indigo-500 text-white font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Interactive Chat
            </button>
          </div>

          {activeTab === 'analysis' ? (
            <Card className="border-slate-800/80 p-6 space-y-4 max-h-[640px] overflow-y-auto bg-slate-950/20 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-sm text-slate-200">Personal Health Evaluation Report</h4>
                <Button size="sm" variant="ghost" onClick={() => refetchSummary()} className="gap-1 text-slate-400">
                  <RefreshCw className="w-3 h-3" /> Refresh Report
                </Button>
              </div>
              <div className="prose prose-invert max-w-none">
                {renderMarkdown(summaryMarkdown)}
              </div>
            </Card>
          ) : (
            <Card className="border-slate-800/80 flex flex-col h-[600px] justify-between p-0 bg-slate-950/15 overflow-hidden">
              {/* Chat Message Window */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px]">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5 max-w-md mx-auto pt-12">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Start a Financial Conversation</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Ask about your cash flow velocity, affordability for upcoming purchases, or strategies to optimization recurring subscriptions.
                      </p>
                    </div>

                    {/* Suggested Prompt Pills */}
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {suggestedPrompts.map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => handleSendPrompt(promptText)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-[10px] text-indigo-300 font-mono transition-colors"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-md font-sans'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none prose prose-invert'
                          }`}
                        >
                          {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                        </div>
                      </div>
                    ))}

                    {/* Typing Animation */}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input Bar */}
              <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask advisor..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputValue)}
                  disabled={isSending}
                  className="flex-1 bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendPrompt(inputValue)}
                  disabled={!inputValue.trim() || isSending}
                  className="shrink-0 rounded-xl px-3.5 h-9"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
