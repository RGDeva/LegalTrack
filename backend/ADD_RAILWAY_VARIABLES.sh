#!/bin/bash

# Railway Environment Variables Setup
# Run this script to add all required environment variables

echo "Adding environment variables to Railway..."

# You need to replace these values with your actual credentials:

railway variables --set "DATABASE_URL=your_neon_postgres_url_here"
railway variables --set "JWT_SECRET=your_jwt_secret_at_least_32_characters"
railway variables --set "JWT_EXPIRES_IN=7d"
railway variables --set "ADMIN_EMAIL=dylan.barrett@embeddedcounsel.com"
railway variables --set "ADMIN_PASSWORD=your_secure_password_here"
railway variables --set "PORT=3001"
railway variables --set "FRONTEND_URL=https://legaltrack.vercel.app"

echo "Done! Variables added to Railway."
echo "Service will automatically redeploy."
