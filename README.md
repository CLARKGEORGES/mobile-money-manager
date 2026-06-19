# 📱 Mobile Money Manager

Plateforme professionnelle de gestion des transactions Mobile Money destinée aux entreprises, commerçants et gestionnaires financiers.

## ✨ Fonctionnalités

- **Authentification JWT** — Login, logout, refresh token, changement de mot de passe
- **Gestion des rôles** — Super Admin, Admin, Comptable, Agent, Auditeur (RBAC complet)
- **Opérateurs** — Orange Money, MTN MoMo, Moov Money, Wave
- **Comptes Mobile Money** — Soldes en temps réel, multi-opérateurs
- **Transactions** — CRUD complet, validation, annulation, filtres avancés
- **Dashboard** — KPIs, graphiques mensuels, répartition par opérateur
- **Rapports financiers** — Journalier, hebdomadaire, mensuel, annuel, personnalisé
- **Audit** — Journal complet de toutes les actions avec ancienne/nouvelle valeur
- **Notifications** — Système de notifications intégré
- **Mode sombre** — Basculement dynamique clair/sombre
- **Responsive** — Mobile, tablette, desktop

## 🛠 Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, React Query, Recharts |
| Backend | NestJS 10, TypeScript, Prisma ORM, PostgreSQL |
| Auth | JWT (access 15min + refresh 7j), bcrypt |
| Infra | Docker, Docker Compose, GitHub Actions |

## 🚀 Démarrage rapide

### Prérequis

- Node.js ≥ 20
- Docker & Docker Compose
- npm ≥ 9

### Option 1 — Docker Compose (recommandée)

```bash
# Cloner le projet
git clone <repo-url> mobile-money-manager
cd mobile-money-manager

# Démarrer tous les services
docker-compose up -d

# Exécuter les migrations et le seed
docker exec mmm-backend sh -c "npx prisma migrate deploy && npx ts-node prisma/seeds/seed.ts"
```

Accès :
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001/api/v1
- Swagger : http://localhost:3001/api/docs

### Option 2 — Développement local

#### 1. Base de données

```bash
# Démarrer seulement PostgreSQL
docker-compose up postgres -d
```

#### 2. Backend

```bash
cd backend
cp .env.example .env   # Copier et adapter les variables

npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seeds/seed.ts

npm run start:dev
```

#### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local

npm install
npm run dev
```

### Variables d'environnement

**Backend `.env`** :
```env
DATABASE_URL="postgresql://mmm_user:mmm_password@localhost:5432/mobile_money_db?schema=public"
JWT_SECRET="your-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`** :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 🔐 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | superadmin@mobilemoney.com | SuperAdmin@123 |
| Admin | admin@mobilemoney.com | Admin@123 |
| Comptable | comptable@mobilemoney.com | Comptable@123 |
| Agent | agent@mobilemoney.com | Agent@123 |

## 📁 Structure du projet

```
mobile-money-manager/
├── backend/                    # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma de base de données
│   │   └── seeds/seed.ts       # Données de démonstration
│   ├── src/
│   │   ├── auth/               # Authentification JWT
│   │   ├── users/              # Gestion des utilisateurs
│   │   ├── roles/              # Rôles et permissions
│   │   ├── operators/          # Opérateurs Mobile Money
│   │   ├── accounts/           # Comptes Mobile Money
│   │   ├── transactions/       # Transactions
│   │   ├── customers/          # Clients
│   │   ├── dashboard/          # Statistiques
│   │   ├── reports/            # Rapports
│   │   ├── audit/              # Journal d'audit
│   │   ├── notifications/      # Notifications
│   │   ├── common/             # Guards, filtres, décorateurs
│   │   └── prisma/             # Service Prisma
│   └── Dockerfile
├── frontend/                   # Next.js 15 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/   # Page de connexion
│   │   │   └── (dashboard)/    # Pages protégées
│   │   │       ├── page.tsx    # Dashboard
│   │   │       ├── transactions/
│   │   │       ├── accounts/
│   │   │       ├── users/
│   │   │       ├── customers/
│   │   │       ├── operators/
│   │   │       ├── reports/
│   │   │       ├── audit/
│   │   │       └── settings/
│   │   ├── components/         # Composants réutilisables
│   │   ├── services/           # Appels API
│   │   ├── store/              # État global (Zustand)
│   │   ├── types/              # Types TypeScript
│   │   └── lib/                # Utilitaires
│   └── Dockerfile
├── .github/workflows/ci.yml    # Pipeline CI/CD
└── docker-compose.yml
```

## 📋 API REST

L'API est documentée avec Swagger : `http://localhost:3001/api/docs`

### Endpoints principaux

```
POST   /api/v1/auth/login              Connexion
POST   /api/v1/auth/logout             Déconnexion
GET    /api/v1/auth/profile            Profil utilisateur
PATCH  /api/v1/auth/change-password    Changer mot de passe

GET    /api/v1/users                   Lister utilisateurs
POST   /api/v1/users                   Créer utilisateur
PATCH  /api/v1/users/:id               Modifier utilisateur
PATCH  /api/v1/users/:id/status        Changer statut

GET    /api/v1/accounts                Lister comptes
POST   /api/v1/accounts                Créer compte
PATCH  /api/v1/accounts/:id            Modifier compte

GET    /api/v1/transactions            Lister transactions (filtres avancés)
POST   /api/v1/transactions            Créer transaction
PATCH  /api/v1/transactions/:id/validate   Valider
PATCH  /api/v1/transactions/:id/cancel     Annuler

GET    /api/v1/dashboard/summary       Résumé KPIs
GET    /api/v1/dashboard/monthly-chart Graphique mensuel
GET    /api/v1/reports                 Générer rapport
GET    /api/v1/audit                   Journal d'audit
```

## 🏗 Architecture

L'application suit les principes :
- **Clean Architecture** — Séparation controller / service / repository
- **SOLID** — Injection de dépendances NestJS
- **RBAC** — Contrôle d'accès basé sur les rôles
- **Soft delete** — Suppression logique (deletedAt)
- **Audit trail** — Traçabilité complète avec ancienne/nouvelle valeur
- **Pagination** — Toutes les listes paginées

## 📊 Schéma de base de données

```
User ──── Role ──── Permission
  │
  ├── Transaction ──── MobileMoneyAccount ──── MobileMoneyOperator
  │         └── Customer
  │         └── Attachment
  ├── AuditLog
  ├── Notification
  └── LoginHistory
```

## 🧪 Tests

```bash
# Backend - tests unitaires
cd backend && npm test

# Backend - coverage
cd backend && npm run test:cov

# Backend - tests e2e
cd backend && npm run test:e2e
```

## 🚢 Déploiement production

```bash
# Build et déploiement avec Docker
docker-compose -f docker-compose.yml up -d --build

# Migrations de production
docker exec mmm-backend npx prisma migrate deploy

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📈 Roadmap

- [ ] Export PDF/Excel des rapports
- [ ] Upload de pièces justificatives
- [ ] Rapprochement automatique de caisse
- [ ] Alertes SMS/Email
- [ ] API Webhook pour intégrations externes
- [ ] Tableau de bord personnalisable par rôle

---

Développé avec ❤️ pour la gestion Mobile Money en Afrique de l'Ouest.
