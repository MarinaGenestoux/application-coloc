-- Drop all performance indexes

-- Expenses
DROP INDEX IF EXISTS idx_expenses_colocation_id;
DROP INDEX IF EXISTS idx_expenses_paid_by;
DROP INDEX IF EXISTS idx_expenses_category_id;
DROP INDEX IF EXISTS idx_expenses_expense_date;
DROP INDEX IF EXISTS idx_expenses_recurring_id;
DROP INDEX IF EXISTS idx_expenses_colocation_date;

-- Expense splits
DROP INDEX IF EXISTS idx_expense_splits_expense_id;
DROP INDEX IF EXISTS idx_expense_splits_user_id;
DROP INDEX IF EXISTS idx_expense_splits_is_settled;
DROP INDEX IF EXISTS idx_expense_splits_expense_user;

-- Colocation members
DROP INDEX IF EXISTS idx_colocation_members_colocation_id;
DROP INDEX IF EXISTS idx_colocation_members_user_id;
DROP INDEX IF EXISTS idx_colocation_members_unique;

-- Recurring expenses
DROP INDEX IF EXISTS idx_recurring_expenses_colocation_id;
DROP INDEX IF EXISTS idx_recurring_expenses_is_active;
DROP INDEX IF EXISTS idx_recurring_expenses_next_due_date;
DROP INDEX IF EXISTS idx_recurring_expenses_active_due;

-- Recurring expense splits
DROP INDEX IF EXISTS idx_recurring_expense_splits_recurring_id;
DROP INDEX IF EXISTS idx_recurring_expense_splits_user_id;

-- Payments
DROP INDEX IF EXISTS idx_payments_colocation_id;
DROP INDEX IF EXISTS idx_payments_from_user_id;
DROP INDEX IF EXISTS idx_payments_to_user_id;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_colocation_status;

-- Expense categories
DROP INDEX IF EXISTS idx_expense_categories_colocation_id;
DROP INDEX IF EXISTS idx_expense_categories_is_global;

-- Balances
DROP INDEX IF EXISTS idx_balances_colocation_id;
DROP INDEX IF EXISTS idx_balances_from_user_id;
DROP INDEX IF EXISTS idx_balances_to_user_id;
DROP INDEX IF EXISTS idx_balances_colocation_users;
