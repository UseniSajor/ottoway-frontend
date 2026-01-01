#!/bin/bash
# Bash script to set all required Railway environment variables
# Run from the backend directory

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "SETTING RAILWAY ENVIRONMENT VARIABLES"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if we're in a Railway project
echo "Checking Railway project connection..."
if ! railway status &> /dev/null; then
    echo "⚠️  Not connected to Railway project. Linking..."
    railway link
fi

echo ""
echo "=== SETTING REQUIRED ENVIRONMENT VARIABLES ==="
echo ""

# 1. NODE_ENV
echo "Setting NODE_ENV=production..."
railway variables set NODE_ENV=production && echo "✅ NODE_ENV set" || echo "❌ Failed to set NODE_ENV"

# 2. PORT
echo "Setting PORT=5001..."
railway variables set PORT=5001 && echo "✅ PORT set" || echo "❌ Failed to set PORT"

# 3. JWT_SECRET (generate)
echo "Generating JWT_SECRET..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
railway variables set "JWT_SECRET=$JWT_SECRET" && echo "✅ JWT_SECRET generated and set" || echo "❌ Failed to set JWT_SECRET"

# 4. CORS_ORIGIN (prompt user)
echo ""
echo "CORS_ORIGIN is required. Enter your Vercel frontend URL:"
echo "Example: https://kealee-platform.vercel.app"
read -p "CORS_ORIGIN: " CORS_ORIGIN

if [ -n "$CORS_ORIGIN" ]; then
    railway variables set "CORS_ORIGIN=$CORS_ORIGIN" && echo "✅ CORS_ORIGIN set to $CORS_ORIGIN" || echo "❌ Failed to set CORS_ORIGIN"
else
    echo "⚠️  Skipping CORS_ORIGIN (set manually later)"
fi

echo ""
echo "=== OPTIONAL ENVIRONMENT VARIABLES ==="
echo ""

# Ask about optional variables
read -p "Set Stripe keys? (y/n): " SET_STRIPE
if [ "$SET_STRIPE" = "y" ] || [ "$SET_STRIPE" = "Y" ]; then
    read -p "STRIPE_SECRET_KEY (sk_live_...): " STRIPE_SECRET
    [ -n "$STRIPE_SECRET" ] && railway variables set "STRIPE_SECRET_KEY=$STRIPE_SECRET"
    
    read -p "STRIPE_WEBHOOK_SECRET (whsec_...): " STRIPE_WEBHOOK
    [ -n "$STRIPE_WEBHOOK" ] && railway variables set "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK"
fi

read -p "Set Anthropic API key? (y/n): " SET_ANTHROPIC
if [ "$SET_ANTHROPIC" = "y" ] || [ "$SET_ANTHROPIC" = "Y" ]; then
    read -p "ANTHROPIC_API_KEY (sk-ant-...): " ANTHROPIC_KEY
    [ -n "$ANTHROPIC_KEY" ] && railway variables set "ANTHROPIC_API_KEY=$ANTHROPIC_KEY"
fi

read -p "Set AWS credentials? (y/n): " SET_AWS
if [ "$SET_AWS" = "y" ] || [ "$SET_AWS" = "Y" ]; then
    read -p "AWS_ACCESS_KEY_ID: " AWS_KEY
    [ -n "$AWS_KEY" ] && railway variables set "AWS_ACCESS_KEY_ID=$AWS_KEY"
    
    read -p "AWS_SECRET_ACCESS_KEY: " AWS_SECRET
    [ -n "$AWS_SECRET" ] && railway variables set "AWS_SECRET_ACCESS_KEY=$AWS_SECRET"
    
    read -p "AWS_REGION (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    railway variables set "AWS_REGION=$AWS_REGION"
    
    read -p "AWS_S3_BUCKET: " AWS_BUCKET
    [ -n "$AWS_BUCKET" ] && railway variables set "AWS_S3_BUCKET=$AWS_BUCKET"
fi

echo ""
echo "=== VERIFYING ENVIRONMENT VARIABLES ==="
echo ""
railway variables

echo ""
echo "=== REDEPLOYING BACKEND ==="
echo ""
read -p "Redeploy backend now? (y/n): " REDEPLOY
if [ "$REDEPLOY" = "y" ] || [ "$REDEPLOY" = "Y" ]; then
    echo "Deploying..."
    railway up
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Get your backend URL with: railway domain"
else
    echo "⚠️  Remember to redeploy: railway up"
fi

echo ""
echo "✅ Environment variables setup complete!"

