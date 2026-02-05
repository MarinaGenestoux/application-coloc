DROP INDEX IF EXISTS idx_expenses_recurring_id;
ALTER TABLE expenses
    DROP COLUMN IF EXISTS recurring_id;
