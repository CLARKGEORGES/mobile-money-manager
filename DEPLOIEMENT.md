# Guide de déploiement Vercel — Mobile Money Manager

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel Platform                      │
│                                                         │
│  ┌─────────────────┐      ┌─────────────────────────┐  │
│  │  Frontend        │      │  Backend                 │  │
│  │  Next.js 15      │ ───► │  NestJS (Serverless)    │  │
│  │  Projet: mmm-web │      │  Projet: mmm-api         │  │
│  └─────────────────┘      └──────────┬──────────────┘  │
│                                       │                  │
└───────────────────────────────────────┼──────────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  Neon (PostgreSQL)  │
                              │  Serverless DB      │
                              │  plan gratuit ✓     │
                              └────────────────────┘
```

---

## Étape 1 — Créer la base de données Neon (gratuit)

1. Aller sur **https://console.neon.tech** → **Sign up** (GitHub/Google)
2. Cliquer **Create project**
   - Project name: `mobile-money-manager`
   - Region: **EU Frankfurt** (ou proche de vos utilisateurs)
3. Copier les 2 URLs de connexion :
   - **Connection string** (avec `pgbouncer=true`) → ce sera `DATABASE_URL`
   - Dans **Connection Details** → décocher "Pooled connection" → copier → ce sera `DIRECT_URL`

Exemple de format :
```
DATABASE_URL = postgres://neondb_owner:xxxx@ep-dry-fog-123.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15
DIRECT_URL   = postgres://neondb_owner:xxxx@ep-dry-fog-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

---

## Étape 2 — Installer Vercel CLI

```bash
npm install -g vercel
vercel login   # Se connecter avec GitHub/GitLab/Email
```

---

## Étape 3 — Déployer le Backend NestJS

```bash
cd mobile-money-manager/backend

# Installer les dépendances
npm install

# Générer le client Prisma (avec binaryTargets pour Vercel/Linux)
npx prisma generate

# Build pour Vercel (entry point: lambda.ts)
npx nest build --config nest-cli.vercel.json
```

### Déployer sur Vercel

```bash
vercel
```

Répondre aux questions :
- **Set up and deploy?** → Y
- **Which scope?** → votre compte
- **Link to existing project?** → N
- **Project name?** → `mmm-api`
- **In which directory is your code?** → `./` (déjà dans `/backend`)
- **Want to override the settings?** → N

### Ajouter les variables d'environnement dans Vercel Dashboard

1. Ouvrir **https://vercel.com/dashboard** → projet `mmm-api`
2. Aller dans **Settings → Environment Variables**
3. Ajouter (pour **Production** + **Preview**) :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgres://...?sslmode=require&pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL` | `postgres://...?sslmode=require` |
| `JWT_SECRET` | Chaîne aléatoire ≥ 32 caractères |
| `JWT_REFRESH_SECRET` | Autre chaîne aléatoire ≥ 32 caractères |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | *(renseigner après déploiement frontend, ex: `https://mmm-web.vercel.app`)* |

4. Cliquer **Save**

### Redéployer après avoir ajouté les variables

```bash
vercel --prod
```

### Exécuter les migrations et le seed

```bash
# Dans /backend — une seule fois après premier déploiement
npx prisma migrate deploy
npx ts-node prisma/seeds/seed.ts
```

Votre API est disponible sur : `https://mmm-api.vercel.app`

---

## Étape 4 — Déployer le Frontend Next.js

```bash
cd mobile-money-manager/frontend

# Installer les dépendances
npm install

# Test du build en local
NEXT_PUBLIC_API_URL=https://mmm-api.vercel.app/api/v1 npm run build
```

```bash
vercel
```

Répondre aux questions :
- **Project name?** → `mmm-web`
- Laisser les autres valeurs par défaut

### Ajouter les variables d'environnement du frontend

Dans **Vercel Dashboard → mmm-web → Settings → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://mmm-api.vercel.app/api/v1` |

```bash
vercel --prod
```

Votre app est disponible sur : `https://mmm-web.vercel.app`

---

## Étape 5 — Mettre à jour FRONTEND_URL dans le backend

Retourner dans **Vercel Dashboard → mmm-api → Settings → Environment Variables** :

- Mettre à jour `FRONTEND_URL` = `https://mmm-web.vercel.app`

Puis redéployer le backend :
```bash
cd backend && vercel --prod
```

---

## Résumé des URLs

| Service | URL |
|---------|-----|
| Frontend | `https://mmm-web.vercel.app` |
| Backend API | `https://mmm-api.vercel.app/api/v1` |
| Swagger Docs | `https://mmm-api.vercel.app/api/docs` |
| Neon Console | `https://console.neon.tech` |

---

## Variables d'environnement complètes

### Backend (`mmm-api`)
```env
DATABASE_URL=postgres://USER:PASS@HOST/DB?sslmode=require&pgbouncer=true&connect_timeout=15
DIRECT_URL=postgres://USER:PASS@HOST/DB?sslmode=require
JWT_SECRET=super-secret-random-min-32-chars-xxxxxxxxxxxxxxxx
JWT_REFRESH_SECRET=super-secret-refresh-random-min-32-chars-xxxxxx
NODE_ENV=production
FRONTEND_URL=https://mmm-web.vercel.app
```

### Frontend (`mmm-web`)
```env
NEXT_PUBLIC_API_URL=https://mmm-api.vercel.app/api/v1
```

---

## Déploiement continu (CI/CD automatique)

Connecter votre dépôt GitHub à Vercel pour des déploiements automatiques :

1. **Vercel Dashboard → mmm-api → Settings → Git**
2. Connecter le repo → Branch: `main`
3. Répéter pour `mmm-web`

Désormais, chaque `git push main` déclenche automatiquement un nouveau déploiement.

---

## Commandes utiles

```bash
# Voir les logs du backend en temps réel
vercel logs https://mmm-api.vercel.app

# Lister les déploiements
vercel ls

# Revenir à une version précédente
vercel rollback

# Inspecter un déploiement
vercel inspect <deployment-url>

# Supprimer un déploiement
vercel rm <deployment-url>
```

---

## Dépannage

### Erreur "Module not found" sur Vercel
```bash
# S'assurer que toutes les deps sont dans "dependencies" (pas devDependencies)
# Dans backend/package.json : @prisma/client, bcryptjs, etc. → dependencies
```

### Erreur de connexion Prisma / Neon
```bash
# Vérifier que DATABASE_URL contient bien pgbouncer=true
# Vérifier que DIRECT_URL est l'URL sans pgbouncer
# Dans prisma/schema.prisma : directUrl = env("DIRECT_URL") doit être présent
```

### CORS bloqué
```bash
# Vérifier que FRONTEND_URL dans le backend correspond exactement à l'URL Vercel
# (sans / final, avec https://)
```

### Timeout serverless (> 30s)
```bash
# Dans backend/vercel.json : augmenter maxDuration (max 60s sur plan Pro)
# Optimiser les requêtes Prisma avec select/include ciblés
```

---

## Plan Vercel recommandé

| Plan | Prix | Fonctions serverless | Bande passante |
|------|------|---------------------|----------------|
| **Hobby (gratuit)** | $0/mois | 100 GB-hrs/mois | 100 GB/mois |
| **Pro** | $20/mois | 1000 GB-hrs/mois | 1 TB/mois |

Pour une utilisation en production avec du trafic réel → plan **Pro** recommandé.

Neon plan gratuit : 0,5 GB storage, 100h compute/mois — suffisant pour démarrer.
