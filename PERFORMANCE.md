# Optimisations de performance

Optimisations PostgreSQL pour accelerer les requetes de soldes et depenses.

## 1. Configuration PostgreSQL (PgTune)

Fichier `postgresql.conf` genere avec PgTune pour 16GB RAM, SSD, usage mixe.

**Parametres cles** :
- `shared_buffers = 4GB` - Cache PostgreSQL (25% RAM)
- `effective_cache_size = 8GB` - Cache OS estime (50% RAM)
- `work_mem = 41MB` - Memoire pour tris/jointures
- `random_page_cost = 1.1` - Optimise SSD (vs 4.0 pour HDD)
- `log_min_duration_statement = 200` - Log requetes > 200ms

## 2. Index Btree

Migration `000012_add_performance_indexes.up.sql` : **29 index crees**.

**Tables principales** :
- `expenses` : colocation_id, paid_by, category_id, expense_date
- `expense_splits` : expense_id, user_id, is_settled
- `colocation_members` : (colocation_id, user_id) unique
- `payments` : colocation_id, from_user_id, to_user_id, status

**Gain** : 10x a 100x sur jointures et filtres.

## 3. Cache in-memory

Fichier `internal/infra/cache/balance_cache.go` : cache des soldes avec TTL 5 min.

**Principe** :
1. Requete soldes → verifie cache
2. Cache hit → retourne direct (evite calcul SQL lourd)
3. Cache miss → calcule + met en cache
4. Creation/modification depense → invalide cache

**Gain** : +90% sur requetes repetees.

## 4. Monitoring

**pg_stat_statements** (migration 000011) : tracking des requetes lentes.

**Fichier `analyze_queries.sql`** : EXPLAIN ANALYZE sur 6 requetes critiques + stats tables/index.

## Impact global

| Optimisation | Gain estime |
|---|---|
| Config PgTune | +20-30% |
| Index Btree | +1000% (10x-100x) |
| Cache in-memory | +90% (repetees) |

## Commandes

```bash
# Redemarrer avec config optimisee
docker compose down && docker compose up -d

# Appliquer migrations (index + pg_stat_statements)
migrate -path migrations -database "postgresql://coloc_user:coloc_password@localhost:5432/coloc_db?sslmode=disable" up

# Analyser performances
docker compose exec postgres psql -U coloc_user -d coloc_db -f analyze_queries.sql
```
