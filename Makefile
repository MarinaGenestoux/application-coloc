.PHONY: help migrate-up migrate-down migrate-create run docker-up docker-down lint fmt check

# Variables
DB_URL=postgresql://coloc_user:coloc_password@localhost:5432/coloc_db?sslmode=disable

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

docker-up: ## Démarre PostgreSQL avec Docker
	docker compose up -d
	@echo "Attente de PostgreSQL..."
	@sleep 3
	docker compose ps

docker-down: ## Arrête PostgreSQL
	docker compose down

migrate-up: ## Exécute les migrations (applique les changements)
	migrate -path migrations -database "$(DB_URL)" up

migrate-down: ## Annule la dernière migration
	migrate -path migrations -database "$(DB_URL)" down 1

migrate-create: ## Crée une nouvelle migration (usage: make migrate-create NAME=nom_migration)
	migrate create -ext sql -dir migrations -seq $(NAME)

run: ## Lance l'application
	go run cmd/server/main.go

build: ## Compile l'application
	go build -o bin/server cmd/server/main.go

test: ## Lance les tests
	go test -v ./...

deps: ## Installe les dépendances Go
	go mod download
	go mod tidy

# ==============================================================================
# Linters et formatage
# ==============================================================================

lint-go: ## Lint le code Go avec golangci-lint
	@echo "Linting Go..."
	golangci-lint run

lint-go-fix: ## Lint et corrige automatiquement le code Go
	@echo "Linting Go avec auto-fix..."
	golangci-lint run --fix

fmt-go: ## Formate le code Go avec goimports
	@echo "Formatage Go..."
	goimports -w .

lint-frontend: ## Lint le code Frontend (React/TS)
	@echo "Linting Frontend..."
	cd frontend && npm run lint

lint-frontend-fix: ## Lint et corrige automatiquement le Frontend
	@echo "Linting Frontend avec auto-fix..."
	cd frontend && npm run lint:fix

fmt-frontend: ## Formate le code Frontend avec Prettier
	@echo "Formatage Frontend..."
	cd frontend && npm run format

fmt-frontend-check: ## Vérifie le formatage Frontend
	@echo "Verification formatage Frontend..."
	cd frontend && npm run format:check

check-go: fmt-go lint-go ## Formate et lint le backend Go

check-frontend: fmt-frontend lint-frontend ## Formate et lint le frontend

lint: lint-go lint-frontend ## Lint tout le projet

fmt: fmt-go fmt-frontend ## Formate tout le projet

check: check-go check-frontend ## Formate et lint tout le projet
