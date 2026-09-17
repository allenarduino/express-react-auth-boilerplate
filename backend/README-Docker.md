# Docker Setup for Express Auth API

This document provides instructions for running the Express Authentication API using Docker and Docker Compose.

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- Make (optional, for convenience commands)

## Quick Start

### Using Make Commands (Recommended)

```bash
# Start development environment with hot reload
make run-dev

# Start production environment
make run-local

# Stop all services
make down-local

# View logs
make logs

# Run database migrations
make migrate

# Open shell in app container
make shell

# Run tests
make test

# Clean up everything
make clean
```

### Using Docker Compose Directly

```bash
# Start all services (production)
docker-compose up -d

# Start development environment
docker-compose up -d app-dev db

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec app npx prisma db push
```

## Services

### Database (PostgreSQL 16)
- **Container**: `express-react-auth-db`
- **Port**: `5433` (host) → `5432` (container)
- **Database**: `express_react_auth`
- **User**: `app_user`
- **Password**: `app_password`

### Application (Production)
- **Container**: `auth-api-app`
- **Port**: `4000`
- **URL**: `http://localhost:4000`
- **Environment**: Production

### Application (Development)
- **Container**: `auth-api-app-dev`
- **Port**: `4001`
- **URL**: `http://localhost:4001`
- **Environment**: Development with hot reload

## Environment Variables

The following environment variables are configured in `docker-compose.yml`:

```yaml
NODE_ENV: production/development
DATABASE_URL: "postgresql://app_user:app_password@db:5432/express_react_auth"
JWT_SECRET: "your-production-jwt-secret-change-this"
JWT_EXPIRES_IN: "1d"
EMAIL_PROVIDER: "console"
APP_URL: "http://localhost:4000"
PORT: 4000
```

## Database Management

### Running Migrations

```bash
# Using Make
make migrate

# Using Docker Compose
docker-compose exec app npx prisma db push

# Reset database
docker-compose exec app npx prisma migrate reset --force
```

### Accessing Database

```bash
# Using Make
make db-shell

# Using Docker Compose
docker-compose exec db psql -U app_user -d express_react_auth

# Using an external PostgreSQL client
# Host: localhost
# Port: 5433
# Database: express_react_auth
# Username: app_user
# Password: app_password
```

## Development Workflow

### 1. Start Development Environment

```bash
make run-dev
```

This will:
- Start PostgreSQL database
- Start the application with hot reload
- Run database migrations automatically
- Mount source code for live updates

### 2. Make Changes

Edit your code in the `src/` directory. Changes will be automatically reflected in the running container.

### 3. Run Tests

```bash
make test
```

### 4. View Logs

```bash
make logs
```

### 5. Stop Services

```bash
make down-local
```

## Production Deployment

### 1. Build and Start

```bash
make run-local
```

### 2. Verify Health

```bash
curl http://localhost:4000/health
```

### 3. Test API Endpoints

```bash
# Signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Health check
curl http://localhost:4000/health
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
make logs

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart app
```

### Database Connection Issues

```bash
# Check database logs
make logs-db

# Test database connection
make db-shell

# Reset database
make migrate-reset
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :4000
lsof -i :5433

# Stop conflicting services or change ports in docker-compose.yml
```

### Clean Up Everything

```bash
# Remove all containers, volumes, and images
make clean

# Or manually
docker-compose down -v --rmi all
docker system prune -f
```

## File Structure

```
backend/
├── Dockerfile              # Container definition
├── docker-compose.yml      # Multi-container setup
├── .dockerignore          # Files to exclude from build
├── Makefile               # Convenience commands
├── README-Docker.md       # This file
└── ...
```

## Security Notes

- Change default passwords in production
- Use environment-specific JWT secrets
- Consider using Docker secrets for sensitive data
- Regularly update base images
- Run containers as non-root user (already configured)

## Performance Tips

- Use `.dockerignore` to reduce build context
- Leverage Docker layer caching
- Use multi-stage builds for smaller images
- Consider using Docker volumes for persistent data
