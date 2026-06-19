#!/bin/bash
# ─── Script de déploiement Vercel ────────────────────────────────────────────
# Usage: bash deploy.sh

set -e

echo "🚀 Déploiement Mobile Money Manager sur Vercel"
echo "================================================"

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  echo "📦 Installation de Vercel CLI..."
  npm install -g vercel
fi

# ─── 1. Déploiement Backend ───────────────────────────────────────────────────
echo ""
echo "📡 [1/3] Déploiement du Backend NestJS..."
cd backend

echo "  → Génération du client Prisma..."
npx prisma generate

echo "  → Build NestJS (entry: lambda)..."
npm run build:vercel

echo "  → Déploiement sur Vercel..."
vercel --prod --yes

BACKEND_URL=$(vercel --prod --yes 2>/dev/null | grep "https://" | tail -1)
echo "  ✅ Backend déployé : $BACKEND_URL"

cd ..

# ─── 2. Déploiement Frontend ──────────────────────────────────────────────────
echo ""
echo "🖥  [2/3] Déploiement du Frontend Next.js..."
cd frontend

echo "  → Mise à jour de l'URL de l'API..."
# Met à jour l'env var avec l'URL du backend
vercel env add NEXT_PUBLIC_API_URL production <<< "${BACKEND_URL}/api/v1" 2>/dev/null || true

echo "  → Déploiement sur Vercel..."
vercel --prod --yes

FRONTEND_URL=$(vercel --prod --yes 2>/dev/null | grep "https://" | tail -1)
echo "  ✅ Frontend déployé : $FRONTEND_URL"

cd ..

# ─── 3. Migration base de données ────────────────────────────────────────────
echo ""
echo "🗄  [3/3] Migration de la base de données..."
cd backend

echo "  → Exécution des migrations Prisma..."
npx prisma migrate deploy

echo "  → Seed des données de démonstration..."
npx ts-node prisma/seeds/seed.ts

cd ..

echo ""
echo "🎉 Déploiement terminé !"
echo "========================"
echo "  Frontend : $FRONTEND_URL"
echo "  Backend  : $BACKEND_URL"
echo "  Swagger  : ${BACKEND_URL}/api/docs"
echo ""
echo "📋 Comptes de démonstration :"
echo "  Super Admin : superadmin@mobilemoney.com / SuperAdmin@123"
echo "  Admin       : admin@mobilemoney.com / Admin@123"
echo "  Comptable   : comptable@mobilemoney.com / Comptable@123"
echo "  Agent       : agent@mobilemoney.com / Agent@123"
