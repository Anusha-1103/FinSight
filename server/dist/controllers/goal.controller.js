"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalController = void 0;
const db_1 = require("../config/db");
class GoalController {
    static async getGoals(req, res, next) {
        try {
            const userId = req.user.userId;
            const goals = await db_1.prisma.goal.findMany({
                where: { userId },
                orderBy: { targetDate: 'asc' },
            });
            const now = new Date();
            let totalGoalValue = 0;
            let totalSaved = 0;
            let activeGoalsCount = 0;
            let completedGoalsCount = 0;
            const goalsWithMetrics = goals.map((g) => {
                const targetAmount = g.targetAmount;
                const currentAmount = g.currentAmount;
                const remainingAmount = Math.max(0, targetAmount - currentAmount);
                const percentage = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
                const targetDateObj = new Date(g.targetDate);
                const createdAtObj = new Date(g.createdAt);
                const daysRemaining = Math.max(0, Math.ceil((targetDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                const remainingMonths = Math.max(1, Math.ceil(daysRemaining / 30.4375));
                const monthlySavingsNeeded = remainingAmount > 0 ? Math.round(remainingAmount / remainingMonths) : 0;
                // Projection Status Engine
                let projectionStatus = 'On Track';
                if (currentAmount >= targetAmount || g.status === 'ACHIEVED') {
                    projectionStatus = 'Completed';
                    completedGoalsCount++;
                }
                else {
                    activeGoalsCount++;
                    const totalDaysDuration = Math.max(1, Math.ceil((targetDateObj.getTime() - createdAtObj.getTime()) / (1000 * 60 * 60 * 24)));
                    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - createdAtObj.getTime()) / (1000 * 60 * 60 * 24)));
                    const expectedProgressPercentage = (daysElapsed / totalDaysDuration) * 100;
                    if (percentage >= expectedProgressPercentage + 5) {
                        projectionStatus = 'Ahead of Schedule';
                    }
                    else if (percentage >= expectedProgressPercentage - 10) {
                        projectionStatus = 'On Track';
                    }
                    else {
                        projectionStatus = 'Behind Schedule';
                    }
                }
                totalGoalValue += targetAmount;
                totalSaved += currentAmount;
                return {
                    ...g,
                    percentage,
                    remainingAmount,
                    daysRemaining,
                    remainingMonths,
                    monthlySavingsNeeded,
                    projectionStatus,
                    isCompleted: projectionStatus === 'Completed',
                };
            });
            const overallProgress = totalGoalValue > 0 ? Math.min(100, Math.round((totalSaved / totalGoalValue) * 100)) : 0;
            res.json({
                success: true,
                data: {
                    goals: goalsWithMetrics,
                    summary: {
                        totalGoalValue,
                        totalSaved,
                        overallProgress,
                        activeGoalsCount,
                        completedGoalsCount,
                        totalGoals: goals.length,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createGoal(req, res, next) {
        try {
            const userId = req.user.userId;
            const { name, targetAmount, currentAmount, targetDate, category, color } = req.body;
            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, error: 'Goal name is required.' });
            }
            const parsedTarget = parseFloat(targetAmount);
            if (isNaN(parsedTarget) || parsedTarget <= 0) {
                return res.status(400).json({ success: false, error: 'Target amount must be greater than zero.' });
            }
            const parsedCurrent = currentAmount ? parseFloat(currentAmount) : 0.0;
            if (isNaN(parsedCurrent) || parsedCurrent < 0) {
                return res.status(400).json({ success: false, error: 'Current amount cannot be negative.' });
            }
            const parsedDate = new Date(targetDate);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ success: false, error: 'Valid target date is required.' });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (parsedDate < today) {
                return res.status(400).json({ success: false, error: 'Target date cannot be in the past.' });
            }
            const goal = await db_1.prisma.goal.create({
                data: {
                    userId,
                    name: name.trim(),
                    targetAmount: parsedTarget,
                    currentAmount: parsedCurrent,
                    targetDate: parsedDate,
                    category: category || 'SAVINGS',
                    color: color || '#10b981',
                    status: parsedCurrent >= parsedTarget ? 'ACHIEVED' : 'IN_PROGRESS',
                },
            });
            res.status(201).json({ success: true, data: goal });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateGoal(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { name, targetAmount, currentAmount, targetDate, color, category, status } = req.body;
            const existing = await db_1.prisma.goal.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ success: false, error: 'Goal not found.' });
            if (name !== undefined && !name.trim()) {
                return res.status(400).json({ success: false, error: 'Goal name cannot be blank.' });
            }
            let parsedTarget = existing.targetAmount;
            if (targetAmount !== undefined) {
                parsedTarget = parseFloat(targetAmount);
                if (isNaN(parsedTarget) || parsedTarget <= 0) {
                    return res.status(400).json({ success: false, error: 'Target amount must be greater than zero.' });
                }
            }
            let parsedCurrent = existing.currentAmount;
            if (currentAmount !== undefined) {
                parsedCurrent = parseFloat(currentAmount);
                if (isNaN(parsedCurrent) || parsedCurrent < 0) {
                    return res.status(400).json({ success: false, error: 'Current amount cannot be negative.' });
                }
            }
            let parsedDate = existing.targetDate;
            if (targetDate) {
                parsedDate = new Date(targetDate);
                if (isNaN(parsedDate.getTime())) {
                    return res.status(400).json({ success: false, error: 'Valid target date is required.' });
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (parsedDate < today) {
                    return res.status(400).json({ success: false, error: 'Target date cannot be in the past.' });
                }
            }
            const resolvedStatus = status || (parsedCurrent >= parsedTarget ? 'ACHIEVED' : 'IN_PROGRESS');
            const updated = await db_1.prisma.goal.update({
                where: { id },
                data: {
                    ...(name && { name: name.trim() }),
                    targetAmount: parsedTarget,
                    currentAmount: parsedCurrent,
                    targetDate: parsedDate,
                    ...(color && { color }),
                    ...(category && { category }),
                    status: resolvedStatus,
                },
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteGoal(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const existing = await db_1.prisma.goal.findFirst({ where: { id, userId } });
            if (!existing)
                return res.status(404).json({ success: false, error: 'Goal not found.' });
            await db_1.prisma.goal.delete({ where: { id } });
            res.json({ success: true, message: 'Goal deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GoalController = GoalController;
