#!/bin/bash

# TransitGuard Deployment Script
# This script helps you deploy to various platforms

echo "🚀 TransitGuard Deployment Helper"
echo "=================================="
echo ""
echo "Choose your deployment platform:"
echo "1) Railway (Recommended - Free tier with MySQL)"
echo "2) Render (Free tier)"
echo "3) Docker (Local or any cloud)"
echo "4) Vercel + Railway (Split deployment)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "📦 Deploying to Railway..."
    echo ""
    echo "Steps:"
    echo "1. Install Railway CLI: npm i -g @railway/cli"
    echo "2. Login: railway login"
    echo "3. Initialize: railway init"
    echo "4. Add MySQL: railway add"
    echo "5. Deploy: railway up"
    echo ""
    echo "Don't forget to set environment variables in Railway dashboard!"
    echo "See DEPLOYMENT_INSTRUCTIONS.md for details."
    ;;
  2)
    echo ""
    echo "📦 Deploying to Render..."
    echo ""
    echo "Steps:"
    echo "1. Push code to GitHub"
    echo "2. Go to render.com and create new Web Service"
    echo "3. Connect your GitHub repository"
    echo "4. Render will use render.yaml for configuration"
    echo ""
    echo "See DEPLOYMENT_INSTRUCTIONS.md for details."
    ;;
  3)
    echo ""
    echo "🐳 Building Docker image..."
    echo ""
    
    # Check if .env exists
    if [ ! -f .env ]; then
      echo "⚠️  .env file not found. Creating from example..."
      cp backend/.env.example .env
      echo "✅ Please edit .env with your production values!"
      exit 1
    fi
    
    # Build and run with docker-compose
    echo "Building and starting containers..."
    docker-compose up -d --build
    
    echo ""
    echo "✅ Docker containers started!"
    echo "Backend: http://localhost:5000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    ;;
  4)
    echo ""
    echo "📦 Split Deployment (Vercel + Railway)..."
    echo ""
    echo "Backend (Railway):"
    echo "  - Follow Railway steps above"
    echo ""
    echo "Frontend (Vercel):"
    echo "  1. Install Vercel CLI: npm i -g vercel"
    echo "  2. cd frontend"
    echo "  3. vercel"
    echo "  4. Set VITE_API_URL to your Railway backend URL"
    echo ""
    echo "See DEPLOYMENT_INSTRUCTIONS.md for details."
    ;;
  *)
    echo "Invalid choice. Please run again and select 1-4."
    exit 1
    ;;
esac

echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_INSTRUCTIONS.md"
