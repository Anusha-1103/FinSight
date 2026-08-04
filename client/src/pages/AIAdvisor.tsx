import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Lightbulb,
  Send,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
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

  // Custom inline Markdown parser to style text outputs beautifully (Apple/Stripe style)
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
            className="list-disc ml-5 mb-2 text-stone-700 text-xs leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseInlineStyles(itemText) }}
          />
        );
        return;
      } else {
        if (inList) {
          inList = false;
          renderedElements.push(
            <ul key={`ul-${index}`} className="space-y-1.5 my-3">
              {listItems}
            </ul>
          );
        }
      }
      
      // Handle Headers
      if (cleanLine.startsWith('### ')) {
        renderedElements.push(
          <h4 key={index} className="text-[10px] font-bold text-stone-500 font-mono mt-5 mb-2.5 tracking-wider uppercase">
            {cleanLine.substring(4)}
          </h4>
        );
      } else if (cleanLine.startsWith('## ')) {
        renderedElements.push(
          <h3 key={index} className="text-sm font-bold text-stone-900 mt-6 mb-3 border-b border-stone-200 pb-1.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8F9779] shrink-0" />
            {cleanLine.substring(3)}
          </h3>
        );
      } else if (cleanLine.startsWith('# ')) {
        renderedElements.push(
          <h2 key={index} className="font-serif text-lg font-black text-stone-950 mt-8 mb-4 border-b border-stone-200 pb-2">
            {cleanLine.substring(2)}
          </h2>
        );
      } else if (cleanLine === '') {
        renderedElements.push(<div key={index} className="h-2" />);
      } else {
        renderedElements.push(
          <p
            key={index}
            className="text-xs text-stone-750 leading-relaxed mb-3 font-sans"
            dangerouslySetInnerHTML={{ __html: parseInlineStyles(cleanLine) }}
          />
        );
      }
    });
    
    if (inList) {
      renderedElements.push(
        <ul key="ul-final" className="space-y-1.5 my-3">
          {listItems}
        </ul>
      );
    }
    
    return <div className="markdown-content">{renderedElements}</div>;
  };

  const parseInlineStyles = (text: string): string => {
    // Bold tags to Dark Brown
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-950">$1</strong>');
    // Backticks inline code to editorial block style
    html = html.replace(/`(.*?)`/g, '<code class="bg-[#F3F0E9] border border-[#E7E3DB] px-1.5 py-0.5 rounded font-mono text-[10px] text-[#B08D57]">$1</code>');
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
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isErrorSummary || !summaryData) {
    return (
      <Card className="p-12 text-center space-y-4 max-w-lg mx-auto my-12 bg-white border border-[#E7E3DB]">
        <AlertCircle className="w-10 h-10 text-stone-600 mx-auto" />
        <h3 className="text-sm font-bold text-stone-900">Failed to connect to AI summary engine</h3>
        <p className="text-stone-500 text-xs leading-relaxed">Ensure your server environment has a valid GEMINI_API_KEY configured.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-black text-stone-950 tracking-tight flex items-center gap-2.5 leading-none">
            Advisor AI
            <Badge variant="purple" className="font-mono text-[9px] uppercase font-bold tracking-wider">
              Gemini 2.5
            </Badge>
          </h2>
          <p className="text-xs text-stone-600 mt-1">Contextual analytics portfolio advisor reviewing savings velocity, cash flow surpluses, and budget progression</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Financial Health Summary Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Health Index Card */}
          <Card className="border border-[#E7E3DB] bg-white shadow-xs p-6">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4.5 h-4.5 text-[#8F9779]" />
              Financial Statistics
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                <span className="text-stone-500">Net Worth</span>
                <span className="font-bold text-stone-900 font-mono text-xs">{formatCurrency(context.netWorth)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                <span className="text-stone-500">Monthly Inflow</span>
                <span className="font-bold text-[#2E7D32] font-mono text-xs">{formatCurrency(context.monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                <span className="text-stone-500">Monthly Outflow</span>
                <span className="font-bold text-[#C65D4A] font-mono text-xs">{formatCurrency(context.monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                <span className="text-stone-500">Surplus Cash Flow</span>
                <span className="font-bold text-stone-850 font-mono text-xs">{formatCurrency(context.cashFlow)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Savings Ratio</span>
                <span className="font-bold text-stone-900 font-mono text-xs">{savingsRate}%</span>
              </div>

              {/* Savings Rate Bar */}
              <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full ${
                    savingsRate >= 20 ? 'bg-[#2E7D32]' : savingsRate >= 10 ? 'bg-[#B08D57]' : 'bg-[#C65D4A]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Connected Accounts Card */}
          <Card className="border border-[#E7E3DB] bg-white shadow-xs p-6">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#2E7D32]" />
              Linked Portfolios
            </h3>
            <div className="space-y-3.5 max-h-56 overflow-y-auto text-xs pr-1">
              {context.accounts.map((acc: any, index: number) => (
                <div key={index} className="flex items-center justify-between font-mono text-[11px]">
                  <div>
                    <h5 className="font-semibold text-stone-850 truncate max-w-[130px] font-sans text-xs">{acc.name}</h5>
                    <p className="text-[9px] text-stone-500 mt-0.5 font-mono">{acc.maskedNumber} • {acc.type}</p>
                  </div>
                  <span className="font-bold text-stone-900">{formatCurrency(acc.balance)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Budgets & Goals Card */}
          <Card className="border border-[#E7E3DB] bg-white shadow-xs p-6">
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2 mb-4">
              <Lightbulb className="w-4.5 h-4.5 text-[#B08D57]" />
              Savings Milestones
            </h3>
            <div className="space-y-4">
              {context.goals.slice(0, 3).map((g: any, index: number) => (
                <div key={index} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-stone-800 font-sans truncate max-w-[150px] font-semibold">{g.name}</span>
                    <span className="text-stone-500 font-bold uppercase text-[9px] tracking-wider">{g.status}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-stone-850 rounded-full"
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
          {/* Tab Navigation Segmented Control */}
          <div className="bg-[#F3F0E9] p-1 rounded-lg flex gap-1 border border-[#E7E3DB] w-fit">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'analysis'
                  ? 'bg-white text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Evaluation Report
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-white text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Advisory Chat
            </button>
          </div>

          {activeTab === 'analysis' ? (
            <Card className="border border-[#E7E3DB] p-8 space-y-6 max-h-[640px] overflow-y-auto bg-white shadow-sm leading-relaxed">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="font-bold text-xs text-stone-900 uppercase font-mono tracking-wider">Health Index Evaluation</h4>
                <Button size="sm" variant="ghost" onClick={() => refetchSummary()} className="gap-1.5 text-stone-500 hover:text-stone-950 h-8">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </Button>
              </div>
              <div className="prose prose-stone max-w-none text-stone-900">
                {renderMarkdown(summaryMarkdown)}
              </div>
            </Card>
          ) : (
            <Card className="border border-[#E7E3DB] flex flex-col h-[600px] justify-between p-0 bg-white shadow-sm overflow-hidden rounded-xl">
              {/* Chat Message Window */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[490px]">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto pt-16">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center shadow-xs">
                      <Sparkles className="w-5 h-5 text-[#8F9779]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">Financial Consultation</h4>
                      <p className="text-[11px] text-stone-600 mt-2 leading-relaxed font-sans">
                        Ask about your cash flow surplus margins, purchase planning constraints, or asset reallocation models directly.
                      </p>
                    </div>

                    {/* Suggested Prompt Pills */}
                    <div className="flex flex-wrap gap-2 justify-center pt-3">
                      {suggestedPrompts.map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => handleSendPrompt(promptText)}
                          className="px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-[10px] text-stone-700 font-medium transition-colors shadow-xs"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-xs ${
                            msg.role === 'user'
                              ? 'bg-stone-900 text-white rounded-br-none font-sans'
                              : 'bg-[#F3F0E9] border border-[#E7E3DB] text-stone-900 rounded-bl-none font-sans'
                          }`}
                        >
                          {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                        </div>
                      </div>
                    ))}

                    {/* Typing Animation */}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="bg-[#F3F0E9] border border-[#E7E3DB] rounded-2xl rounded-bl-none px-4 py-3.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input Bar */}
              <div className="p-3.5 border-t border-stone-200/80 bg-stone-50/50 flex items-center gap-3.5">
                <input
                  type="text"
                  placeholder="Ask advisor..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputValue)}
                  disabled={isSending}
                  className="flex-1 bg-white border border-[#E7E3DB] rounded-lg px-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#8F9779]/20 focus:border-[#8F9779] disabled:opacity-50 font-sans shadow-inner"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendPrompt(inputValue)}
                  disabled={!inputValue.trim() || isSending}
                  className="shrink-0 rounded-lg px-4 h-10.5 font-bold tracking-wider bg-stone-900 text-white hover:bg-stone-850 shadow-sm"
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
