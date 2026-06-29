# WinRepo Platform

Enterprise Windows Software Repository and Endpoint Management System.

## Architecture
- **API**: Express, Node 20, Postgres, Redis, MinIO (Dockerized)
- **Web**: Next.js 14 App Router, Tailwind, Zustand (Dockerized)
- **Agent**: PowerShell client run via Windows Scheduled Tasks

## Quick Start
1. `cp .env.example .env`
2. `docker compose up -d --build`
3. Web interface: http://localhost:3000
4. API endpoint: http://localhost:4000/api

## Management
Use the provided `Makefile` for operations:
- `make up` - Start all services
- `make logs` - View logs
- `make seed` - Seed the database with the schema and default roles

## Client Installation
Run `scripts/install.bat` as Administrator on target Windows endpoints to install the WinRepo Agent.
