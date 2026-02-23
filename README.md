# ColocApp — Gestion de colocation

Application full-stack de gestion de colocation : dépenses partagées, soldes, remboursements, événements, votes et cagnottes.

## Fonctionnalités

### Implémentées (Frontend + Backend)

| Fonctionnalité | Description |
|---|---|
| **Authentification** | Inscription, connexion, JWT (access + refresh token), réinitialisation de mot de passe |
| **Colocations** | Création, invitation par code unique, rôles admin/membre |
| **Dépenses** | Ajout, modification, suppression avec 3 modes de partage : égal, pourcentage, personnalisé |
| **Soldes et dettes** | Calcul automatique de qui doit combien à qui, algorithme min-cash-flow pour simplifier les dettes |
| **Catégories** | Catégories globales prédéfinies (Loyer, Courses, Électricité, Internet, etc.) |
| **Dashboard** | Synthèse avec graphiques Recharts (répartition par catégorie, évolution mensuelle, stats globales) |
| **Événements** | Création d'événements liés à la colocation avec système de RSVP |
| **Pagination** | Liste des dépenses paginée avec total réel calculé côté serveur (SQL SUM) |

### Backend prêt, Frontend à développer

| Fonctionnalité | Description |
|---|---|
| **Paiements** | Déclaration de remboursement avec confirmation par le destinataire |
| **Dépenses récurrentes** | Templates avec génération automatique (quotidien, hebdo, mensuel, annuel) |
| **Prévisionnels** | Estimation des dépenses futures par mois et par catégorie |
| **Décisions collectives** | Système de vote avec options multiples, anonymat, deadline |
| **Fonds communs** | Cagnottes avec objectif, contributions, suivi du montant |
| **Notifications** | Notifications temps réel via streaming gRPC |
| **Catégories personnalisées** | Catégories propres à chaque colocation |

### Optionnelles (non commencées)

- **LLM** — Ajout de dépenses en langage naturel (ex: "j'ai payé 230€ de courses Carrefour hier")
- **Challenges énergétiques** — Gamification de la consommation énergétique

## Stack technique

### Backend

| Composant | Technologie |
|---|---|
| Langage | Go 1.25 |
| API | gRPC + grpc-gateway (REST sur port 8080) |
| Base de données | PostgreSQL 16 (Docker) |
| Driver SQL | pgx/v5 (jackc/pgx) |
| Migrations | golang-migrate (12 migrations) |
| Authentification | golang-jwt/v5 + bcrypt |
| Protobuf | protoc + buf (12 fichiers .proto) |
| Tests | testify + mocks (repositories mockés) |
| Linting | golangci-lint + goimports |
| Documentation API | Swagger UI (généré par grpc-gateway) |
| Infrastructure | Docker Compose |

### Frontend

| Composant | Technologie |
|---|---|
| Framework | React 18 + TypeScript |
| Style | Tailwind CSS |
| Graphiques | Recharts |
| Routing | React Router v6 |
| HTTP | Axios |
| State | React Context + hooks |
| Build | Vite |
| Linting | ESLint + Prettier |

### Design

- Thème blanc (#FFFFFF), cartes avec ombres légères
- Accents bleu (#5682F2) et orange doré (#F1C086)
- Sidebar navigation + contenu principal en grille de cartes
- Style dashboard inspiré de Finary
- Typo : DM Sans + Instrument Serif

## Architecture

Le projet suit une **Clean Architecture** avec séparation stricte des responsabilités :

```
application-coloc/
├── cmd/
│   ├── server/main.go                # Point d'entrée (gRPC :50051 + REST :8080)
│   └── seed/main.go                  # Seed de données de démo
├── internal/
│   ├── domain/                       # Entités métier + interfaces repository
│   │   └── algorithm/                # Algorithme min-cash-flow
│   ├── application/
│   │   ├── service/                  # Logique métier (use cases)
│   │   └── constants/                # Constantes nommées (pas de nombres magiques)
│   └── infra/
│       ├── grpc/                     # Handlers gRPC (11 handlers)
│       ├── repository/postgres/      # Implémentation PostgreSQL (12 repositories)
│       ├── auth/                     # JWT, bcrypt, intercepteur d'authentification
│       └── config/                   # Configuration (variables d'environnement)
├── proto/                            # 12 définitions Protobuf
│   └── pb/                           # Code Go généré + Swagger JSON
├── migrations/                       # 12 migrations SQL (up + down)
├── frontend/
│   └── src/
│       ├── api/                      # 8 clients REST (auth, expense, balance, etc.)
│       ├── components/               # Composants React (layout, ui)
│       ├── pages/                    # 7 pages (Dashboard, Expenses, Balances, Events, etc.)
│       ├── context/                  # AuthContext, ColocationContext
│       └── types/                    # Types TypeScript
├── scripts/                          # Génération de certificats TLS, seed SQL
├── docker-compose.yml
├── Makefile
├── .golangci.yml                     # Configuration golangci-lint
└── go.mod
```

### Principes appliqués

- **Clean Architecture** — Les dépendances pointent vers l'intérieur : `infra → application → domain`
- **SOLID** — Interfaces pour les repositories, injection de dépendances, responsabilité unique
- **Pas de logique métier dans les handlers** — Les handlers gRPC valident les inputs, appellent les services et mappent les réponses
- **Pas de nombres magiques** — Constantes nommées dans `internal/application/constants/`
- **Validation backend** — Toute validation est faite côté serveur
- **API versionnée** — Toutes les routes REST passent par `/api/v1/`

## Schéma de base de données

12 migrations SQL couvrant les tables suivantes :

```
users                      — Comptes utilisateurs (UUID, email, bcrypt)
colocations                — Colocations avec code d'invitation unique
colocation_members         — Membres et rôles (admin/member)
expense_categories         — Catégories de dépenses (globales + personnalisées)
expenses                   — Dépenses avec type de partage (equal/percentage/custom)
expense_splits             — Répartition par utilisateur
balances                   — Soldes calculés entre utilisateurs
recurring_expenses         — Templates de dépenses récurrentes
recurring_expense_splits   — Répartition des dépenses récurrentes
payments                   — Remboursements entre utilisateurs
events                     — Événements de colocation
event_rsvps                — Réponses des participants (going/not_going/maybe)
```

### Optimisations de performance

- **Index B-tree stratégiques** (migration `000012`) sur les foreign keys, filtres de recherche et tris
- **pg_stat_statements** activé (migration `000011`) pour le monitoring des requêtes SQL
- **postgresql.conf optimisé** avec PgTune (shared_buffers, work_mem, effective_cache_size)
- **Cache in-memory** des soldes avec invalidation automatique sur chaque opération de dépense

## Installation

### Pré-requis

- Go 1.25+
- Node.js 18+ et npm
- Docker et Docker Compose
- golang-migrate CLI
- golangci-lint (optionnel, pour le linting)

### Démarrage rapide

```bash
# 1. Cloner le projet
git clone https://github.com/MarinaGenestoux/application-coloc.git
cd application-coloc

# 2. Lancer PostgreSQL
docker compose up -d

# 3. Appliquer les migrations
make migrate-up

# 4. Lancer le backend (gRPC :50051 + REST :8080)
make run

# 5. Dans un autre terminal, lancer le frontend
cd frontend && npm install && npm run dev
```

L'API REST est disponible sur `http://localhost:8080/api/v1/` et le Swagger UI sur `http://localhost:8080/swagger/`.

### Données de démonstration

```bash
# Seed automatique sur la dernière colocation créée
go run cmd/seed/main.go

# Ou cibler une colocation précise
go run cmd/seed/main.go --colocation-id=<UUID>
```

## Commandes

```bash
# Infrastructure
docker compose up -d                # Lancer PostgreSQL
docker compose down                 # Arrêter

# Migrations
make migrate-up                     # Appliquer les migrations
make migrate-down                   # Rollback d'une migration
make migrate-create NAME=xxx        # Créer une nouvelle migration

# Backend
make run                            # Lancer le serveur
make build                          # Compiler le binaire
make test                           # Lancer les tests

# Linting et formatage
make check                          # Formater + lint tout le projet
make lint                           # Lint backend + frontend
make fmt                            # Formater backend + frontend

# Frontend
cd frontend && npm run dev          # Dev server (port 5173)
cd frontend && npm run build        # Build production
```

## Sécurité TLS

Le projet supporte le chiffrement TLS pour toutes les connexions :

| Service | Sans TLS | Avec TLS |
|---------|----------|----------|
| API REST | `http://localhost:8080` | `https://localhost:8080` |
| gRPC | `grpc://localhost:50051` | `grpcs://localhost:50051` |

### Activation

```bash
# 1. Générer les certificats auto-signés
./scripts/generate-certs.ps1       # Windows
./scripts/generate-certs.sh        # Linux/macOS

# 2. Configurer .env
TLS_ENABLED=true
TLS_CERT_FILE=./certs/server-cert.pem
TLS_KEY_FILE=./certs/server-key.pem

# 3. Configurer le frontend (frontend/.env)
VITE_TLS_ENABLED=true

# 4. Relancer
make run
```

Pour la production, utiliser Let's Encrypt avec `certbot`.

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Hôte PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USER` | `coloc_user` | Utilisateur BDD |
| `DB_PASSWORD` | `coloc_password` | Mot de passe BDD |
| `DB_NAME` | `coloc_db` | Nom de la base |
| `DB_SSLMODE` | `disable` | Mode SSL PostgreSQL |
| `GRPC_PORT` | `50051` | Port du serveur gRPC |
| `HTTP_PORT` | `8080` | Port de la gateway REST |
| `JWT_SECRET` | — | Clé secrète JWT |
| `JWT_EXPIRY` | `24h` | Durée du token d'accès |
| `REFRESH_TOKEN_EXPIRY` | `168h` | Durée du refresh token (7 jours) |
| `TLS_ENABLED` | `false` | Active le chiffrement TLS |
| `TLS_CERT_FILE` | `./certs/server-cert.pem` | Chemin du certificat TLS |
| `TLS_KEY_FILE` | `./certs/server-key.pem` | Chemin de la clé privée TLS |

## Tests

Les tests unitaires utilisent des **mocks** des interfaces repository (injection de dépendances) :

```bash
make test
```

Services testés : `auth_service`, `expense_service` — couverture des cas nominaux et d'erreur.

## Ce qui a été fait

- [x] Clean Architecture (domain / application / infra)
- [x] Principes SOLID avec injection de dépendances
- [x] Authentification JWT (access + refresh tokens)
- [x] Chiffrement TLS (HTTP + gRPC)
- [x] Linters (golangci-lint, ESLint, Prettier, goimports)
- [x] Swagger UI généré automatiquement par grpc-gateway
- [x] API versionnée (`/api/v1/`)
- [x] Tests unitaires avec mocks
- [x] Validation côté serveur (pas de confiance au frontend)
- [x] Constantes nommées (pas de nombres magiques)
- [x] 12 migrations SQL avec up + down
- [x] Index de performance B-tree
- [x] pg_stat_statements pour monitoring SQL
- [x] postgresql.conf optimisé (PgTune)
- [x] Cache in-memory des soldes avec invalidation
- [x] Algorithme min-cash-flow pour simplification des dettes
- [x] 12 fichiers .proto, 11 handlers gRPC, 12 repositories

## Ce qui reste à faire

- [ ] Changelog automatique (conventional commits)
- [ ] Analyse approfondie des requêtes lentes (`EXPLAIN ANALYZE`)
- [ ] Frontend pour les fonctionnalités backend restantes (paiements, récurrences, votes, fonds, notifications)
- [ ] Dockerfile pour déploiement complet (template présent dans `docker-compose.yml`)
- [ ] Index GIN pour recherche full-text (si nécessaire)
- [ ] Catégories personnalisées par colocation (frontend)

## Développement

1. Ajouter les entités dans `internal/domain/`
2. Définir les interfaces repository dans `internal/domain/repositories.go`
3. Implémenter la logique métier dans `internal/application/service/`
4. Implémenter le repository PostgreSQL dans `internal/infra/repository/postgres/`
5. Créer le handler gRPC dans `internal/infra/grpc/`
6. Câbler dans `cmd/server/main.go`
7. Ajouter les routes frontend dans `frontend/src/`
