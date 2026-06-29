.PHONY: up down build logs test clean seed

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test:
	npm run test --workspaces

clean:
	docker compose down -v
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

seed:
	PGPASSWORD=changeme psql -h localhost -U winrepo -d winrepo -f database/schema.sql
