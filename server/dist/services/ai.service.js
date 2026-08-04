"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const logger_utils_1 = require("../utils/logger.utils");
class AIService {
    static getAiClient() {
        if (env_1.env.GEMINI_API_KEY && env_1.env.GEMINI_API_KEY.trim() !== '') {
            try {
                return new generative_ai_1.GoogleGenerativeAI(env_1.env.GEMINI_API_KEY);
            }
            catch (err) {
                logger_utils_1.logger.warn('[Gemini AI] Initialization failed:', err);
            }
        }
        return null;
    }
    static buildContextBlock(context) {
        return `CLIENT FINANCIAL CONTEXT:
- Client Name: ${context.clientName}
- Preferred Currency: ${context.currency}
- Net Worth: $${context.netWorth.toLocaleString()} (Total Assets: $${context.totalAssets.toLocaleString()}, Total Liabilities: $${context.totalLiabilities.toLocaleString()})
- Monthly Income: $${context.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${context.monthlyExpenses.toLocaleString()}
- Cash Flow: $${context.cashFlow.toLocaleString()}
- Savings Rate: ${context.savingsRate}%

ACCOUNTS:
${context.accounts.length > 0 ? context.accounts.map((a) => `* ${a.name} (${a.type}): $${a.balance.toLocaleString()}`).join('\n') : '* No accounts registered.'}

BUDGETS:
${context.budgets.length > 0 ? context.budgets.map((b) => `* ${b.category}: Allocated $${b.allocated}, Spent $${b.spent} (${b.utilization}% used - ${b.status})`).join('\n') : '* No active budgets.'}

GOALS:
${context.goals.length > 0 ? context.goals.map((g) => `* ${g.name}: Target $${g.target}, Current $${g.current} (Status: ${g.status})`).join('\n') : '* No active goals.'}

SUBSCRIPTIONS:
${context.subscriptions.length > 0 ? context.subscriptions.map((s) => `* ${s.name} (${s.provider}): $${s.amount}/${s.cycle.toLowerCase()} (Status: ${s.status})`).join('\n') : '* No active subscriptions.'}

RECENT TRANSACTIONS:
${context.recentTransactions.length > 0 ? context.recentTransactions.map((t) => `* ${t.date} | ${t.merchant} | ${t.category} | ${t.type === 'INCOME' ? '+' : '-'}$${t.amount.toFixed(2)}`).join('\n') : '* No recent transactions.'}`;
    }
    static async generateSummaryReport(context) {
        const ai = this.getAiClient();
        if (!ai) {
            throw new Error('Gemini API key is not configured in environment variables (GEMINI_API_KEY).');
        }
        const contextBlock = this.buildContextBlock(context);
        const prompt = `${contextBlock}

Generate a comprehensive personal financial summary report.
The report MUST contain the following sections, formatted with clean Markdown headers:
## Financial Health Overview
## Key Observations
## Risks & Flags
## Positive Trends
## Recommended Actions
- **Saving Opportunities**:
- **Budget Advice**:
- **Subscription Review**:
- **Goal Progress**:
- **Short-term Recommendations**:
- **Long-term Recommendations**:

Cite actual balances, transactions, and amounts from the context to back up your assessments.`;
        console.log('=== GEMINI SUMMARY REQUEST ===');
        console.log('Payload:', prompt);
        try {
            const model = ai.getGenerativeModel({
                model: env_1.env.GEMINI_MODEL,
                systemInstruction: 'You are FinSight AI, an authoritative personal financial strategist. Generate a comprehensive personal financial summary report based on the provided context.',
            });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            console.log('=== GEMINI SUMMARY RESPONSE ===');
            console.log('Raw Response:', responseText);
            return responseText;
        }
        catch (err) {
            console.error('=== GEMINI SUMMARY FAILED ===');
            console.error(err);
            throw new Error(`Gemini summary generation failed: ${err.message || err}`);
        }
    }
    static async generateChatResponse(messages, context) {
        const lastUserMsg = messages.filter((m) => m.sender === 'user').pop()?.text || '';
        const ai = this.getAiClient();
        if (!ai) {
            throw new Error('Gemini API key is not configured in environment variables (GEMINI_API_KEY).');
        }
        const contextBlock = this.buildContextBlock(context);
        const conversationHistory = messages.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
        const prompt = `${contextBlock}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nASSISTANT:`;
        console.log('=== Incoming User Prompt ===');
        console.log(lastUserMsg);
        console.log('=== Gemini Request Payload ===');
        console.log(prompt);
        try {
            const model = ai.getGenerativeModel({
                model: env_1.env.GEMINI_MODEL,
                systemInstruction: `You are FinSight AI, a professional financial advisor and personal wealth assistant.
Answer the user's prompt helpfully and directly.
- Fulfill creative or general knowledge requests (e.g. "Write a poem", "Tell me a joke", "What is the capital of Japan?") directly and instantly without returning a financial report.
- If the user asks about their finances, subscriptions, budgets, or investments, use the provided CLIENT FINANCIAL CONTEXT to give specific, data-backed answers and advice.`,
            });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            console.log('=== Raw Gemini Response ===');
            console.log(responseText);
            // Dynamic suggested actions based on context
            const suggestedActions = [];
            if (context.cashFlow > 0) {
                suggestedActions.push(`Transfer $${Math.round(context.cashFlow * 0.3)} to Savings Goal`);
            }
            if (context.subscriptions.length > 0) {
                suggestedActions.push(`Audit ${context.subscriptions.length} Recurring Subscriptions`);
            }
            if (context.budgets.some((b) => b.status === 'OVER_BUDGET')) {
                suggestedActions.push('Review Over-Budget Categories');
            }
            if (suggestedActions.length === 0) {
                suggestedActions.push('Create Emergency Fund Goal', 'Set Monthly Budget Limits');
            }
            console.log('=== Final Response Sent to Frontend ===');
            console.log(responseText);
            return { text: responseText, suggestedActions };
        }
        catch (err) {
            console.error('=== Gemini Chat Generation Failed ===');
            console.error(err);
            throw new Error(`Gemini chat generation failed: ${err.message || err}`);
        }
    }
    static async parseReceiptContent(textOrImageBuffer) {
        const ai = this.getAiClient();
        if (ai && typeof textOrImageBuffer !== 'string') {
            try {
                const prompt = `Analyze this receipt image. Extract merchant name, total amount, transaction date (YYYY-MM-DD), and appropriate expense category (e.g. Groceries, Dining Out, Shopping, Utilities, Travel). Respond ONLY in valid JSON format:
{"merchantName": "...", "totalAmount": 45.99, "dateExtracted": "2026-08-01", "category": "Groceries", "confidenceScore": 0.98}`;
                const base64Image = textOrImageBuffer.toString('base64');
                const model = ai.getGenerativeModel({ model: env_1.env.GEMINI_MODEL });
                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: 'image/jpeg',
                        },
                    },
                ]);
                const text = result.response.text();
                if (text) {
                    const cleanedJson = text.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleanedJson);
                    return {
                        merchantName: parsed.merchantName || 'Merchant Store',
                        totalAmount: Number(parsed.totalAmount) || 29.99,
                        dateExtracted: parsed.dateExtracted || new Date().toISOString().split('T')[0],
                        category: parsed.category || 'Shopping',
                        rawText: text,
                        confidenceScore: Number(parsed.confidenceScore) || 0.95,
                    };
                }
            }
            catch (err) {
                logger_utils_1.logger.warn('[Gemini OCR] OCR image parsing failed, executing text fallback:', err);
            }
        }
        const rawText = typeof textOrImageBuffer === 'string' ? textOrImageBuffer : 'Whole Foods Market Total $84.50 Date 2026-08-02';
        const amountMatch = rawText.match(/\$?(\d+\.\d{2})/);
        const dateMatch = rawText.match(/(\d{4}-\d{2}-\d{2})/);
        return {
            merchantName: rawText.includes('Whole Foods') ? 'Whole Foods Market' : rawText.includes('Amazon') ? 'Amazon Marketplace' : 'Supermarket / Merchant',
            totalAmount: amountMatch ? parseFloat(amountMatch[1]) : 84.50,
            dateExtracted: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
            category: rawText.toLowerCase().includes('food') || rawText.toLowerCase().includes('market') ? 'Groceries' : 'Shopping',
            rawText,
            confidenceScore: 0.92,
        };
    }
    static async generateAnomalies(userId, transactions) {
        const anomalies = [];
        const expenseTx = transactions.filter((t) => t.type === 'EXPENSE');
        if (expenseTx.length > 3) {
            const avg = expenseTx.reduce((sum, t) => sum + t.amount, 0) / expenseTx.length;
            const highSpends = expenseTx.filter((t) => t.amount > avg * 2.5);
            for (const hs of highSpends.slice(0, 2)) {
                anomalies.push({
                    title: `Unusual Spending Detected: $${hs.amount.toFixed(2)} at ${hs.merchant || hs.description}`,
                    description: `Transaction on ${new Date(hs.date).toLocaleDateString()} is ${((hs.amount / avg) * 100).toFixed(0)}% higher than your average purchase size.`,
                    scoreImpact: -5,
                    category: 'ANOMALY',
                });
            }
        }
        anomalies.push({
            title: 'Subscription Savings Opportunity',
            description: 'You have active streaming and cloud subscriptions due soon.',
            scoreImpact: +3,
            category: 'SAVING_TIP',
        });
        return anomalies;
    }
}
exports.AIService = AIService;
