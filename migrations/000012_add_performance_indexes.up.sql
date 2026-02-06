-- Index strategiques pour accelerer les jointures et filtres

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_colocation_id ON expenses(colocation_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_id ON expenses(recurring_id);
CREATE INDEX IF NOT EXISTS idx_expenses_colocation_date ON expenses(colocation_id, expense_date DESC);

-- expense_splits
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_is_settled ON expense_splits(is_settled);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_user ON expense_splits(expense_id, user_id);

-- colocation_members
CREATE INDEX IF NOT EXISTS idx_colocation_members_colocation_id ON colocation_members(colocation_id);
CREATE INDEX IF NOT EXISTS idx_colocation_members_user_id ON colocation_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_colocation_members_unique ON colocation_members(colocation_id, user_id);

-- recurring_expenses
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_colocation_id ON recurring_expenses(colocation_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_due_date ON recurring_expenses(next_due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active_due ON recurring_expenses(is_active, next_due_date) WHERE is_active = true;

-- recurring_expense_splits
CREATE INDEX IF NOT EXISTS idx_recurring_expense_splits_recurring_id ON recurring_expense_splits(recurring_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expense_splits_user_id ON recurring_expense_splits(user_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_colocation_id ON payments(colocation_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_user_id ON payments(from_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_user_id ON payments(to_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_colocation_status ON payments(colocation_id, status);

-- expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_colocation_id ON expense_categories(colocation_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_global ON expense_categories(is_global);

-- balances
CREATE INDEX IF NOT EXISTS idx_balances_colocation_id ON balances(colocation_id);
CREATE INDEX IF NOT EXISTS idx_balances_from_user_id ON balances(from_user_id);
CREATE INDEX IF NOT EXISTS idx_balances_to_user_id ON balances(to_user_id);
CREATE INDEX IF NOT EXISTS idx_balances_colocation_users ON balances(colocation_id, from_user_id, to_user_id);
