# Makefile for Auth Starter

.PHONY: run-local down-local clean logs backend-logs frontend-logs db-logs migrate test

# Start all services in development mode
run-local:
	@echo "Starting fullstack app with Docker..."
	docker compose up --build

# Stop all services
down-local:
	@echo "Stopping all services..."
	docker compose down

# Stop all services and remove volumes
clean:
	@echo "Cleaning up containers and volumes..."
	docker compose down -v
	docker system prune -f

# View logs for all services
logs:
	@echo "Viewing logs for all services..."
	docker compose logs -f

# View backend logs only
backend-logs:
	@echo "Viewing backend logs..."
	docker compose logs -f backend

# View frontend logs only
frontend-logs:
	@echo "Viewing frontend logs..."
	docker compose logs -f frontend

# View database logs only
db-logs:
	@echo "Viewing database logs..."
	docker compose logs -f db

# Run database migrations
migrate:
	@echo "Running database migrations..."
	docker compose exec backend npx prisma migrate dev

# Run tests
test:
	@echo "Running tests..."
	docker compose exec backend npm test

# Help command
help:
	@echo "Available commands:"
	@echo "  run-local      - Start all services in development mode"
	@echo "  down-local     - Stop all services"
	@echo "  clean          - Stop services and remove volumes"
	@echo "  logs           - View logs for all services"
	@echo "  backend-logs   - View backend logs only"
	@echo "  frontend-logs  - View frontend logs only"
	@echo "  db-logs        - View database logs only"
	@echo "  migrate        - Run database migrations"
	@echo "  test           - Run backend tests"
	@echo "  help           - Show this help message"

