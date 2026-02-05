-- Remove default global categories
DELETE FROM expense_categories WHERE is_global = true;
