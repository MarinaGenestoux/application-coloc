# Linters

Configuration des linters pour améliorer la qualité du code.

## Installation

### Backend Go

```bash
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install golang.org/x/tools/cmd/goimports@latest
```

### Frontend React/TypeScript

```bash
cd frontend
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

## Utilisation

### Commandes principales

```bash
make lint       # Linter tout le projet
make fmt        # Formater tout le projet
make check      # Formater + Linter tout
```

### Commandes spécifiques

**Backend**
```bash
make lint-go        # Linter Go
make lint-go-fix    # Linter + corrections auto
make fmt-go         # Formater Go
make check-go       # Formater + Linter Go
```

**Frontend**
```bash
make lint-frontend        # Linter React/TS
make lint-frontend-fix    # Linter + corrections auto
make fmt-frontend         # Formater
make check-frontend       # Formater + Linter
```

## Configuration

**Backend** : `.golangci.yml`
- Linters : errcheck, govet, staticcheck, gosec, gofmt, goimports

**Frontend** : `frontend/.eslintrc.cjs` + `frontend/.prettierrc`
- Plugins : TypeScript, React, React Hooks, Prettier

## Ignorer une règle

**Go**
```go
//nolint:errcheck
file.Close()
```

**TypeScript**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();
```

## Recommandations

- Exécuter `make check` avant chaque commit
- Utiliser `make lint-go-fix` et `make lint-frontend-fix` pour corrections automatiques
- Corriger manuellement les erreurs restantes
