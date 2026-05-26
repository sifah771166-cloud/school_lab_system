@echo off
REM Automated Git Workflow Script for Windows
REM Usage: auto-commit.bat "commit message"

setlocal enabledelayedexpansion

set "COMMIT_MESSAGE=%~1"
if "!COMMIT_MESSAGE!"=="" set "COMMIT_MESSAGE=Update changes"

set "BRANCH=%~2"
if "!BRANCH!"=="" set "BRANCH=main"

echo.
echo 🔄 Starting automated git workflow...
echo ════════════════════════════════════════════════════════════════════════════════
echo.

REM Step 1: Check git status
echo 📊 Checking git status...
git status
echo.

REM Step 2: Show changes
echo 📝 Changes to be committed:
git diff --stat
echo.

REM Step 3: Ask for approval
echo ════════════════════════════════════════════════════════════════════════════════
set /p APPROVE="✅ Proceed with commit? (y/n): "
if /i not "!APPROVE!"=="y" (
    echo ❌ Commit cancelled
    exit /b 1
)

REM Step 4: Stage all changes
echo.
echo 📦 Staging changes...
git add -A

REM Step 5: Create commit
echo 💾 Creating commit...
git commit -m "!COMMIT_MESSAGE!"

REM Step 6: Ask for push
echo.
echo ════════════════════════════════════════════════════════════════════════════════
set /p PUSH="🚀 Push to remote? (y/n): "
if /i "!PUSH!"=="y" (
    echo.
    echo 🌐 Pushing to remote...
    git push origin !BRANCH!
    echo ✅ Push successful!
) else (
    echo ⏭️  Push skipped
)

echo.
echo ════════════════════════════════════════════════════════════════════════════════
echo ✨ Workflow complete!
echo.
git log --oneline -3
echo.
