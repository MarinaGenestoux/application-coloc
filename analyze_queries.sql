-- Script d'analyse des performances des requetes critiques
-- Utilisation : psql -U coloc_user -d coloc_db -f analyze_queries.sql

\timing on

-- GetUserBalances: Calcul des soldes de tous les membres
EXPLAIN ANALYZE
WITH member_paid AS (
    SELECT e.paid_by as user_id, COALESCE(SUM(e.amount), 0) as total_paid
    FROM expenses e
    WHERE e.colocation_id = (SELECT id FROM colocations LIMIT 1)
    GROUP BY e.paid_by
),
member_owed AS (
    SELECT es.user_id, COALESCE(SUM(es.amount), 0) as total_owed
    FROM expense_splits es
    INNER JOIN expenses e ON es.expense_id = e.id
    WHERE e.colocation_id = (SELECT id FROM colocations LIMIT 1) AND es.is_settled = false
    GROUP BY es.user_id
),
payments_made AS (
    SELECT p.from_user_id as user_id, COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    WHERE p.colocation_id = (SELECT id FROM colocations LIMIT 1) AND p.status = 'confirmed'
    GROUP BY p.from_user_id
),
payments_received AS (
    SELECT p.to_user_id as user_id, COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    WHERE p.colocation_id = (SELECT id FROM colocations LIMIT 1) AND p.status = 'confirmed'
    GROUP BY p.to_user_id
)
SELECT
    cm.user_id,
    u.nom,
    u.prenom,
    u.avatar_url,
    COALESCE(mp.total_paid, 0) as total_paid,
    COALESCE(mo.total_owed, 0) as total_owed,
    (COALESCE(mp.total_paid, 0) - COALESCE(mo.total_owed, 0) + COALESCE(pm.total, 0) - COALESCE(pr.total, 0)) as net_balance
FROM colocation_members cm
INNER JOIN users u ON cm.user_id = u.id
LEFT JOIN member_paid mp ON cm.user_id = mp.user_id
LEFT JOIN member_owed mo ON cm.user_id = mo.user_id
LEFT JOIN payments_made pm ON cm.user_id = pm.user_id
LEFT JOIN payments_received pr ON cm.user_id = pr.user_id
WHERE cm.colocation_id = (SELECT id FROM colocations LIMIT 1)
ORDER BY net_balance DESC;

-- GetRawDebts: Recuperation des dettes non reglees entre membres
EXPLAIN ANALYZE
SELECT
    es.user_id as from_user_id,
    fu.nom as from_user_nom,
    fu.prenom as from_user_prenom,
    e.paid_by as to_user_id,
    tu.nom as to_user_nom,
    tu.prenom as to_user_prenom,
    SUM(es.amount) as amount
FROM expense_splits es
INNER JOIN expenses e ON es.expense_id = e.id
INNER JOIN users fu ON es.user_id = fu.id
INNER JOIN users tu ON e.paid_by = tu.id
WHERE e.colocation_id = (SELECT id FROM colocations LIMIT 1)
  AND es.is_settled = false
  AND es.user_id != e.paid_by
GROUP BY es.user_id, fu.nom, fu.prenom, e.paid_by, tu.nom, tu.prenom
HAVING SUM(es.amount) > 0.01
ORDER BY amount DESC;

-- ListByColocation: Liste paginee des depenses avec tri par date
EXPLAIN ANALYZE
SELECT e.id, e.colocation_id, e.paid_by, e.category_id, e.title, e.description,
       e.amount, e.split_type, e.expense_date, e.recurring_id, e.created_at,
       u.nom, u.prenom, c.name
FROM expenses e
INNER JOIN users u ON e.paid_by = u.id
INNER JOIN expense_categories c ON e.category_id = c.id
WHERE e.colocation_id = (SELECT id FROM colocations LIMIT 1)
ORDER BY e.expense_date DESC
LIMIT 20 OFFSET 0;

-- GetSplits: Recuperation des splits d'une depense (attention au N+1)
EXPLAIN ANALYZE
SELECT es.id, es.expense_id, es.user_id, es.amount, es.percentage, es.is_settled,
       u.nom, u.prenom
FROM expense_splits es
INNER JOIN users u ON es.user_id = u.id
WHERE es.expense_id = (SELECT id FROM expenses LIMIT 1);

-- GetForecastData: Moyennes mensuelles par categorie sur 3 mois
EXPLAIN ANALYZE
SELECT c.id, c.name, AVG(e.amount) as avg_amount
FROM expenses e
INNER JOIN expense_categories c ON e.category_id = c.id
WHERE e.colocation_id = (SELECT id FROM colocations LIMIT 1)
  AND e.expense_date >= NOW() - INTERVAL '3 months'
  AND e.recurring_id IS NULL
GROUP BY c.id, c.name;

-- GetActiveRecurringDue: Depenses recurrentes actives et dues
EXPLAIN ANALYZE
SELECT re.id, re.colocation_id, re.paid_by, re.category_id, re.title, re.description,
       re.amount, re.split_type, re.recurrence, re.next_due_date, re.end_date, re.is_active, re.created_at,
       u.nom, u.prenom, c.name
FROM recurring_expenses re
INNER JOIN users u ON re.paid_by = u.id
INNER JOIN expense_categories c ON re.category_id = c.id
WHERE re.is_active = true AND re.next_due_date <= NOW()
  AND (re.end_date IS NULL OR re.end_date >= NOW());

-- Statistiques des tables
SELECT
    schemaname,
    tablename,
    n_live_tup as "Rows",
    n_dead_tup as "Dead Rows",
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Top 10 des requetes les plus lentes (necessite pg_stat_statements)
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Utilisation des index (scans par index)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as "Index Scans",
    idx_tup_read as "Tuples Read",
    idx_tup_fetch as "Tuples Fetched"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Taille des tables et index
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Total Size",
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Table Size",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "Index Size"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
