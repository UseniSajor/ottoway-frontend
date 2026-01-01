#!/bin/bash
# Production Build Script for Unix/Linux/Mac
# Creates production builds for both backend and frontend

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "PHASE 4: PRODUCTION BUILD"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "=== CREATING PRODUCTION BUILDS ==="
echo ""

# Backend production build
echo "📦 Building backend..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    cd ..
    exit 1
fi

# Create backend tarball
echo "Creating backend production package..."
cd ..
tar -czf backend-production.tar.gz \
    backend/dist/ \
    backend/node_modules/ \
    backend/prisma/ \
    backend/package*.json \
    backend/.env.production 2>/dev/null || \
    tar -czf backend-production.tar.gz \
        backend/dist/ \
        backend/node_modules/ \
        backend/prisma/ \
        backend/package*.json

echo "✅ Backend package created: backend-production.tar.gz"

# Frontend production build
echo ""
echo "📦 Building frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build frontend
echo "Building frontend (this may take a while)..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    cd ..
    exit 1
fi

# Create frontend tarball
echo "Creating frontend production package..."
cd ..
tar -czf frontend-production.tar.gz frontend/dist/

echo "✅ Frontend package created: frontend-production.tar.gz"

echo ""
echo "✅ Production builds created successfully!"
echo ""
ls -lh *.tar.gz 2>/dev/null || echo "No tarballs found"
echo ""
echo "⚠️  Next steps:"
echo "  1. Review and update .env.production files with real values"
echo "  2. Deploy backend to Railway"
echo "  3. Deploy frontend to Vercel"

