# Versioning API - v1

## Changements effectués

Tous les endpoints de l'API utilisent désormais le préfixe `/api/v1/` au lieu de `/api/`.

### URLs mises à jour

#### Authentication
- `POST /api/v1/auth/register` - Créer un compte utilisateur
- `POST /api/v1/auth/login` - Se connecter
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `POST /api/v1/auth/logout` - Se déconnecter

#### User
- `GET /api/v1/me` - Profil utilisateur actuel
- `PUT /api/v1/me` - Modifier le profil
- `DELETE /api/v1/me` - Supprimer le compte
- `GET /api/v1/users/{id}` - Voir un utilisateur

#### Colocations
- `POST /api/v1/colocations` - Créer une colocation
- `GET /api/v1/colocations` - Lister les colocations
- `GET /api/v1/colocations/{id}` - Détails d'une colocation
- `PUT /api/v1/colocations/{id}` - Modifier une colocation
- `DELETE /api/v1/colocations/{id}` - Supprimer une colocation
- `POST /api/v1/colocations/join` - Rejoindre avec code
- `POST /api/v1/colocations/{id}/leave` - Quitter
- `GET /api/v1/colocations/{colocation_id}/members` - Liste des membres
- `DELETE /api/v1/colocations/{colocation_id}/members/{user_id}` - Retirer un membre
- `PUT /api/v1/colocations/{colocation_id}/members/{user_id}/role` - Changer le rôle
- `POST /api/v1/colocations/{id}/regenerate-code` - Régénérer le code d'invitation
- `POST /api/v1/colocations/{colocation_id}/invitations` - Envoyer une invitation
- `GET /api/v1/colocations/{colocation_id}/invitations` - Liste des invitations
- `DELETE /api/v1/colocations/{colocation_id}/invitations/{invitation_id}` - Annuler invitation

#### Categories
- `GET /api/v1/colocations/{colocation_id}/categories` - Liste des catégories
- `POST /api/v1/colocations/{colocation_id}/categories` - Créer une catégorie
- `PUT /api/v1/colocations/{colocation_id}/categories/{id}` - Modifier
- `DELETE /api/v1/colocations/{colocation_id}/categories/{id}` - Supprimer
- `GET /api/v1/colocations/{colocation_id}/categories/stats` - Statistiques

#### Expenses
- `POST /api/v1/colocations/{colocation_id}/expenses` - Créer une dépense
- `GET /api/v1/colocations/{colocation_id}/expenses` - Lister les dépenses
- `GET /api/v1/colocations/{colocation_id}/expenses/{id}` - Détails
- `PUT /api/v1/colocations/{colocation_id}/expenses/{id}` - Modifier
- `DELETE /api/v1/colocations/{colocation_id}/expenses/{id}` - Supprimer
- `POST /api/v1/colocations/{colocation_id}/recurring-expenses` - Créer dépense récurrente
- `GET /api/v1/colocations/{colocation_id}/recurring-expenses` - Liste récurrentes
- `PUT /api/v1/colocations/{colocation_id}/recurring-expenses/{id}` - Modifier récurrente
- `DELETE /api/v1/colocations/{colocation_id}/recurring-expenses/{id}` - Supprimer récurrente
- `GET /api/v1/colocations/{colocation_id}/expenses/forecast` - Prévisions

#### Balances
- `GET /api/v1/colocations/{colocation_id}/balances` - Soldes
- `GET /api/v1/colocations/{colocation_id}/balances/simplified` - Dettes simplifiées (algorithme min-cash-flow)
- `GET /api/v1/colocations/{colocation_id}/balances/history` - Historique

#### Payments
- `POST /api/v1/colocations/{colocation_id}/payments` - Déclarer un remboursement
- `GET /api/v1/colocations/{colocation_id}/payments` - Liste des paiements
- `GET /api/v1/colocations/{colocation_id}/payments/{id}` - Détails
- `POST /api/v1/colocations/{colocation_id}/payments/{id}/confirm` - Confirmer
- `POST /api/v1/colocations/{colocation_id}/payments/{id}/reject` - Rejeter
- `DELETE /api/v1/colocations/{colocation_id}/payments/{id}` - Annuler

#### Decisions
- `POST /api/v1/colocations/{colocation_id}/decisions` - Créer une décision/sondage
- `GET /api/v1/colocations/{colocation_id}/decisions` - Lister
- `GET /api/v1/colocations/{colocation_id}/decisions/{id}` - Détails
- `PUT /api/v1/colocations/{colocation_id}/decisions/{id}` - Modifier
- `DELETE /api/v1/colocations/{colocation_id}/decisions/{id}` - Supprimer
- `POST /api/v1/colocations/{colocation_id}/decisions/{decision_id}/vote` - Voter
- `POST /api/v1/colocations/{colocation_id}/decisions/{id}/close` - Fermer le vote
- `GET /api/v1/colocations/{colocation_id}/decisions/{id}/results` - Résultats

#### Funds (Cagnottes)
- `POST /api/v1/colocations/{colocation_id}/funds` - Créer une cagnotte
- `GET /api/v1/colocations/{colocation_id}/funds` - Lister
- `GET /api/v1/colocations/{colocation_id}/funds/{id}` - Détails
- `PUT /api/v1/colocations/{colocation_id}/funds/{id}` - Modifier
- `DELETE /api/v1/colocations/{colocation_id}/funds/{id}` - Supprimer
- `POST /api/v1/colocations/{colocation_id}/funds/{fund_id}/contributions` - Contribuer
- `GET /api/v1/colocations/{colocation_id}/funds/{fund_id}/contributions` - Contributions
- `DELETE /api/v1/colocations/{colocation_id}/funds/{fund_id}/contributions/{id}` - Supprimer contribution

#### Notifications
- `GET /api/v1/notifications` - Liste des notifications
- `POST /api/v1/notifications/{id}/read` - Marquer comme lu
- `POST /api/v1/notifications/read-all` - Tout marquer comme lu
- `DELETE /api/v1/notifications/{id}` - Supprimer
- `GET /api/v1/notifications/unread-count` - Nombre de non lues

#### Events (Événements)
- `POST /api/v1/colocations/{colocation_id}/events` - Créer un événement
- `GET /api/v1/colocations/{colocation_id}/events` - Lister les événements
- `GET /api/v1/colocations/{colocation_id}/events/{id}` - Détails d'un événement
- `PUT /api/v1/colocations/{colocation_id}/events/{id}` - Modifier
- `DELETE /api/v1/colocations/{colocation_id}/events/{id}` - Supprimer
- `POST /api/v1/colocations/{colocation_id}/events/{event_id}/rsvp` - Répondre (going/maybe/not_going)
- `GET /api/v1/colocations/{colocation_id}/events/{event_id}/participants` - Liste des participants

## Services implémentés

Les services suivants sont actuellement implémentés et disponibles :

✅ AuthService - Authentification
✅ UserService - Gestion des utilisateurs
✅ ColocationService - Gestion des colocations
✅ CategoryService - Catégories de dépenses
✅ ExpenseService - Dépenses et dépenses récurrentes
✅ BalanceService - Calcul des soldes et dettes
✅ PaymentService - Remboursements
✅ DecisionService - Votes et décisions collectives
✅ FundService - Cagnottes communes
✅ NotificationService - Notifications
✅ EventService - Événements et RSVPs

## Démarrage du serveur

```bash
go run ./cmd/server/main.go
```

Le serveur affiche :
```
Serveur gRPC demarre sur le port 50051
Gateway REST demarree sur le port 8080
API v1 disponible sur http://localhost:8080/api/v1/
Swagger UI disponible sur http://localhost:8080/swagger/
```

## Endpoints disponibles

- **gRPC** : `localhost:50051`
- **REST API** : `http://localhost:8080/api/v1/`
- **Swagger UI** : `http://localhost:8080/swagger/`
- **Health Check** : `http://localhost:8080/health`

## Swagger UI

La documentation Swagger est disponible sur :
```
http://localhost:8080/swagger/
```

## Régénération des fichiers protobuf

Si vous modifiez les fichiers `.proto`, régénérez avec :

```bash
cd proto
buf generate
```

Cela régénère automatiquement :
- Les fichiers Go (`.pb.go`)
- Les fichiers gRPC (`.grpc.pb.go`)
- Les fichiers gateway (`.pb.gw.go`)
- Le fichier Swagger (`coloc.swagger.json`)

## Migration depuis l'ancienne API

Si vous avez du code frontend qui utilise `/api/`, changez tous les appels pour utiliser `/api/v1/` :

**Avant :**
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

**Après :**
```javascript
fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

## Exemple d'utilisation

### Inscription
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "nom": "Dupont",
    "prenom": "Jean"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Créer une colocation (avec token)
```bash
curl -X POST http://localhost:8080/api/v1/colocations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Appart Paris",
    "description": "Colocation 3 personnes",
    "address": "75 rue de la République, Paris"
  }'
```

## Prochaines étapes

Pour une future version v2, il suffira de :
1. Dupliquer les fichiers `.proto` existants
2. Modifier les routes pour utiliser `/api/v2/`
3. Régénérer avec `buf generate`
4. Les deux versions coexisteront (v1 et v2)
