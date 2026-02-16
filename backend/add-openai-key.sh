#!/bin/bash

# Script to add OpenAI API key to .env file

echo "🔑 OpenAI API Key Setup for LegalTrack"
echo "======================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Check if OPENAI_API_KEY already exists
if grep -q "OPENAI_API_KEY=" .env; then
    echo "⚠️  OPENAI_API_KEY already exists in .env"
    echo ""
    read -p "Do you want to update it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove existing key
    sed -i.bak '/^OPENAI_API_KEY=/d' .env
fi

# Prompt for API key
echo ""
echo "Enter your OpenAI API key (starts with sk-):"
read -r OPENAI_KEY

# Validate key format
if [[ ! $OPENAI_KEY =~ ^sk- ]]; then
    echo "❌ Invalid API key format. OpenAI keys should start with 'sk-'"
    exit 1
fi

# Add to .env
echo "OPENAI_API_KEY=$OPENAI_KEY" >> .env

echo ""
echo "✅ OpenAI API key added successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server: npm run dev"
echo "2. Check logs for: '✅ OpenAI API key configured'"
echo "3. Test the AI assistant in the app"
echo ""
echo "The AI will now use GPT-4o-mini for enhanced natural language understanding!"
