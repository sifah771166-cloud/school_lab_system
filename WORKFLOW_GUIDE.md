# Automated Workflow Guide

## 🚀 Quick Start

### Option 1: Using Bash Script (Linux/Mac)
```bash
chmod +x auto-commit.sh
./auto-commit.sh "Your commit message"
```

### Option 2: Using Batch Script (Windows)
```cmd
auto-commit.bat "Your commit message"
```

### Option 3: Manual Workflow
```bash
# Stage changes
git add -A

# Commit with message
git commit -m "Your commit message"

# Push to remote
git push origin main
```

---

## 📋 Workflow Steps

### 1. Make Changes
Edit files in your project

### 2. Run Auto-Commit
```bash
./auto-commit.sh "feat: Add new feature"
```

### 3. Review Changes
The script will show:
- Current git status
- Files changed
- Lines added/removed

### 4. Approve Commit
Type `y` to proceed or `n` to cancel

### 5. Approve Push
Type `y` to push to remote or `n` to skip

---

## 🐳 Docker Workflow

### Start Services
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Make Changes
Edit your code

### Commit Changes
```bash
./auto-commit.sh "feat: Update feature"
```

### Rebuild Docker (if needed)
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Commit Message Format

### Feature
```
feat: Add new attendance tracking feature
```

### Bug Fix
```
fix: Resolve null reference error in attendance service
```

### Enhancement
```
feat: Improve UI with modern gradients and animations
```

### Documentation
```
docs: Update Docker deployment guide
```

### Chore
```
chore: Update dependencies and configuration
```

### Refactor
```
refactor: Reorganize attendance module structure
```

---

## 🔄 Complete Workflow Example

```bash
# 1. Make changes to your code
# Edit files...

# 2. Run auto-commit
./auto-commit.sh "feat: Add advanced attendance feature"

# 3. Review the changes shown
# Check git status and diff

# 4. Approve commit (type 'y')
# Commit is created

# 5. Approve push (type 'y')
# Changes are pushed to GitHub

# 6. Verify on GitHub
# Check your repository for the new commit
```

---

## 🐳 Docker + Git Workflow

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Make changes to code
# Edit files...

# 3. Test changes in Docker
docker-compose logs -f backend

# 4. Commit and push changes
./auto-commit.sh "feat: Update feature"

# 5. Rebuild Docker if needed
docker-compose build --no-cache
docker-compose up -d

# 6. Verify changes
docker-compose logs -f
```

---

## 🛠️ Troubleshooting

### Script Not Found
```bash
# Make sure you're in the project root directory
cd /path/to/school-lab-system

# For bash script, ensure it's executable
chmod +x auto-commit.sh
```

### Permission Denied
```bash
# On Linux/Mac, make script executable
chmod +x auto-commit.sh
```

### Git Not Found
```bash
# Install Git or add to PATH
# Windows: https://git-scm.com/download/win
# Mac: brew install git
# Linux: sudo apt-get install git
```

### Push Failed
```bash
# Check remote URL
git remote -v

# Update remote if needed
git remote set-url origin https://github.com/your-username/repo.git

# Try push again
git push origin main
```

---

## 📊 Monitoring

### View Recent Commits
```bash
git log --oneline -10
```

### View Branch Status
```bash
git status
```

### View Changes
```bash
git diff
```

### View Staged Changes
```bash
git diff --staged
```

---

## 🔐 Security Tips

1. **Never commit secrets**
   - Use .env files
   - Add to .gitignore

2. **Review changes before commit**
   - The script shows all changes
   - Verify before approving

3. **Use meaningful commit messages**
   - Helps track changes
   - Easier to revert if needed

4. **Keep commits atomic**
   - One feature per commit
   - Easier to manage

---

## 🚀 CI/CD Integration

The workflow is ready for GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: docker-compose build
      - name: Push to registry
        run: docker-compose push
```

---

## 📞 Support

For issues:
1. Check git status: `git status`
2. View logs: `docker-compose logs -f`
3. Review DOCKER_GUIDE.md
4. Check GitHub issues
