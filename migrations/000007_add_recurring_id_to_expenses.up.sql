-- Add optional recurring_id to expenses so we can link generated expenses to their template later
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS recurring_id UUID;

CREATE INDEX IF NOT EXISTS idx_expenses_recurring_id
    ON expenses(recurring_id);
