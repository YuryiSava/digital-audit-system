#!/bin/bash
# Release v0.3.0 - Pre-Audit Setup
# Скрипт для создания git tag и фиксации релиза

echo "🎉 Creating Release v0.3.0"
echo "=========================="
echo ""

# Проверка что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from project root."
    exit 1
fi

# Проверка версии в package.json
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "📦 Current version: $VERSION"

if [ "$VERSION" != "0.3.0" ]; then
    echo "⚠️  Warning: package.json version is $VERSION, expected 0.3.0"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📝 Release Notes:"
echo "- Pre-Audit Setup Wizard (3 steps)"
echo "- Freeze Baseline functionality"
echo "- Requirement Set Publishing"
echo "- Extended Project Model (6 new fields)"
echo "- UI Cleanup (removed old AI parsing button)"
echo ""

# Git operations
echo "🔍 Checking git status..."
git status --short

echo ""
read -p "Stage all changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    echo "✅ Changes staged"
fi

echo ""
read -p "Create commit? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "Release v0.3.0 - Pre-Audit Setup

Features:
- Pre-Audit Setup Wizard with 3 steps
- Freeze Baseline functionality
- Requirement Set Publishing
- Extended Project Model
- UI Cleanup

Technical:
- 9 new files
- 6 modified files
- Database migration for Project model
- Comprehensive documentation"
    echo "✅ Commit created"
fi

echo ""
read -p "Create git tag v0.3.0? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag -a v0.3.0 -m "Release v0.3.0 - Pre-Audit Setup

Pre-Audit Setup Wizard, Freeze Baseline, Requirement Publishing

See RELEASE_v0.3.0.md for full release notes."
    echo "✅ Tag v0.3.0 created"
    
    echo ""
    echo "📌 To push tag to remote:"
    echo "   git push origin v0.3.0"
fi

echo ""
echo "✅ Release v0.3.0 prepared!"
echo ""
echo "📚 Documentation:"
echo "   - CHANGELOG.md"
echo "   - RELEASE_v0.3.0.md"
echo "   - RELEASE_NOTES.md"
echo "   - PRE_AUDIT_IMPLEMENTATION.md"
echo "   - TESTING_PRE_AUDIT.md"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the new features"
echo "   2. Push changes: git push"
echo "   3. Push tag: git push origin v0.3.0"
echo ""
