#!/bin/bash
# Automated Git Workflow Script
# Usage: ./auto-commit.sh "commit message"

set -e

COMMIT_MESSAGE="${1:-Update changes}"
BRANCH="${2:-main}"

echo "🔄 Starting automated git workflow..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Check git status
echo "📊 Checking git status..."
git status

# Step 2: Show changes
echo ""
echo "📝 Changes to be committed:"
git diff --stat

# Step 3: Ask for approval
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "✅ Proceed with commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Commit cancelled"
    exit 1
fi

# Step 4: Stage all changes
echo ""
echo "📦 Staging changes..."
git add -A

# Step 5: Create commit
echo "💾 Creating commit..."
git commit -m "$COMMIT_MESSAGE"

# Step 6: Ask for push
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "🚀 Push to remote? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Pushing to remote..."
    git push origin $BRANCH
    echo "✅ Push successful!"
else
    echo "⏭️  Push skipped"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Workflow complete!"
echo ""
git log --oneline -3
