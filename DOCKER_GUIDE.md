# Docker Deployment Guide

## Quick Start

### 1. Setup Environment Variables
```bash
cp .env.docker .env
# Edit .env with your configuration
```

### 2. Build and Start Services
```bash
# Build images and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 3. Access Application
- **Frontend:** http://localhost
- **Backend API:** http://localhost:5001/api/v1
- **Nginx Proxy:** http://localhost:8080

---

## Services

### PostgreSQL (postgres)
- **Port:** 5432
- **User:** labadmin (default)
- **Password:** labpass (default)
- **Database:** school_lab
- **Volume:** postgres_data

### Backend (backend)
- **Port:** 5000 (internal), 5001 (external)
- **Environment:** Production
- **Auto-runs:** Prisma migrations & seed

### Frontend (frontend)
- **Port:** 80
- **Build:** Vite production build
- **Served by:** Nginx

### Nginx (nginx)
- **Port:** 8080
- **Role:** Reverse proxy & load balancer

---

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
docker-compose logs -f
```

### Execute Commands in Container
```bash
# Backend
docker-compose exec backend npm run prisma:seed
docker-compose exec backend npx prisma studio

# Frontend
docker-compose exec frontend npm run build

# Database
docker-compose exec postgres psql -U labadmin -d school_lab
```

### Rebuild Images
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Remove Everything
```bash
docker-compose down -v
```

---

## Environment Variables

### Database
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name

### Backend
- `NODE_ENV` - Environment (production/development)
- `BACKEND_PORT` - Backend port
- `JWT_SECRET` - JWT secret key (CHANGE IN PRODUCTION!)
- `JWT_EXPIRES_IN` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS

### Frontend
- `VITE_API_URL` - Backend API URL

---

## Production Deployment

### 1. Update Environment Variables
```bash
# Edit .env with production values
DB_PASSWORD=strong-password-here
JWT_SECRET=very-long-random-secret-key-here
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api/v1
```

### 2. Enable HTTPS
```bash
# Place SSL certificates in ./ssl directory
# Update nginx.conf to use SSL
```

### 3. Deploy
```bash
docker-compose up -d
```

### 4. Monitor
```bash
docker-compose logs -f
```

---

## Troubleshooting

### Database Connection Error
```bash
# Check if postgres is running
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Rebuild backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Frontend Not Loading
```bash
# Check logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml or .env
# Or kill process using the port
lsof -i :5001  # Check what's using port 5001
```

---

## Health Checks

All services have health checks configured:
- PostgreSQL: Checks if database is ready
- Backend: Depends on PostgreSQL health
- Frontend: Depends on Backend

View health status:
```bash
docker-compose ps
```

---

## Backup & Restore

### Backup Database
```bash
docker-compose exec postgres pg_dump -U labadmin school_lab > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U labadmin school_lab < backup.sql
```

---

## Performance Optimization

### Increase Resources
Edit docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Enable Caching
Nginx caching is already configured in nginx.conf

### Database Optimization
```bash
docker-compose exec postgres psql -U labadmin -d school_lab
# Run: VACUUM ANALYZE;
```

---

## Security Best Practices

1. **Change Default Credentials**
   - Update DB_PASSWORD in .env
   - Update JWT_SECRET in .env

2. **Enable HTTPS**
   - Place SSL certificates in ./ssl
   - Update nginx.conf

3. **Restrict Network Access**
   - Use firewall rules
   - Only expose necessary ports

4. **Regular Backups**
   - Backup database regularly
   - Store backups securely

5. **Update Images**
   - Regularly update base images
   - Run `docker-compose build --no-cache`

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Check GitHub issues
4. Contact support
