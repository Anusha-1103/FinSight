import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FinSight AI PostgreSQL seed...');

  // Clean existing tables
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Standard User & Admin User
  const user = await prisma.user.create({
    data: {
      email: 'alex.morgan@finsight.ai',
      passwordHash,
      name: 'Alex Morgan',
      role: 'USER',
      currency: 'USD',
      theme: 'dark',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@finsight.ai',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      currency: 'USD',
      theme: 'dark',
    },
  });

  // 2. Create Accounts
  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Chase Premier Checking',
      type: 'CHECKING',
      balance: 12450.80,
      color: '#6366f1',
      icon: 'Landmark',
      accountNumber: '**** 8842',
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'High Yield Savings (4.5% APY)',
      type: 'SAVINGS',
      balance: 28500.00,
      color: '#10b981',
      icon: 'PiggyBank',
      accountNumber: '**** 9011',
    },
  });

  const creditCard = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Sapphire Reserve Credit',
      type: 'CREDIT_CARD',
      balance: 1420.50,
      color: '#ef4444',
      icon: 'CreditCard',
      accountNumber: '**** 4022',
    },
  });

  const investment = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Vanguard Index Portfolio',
      type: 'INVESTMENT',
      balance: 45200.00,
      color: '#8b5cf6',
      icon: 'TrendingUp',
      accountNumber: '**** 1150',
    },
  });

  // 3. Create Categories
  const catSalary = await prisma.category.create({
    data: { userId: user.id, name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#10b981', isSystem: true },
  });

  const catGroceries = await prisma.category.create({
    data: { userId: user.id, name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingBag', color: '#f59e0b', isSystem: true },
  });

  const catDining = await prisma.category.create({
    data: { userId: user.id, name: 'Dining Out', type: 'EXPENSE', icon: 'Utensils', color: '#ef4444', isSystem: true },
  });

  const catUtilities = await prisma.category.create({
    data: { userId: user.id, name: 'Housing & Utilities', type: 'EXPENSE', icon: 'Home', color: '#3b82f6', isSystem: true },
  });

  const catSubscriptions = await prisma.category.create({
    data: { userId: user.id, name: 'Subscriptions', type: 'EXPENSE', icon: 'Tv', color: '#8b5cf6', isSystem: true },
  });

  const catTravel = await prisma.category.create({
    data: { userId: user.id, name: 'Travel & Transport', type: 'EXPENSE', icon: 'Car', color: '#06b6d4', isSystem: true },
  });

  // 4. Create Transactions
  await prisma.transaction.createMany({
    data: [
      // August 2026 (Current Month)
      { userId: user.id, accountId: checking.id, categoryId: catSalary.id, amount: 6500.00, type: 'INCOME', description: 'Tech Corp Bi-Weekly Salary', merchant: 'Tech Corp Inc', date: new Date('2026-08-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catGroceries.id, amount: 184.20, type: 'EXPENSE', description: 'Weekly Organic Grocery Run', merchant: 'Whole Foods Market', date: new Date('2026-08-02'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catDining.id, amount: 68.50, type: 'EXPENSE', description: 'Team Lunch & Coffee', merchant: 'Artisan Bistro', date: new Date('2026-08-03'), status: 'COMPLETED' },
      { userId: user.id, accountId: checking.id, categoryId: catUtilities.id, amount: 1450.00, type: 'EXPENSE', description: 'Monthly Apartment Rent', merchant: 'Skyline Luxury Apartments', date: new Date('2026-08-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catSubscriptions.id, amount: 19.99, type: 'EXPENSE', description: 'Netflix Ultra HD Subscription', merchant: 'Netflix', date: new Date('2026-08-04'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catTravel.id, amount: 45.00, type: 'EXPENSE', description: 'Rideshare to Airport', merchant: 'Uber Technologies', date: new Date('2026-08-03'), status: 'COMPLETED' },

      // July 2026
      { userId: user.id, accountId: checking.id, categoryId: catSalary.id, amount: 6800.00, type: 'INCOME', description: 'Tech Corp Salary + Bonus', merchant: 'Tech Corp Inc', date: new Date('2026-07-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catGroceries.id, amount: 510.00, type: 'EXPENSE', description: 'Weekly Grocery Stock', merchant: 'Safeway', date: new Date('2026-07-08'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catDining.id, amount: 330.00, type: 'EXPENSE', description: 'Dinner with friends', merchant: 'La Taqueria', date: new Date('2026-07-15'), status: 'COMPLETED' },
      { userId: user.id, accountId: checking.id, categoryId: catUtilities.id, amount: 320.00, type: 'EXPENSE', description: 'Electric & Internet bills', merchant: 'Comcast / PGE', date: new Date('2026-07-05'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catSubscriptions.id, amount: 90.00, type: 'EXPENSE', description: 'Cloud & Tech Subscriptions', merchant: 'AWS / GitHub', date: new Date('2026-07-12'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catTravel.id, amount: 220.00, type: 'EXPENSE', description: 'Gas and tolls', merchant: 'Shell / Fastrak', date: new Date('2026-07-20'), status: 'COMPLETED' },

      // June 2026
      { userId: user.id, accountId: checking.id, categoryId: catSalary.id, amount: 6500.00, type: 'INCOME', description: 'Tech Corp Salary', merchant: 'Tech Corp Inc', date: new Date('2026-06-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catGroceries.id, amount: 580.00, type: 'EXPENSE', description: 'Grocery run', merchant: 'Whole Foods Market', date: new Date('2026-06-09'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catDining.id, amount: 340.00, type: 'EXPENSE', description: 'Dinners & lunches', merchant: 'Various Restaurants', date: new Date('2026-06-18'), status: 'COMPLETED' },
      { userId: user.id, accountId: checking.id, categoryId: catUtilities.id, amount: 320.00, type: 'EXPENSE', description: 'Utilities', merchant: 'Comcast / PGE', date: new Date('2026-06-05'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catSubscriptions.id, amount: 90.00, type: 'EXPENSE', description: 'Cloud bills', merchant: 'AWS / GitHub', date: new Date('2026-06-10'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catTravel.id, amount: 190.00, type: 'EXPENSE', description: 'Commuting expenses', merchant: 'Shell', date: new Date('2026-06-25'), status: 'COMPLETED' },

      // May 2026
      { userId: user.id, accountId: checking.id, categoryId: catSalary.id, amount: 6500.00, type: 'INCOME', description: 'Tech Corp Salary', merchant: 'Tech Corp Inc', date: new Date('2026-05-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catGroceries.id, amount: 490.00, type: 'EXPENSE', description: 'Groceries', merchant: 'Safeway', date: new Date('2026-05-12'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catDining.id, amount: 290.00, type: 'EXPENSE', description: 'Dining out', merchant: 'Pizzeria', date: new Date('2026-05-20'), status: 'COMPLETED' },
      { userId: user.id, accountId: checking.id, categoryId: catUtilities.id, amount: 320.00, type: 'EXPENSE', description: 'Utility bills', merchant: 'Comcast / PGE', date: new Date('2026-05-05'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catSubscriptions.id, amount: 90.00, type: 'EXPENSE', description: 'Monthly SaaS', merchant: 'AWS / GitHub', date: new Date('2026-05-15'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catTravel.id, amount: 210.00, type: 'EXPENSE', description: 'Transit & Gas', merchant: 'Shell', date: new Date('2026-05-22'), status: 'COMPLETED' },

      // April 2026
      { userId: user.id, accountId: checking.id, categoryId: catSalary.id, amount: 6200.00, type: 'INCOME', description: 'Tech Corp Salary', merchant: 'Tech Corp Inc', date: new Date('2026-04-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catGroceries.id, amount: 520.00, type: 'EXPENSE', description: 'Groceries', merchant: 'Trader Joes', date: new Date('2026-04-10'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catDining.id, amount: 310.00, type: 'EXPENSE', description: 'Sushi dinner', merchant: 'Sushi Boat', date: new Date('2026-04-14'), status: 'COMPLETED' },
      { userId: user.id, accountId: checking.id, categoryId: catUtilities.id, amount: 320.00, type: 'EXPENSE', description: 'Internet / Electricity', merchant: 'Comcast / PGE', date: new Date('2026-04-05'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catSubscriptions.id, amount: 90.00, type: 'EXPENSE', description: 'Subscriptions', merchant: 'AWS / GitHub', date: new Date('2026-04-15'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catTravel.id, amount: 180.00, type: 'EXPENSE', description: 'Transit', merchant: 'Chevron', date: new Date('2026-04-22'), status: 'COMPLETED' },

      // March 2026
      { userId: user.id, accountId: checking.id, categoryId: catSalary.id, amount: 6000.00, type: 'INCOME', description: 'Tech Corp Salary', merchant: 'Tech Corp Inc', date: new Date('2026-03-01'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catGroceries.id, amount: 480.00, type: 'EXPENSE', description: 'Groceries', merchant: 'Whole Foods Market', date: new Date('2026-03-09'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catDining.id, amount: 280.00, type: 'EXPENSE', description: 'Team Coffee & Lunches', merchant: 'Blue Bottle', date: new Date('2026-03-15'), status: 'COMPLETED' },
      { userId: user.id, accountId: checking.id, categoryId: catUtilities.id, amount: 320.00, type: 'EXPENSE', description: 'Utilities', merchant: 'Comcast / PGE', date: new Date('2026-03-05'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catSubscriptions.id, amount: 90.00, type: 'EXPENSE', description: 'SaaS charges', merchant: 'AWS / GitHub', date: new Date('2026-03-12'), status: 'COMPLETED' },
      { userId: user.id, accountId: creditCard.id, categoryId: catTravel.id, amount: 150.00, type: 'EXPENSE', description: 'Commuting Gas', merchant: 'Chevron', date: new Date('2026-03-20'), status: 'COMPLETED' },
    ],
  });

  // 5. Subscriptions
  await prisma.subscription.createMany({
    data: [
      { userId: user.id, categoryId: catSubscriptions.id, name: 'Netflix Premium', provider: 'Netflix', amount: 19.99, billingCycle: 'MONTHLY', nextBillingDate: new Date('2026-08-15'), status: 'ACTIVE' },
      { userId: user.id, categoryId: catSubscriptions.id, name: 'Spotify Family', provider: 'Spotify', amount: 16.99, billingCycle: 'MONTHLY', nextBillingDate: new Date('2026-08-18'), status: 'ACTIVE' },
      { userId: user.id, categoryId: catSubscriptions.id, name: 'GitHub Copilot Enterprise', provider: 'GitHub', amount: 19.00, billingCycle: 'MONTHLY', nextBillingDate: new Date('2026-08-22'), status: 'ACTIVE' },
      { userId: user.id, categoryId: catSubscriptions.id, name: 'AWS Cloud Services', provider: 'Amazon Web Services', amount: 142.50, billingCycle: 'MONTHLY', nextBillingDate: new Date('2026-08-10'), status: 'ACTIVE' },
    ],
  });

  // 6. Budgets
  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: catGroceries.id, amount: 600.00, period: 'MONTHLY' },
      { userId: user.id, categoryId: catDining.id, amount: 350.00, period: 'MONTHLY' },
      { userId: user.id, categoryId: catSubscriptions.id, amount: 100.00, period: 'MONTHLY' },
      { userId: user.id, categoryId: catTravel.id, amount: 300.00, period: 'MONTHLY' },
    ],
  });

  // 7. Goals
  await prisma.goal.createMany({
    data: [
      { userId: user.id, name: '6-Month Emergency Shield', targetAmount: 30000.00, currentAmount: 28500.00, targetDate: new Date('2026-10-01'), category: 'SAVINGS', color: '#10b981' },
      { userId: user.id, name: 'Tokyo Tech Summit Travel Fund', targetAmount: 4500.00, currentAmount: 3200.00, targetDate: new Date('2026-12-15'), category: 'TRAVEL', color: '#3b82f6' },
      { userId: user.id, name: 'Home Down Payment Reserve', targetAmount: 75000.00, currentAmount: 45200.00, targetDate: new Date('2027-06-01'), category: 'PROPERTY', color: '#8b5cf6' },
    ],
  });

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      { userId: user.id, title: 'AWS Cloud Renewal Alert', message: 'Your AWS billing subscription ($142.50) is due in 6 days.', type: 'BILL_DUE' },
      { userId: user.id, title: 'Dining Budget Notice', message: 'You have used 62% of your monthly $350 Dining Out budget.', type: 'BUDGET_ALERT' },
      { userId: user.id, title: 'Financial Health Score Up 4 pts', message: 'Great job! Your savings rate increase boosted your score to 86/100.', type: 'SYSTEM' },
    ],
  });

  console.log('✅ FinSight AI Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
