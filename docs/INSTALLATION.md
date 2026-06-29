# WinRepo Installation Guide

## Prerequisites
- Docker Engine 24+
- Docker Compose v2+
- Port 80, 443, 5432, 6379, 9000, 9001 available

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ashwanisingh2/IT-Software-Repository.git winrepo
   cd winrepo
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env and change default passwords and JWT secrets
   ```

3. **Start the Services**
   ```bash
   docker-compose up -d
   ```

4. **Verify Deployment**
   Check the health endpoint to ensure all services are connected:
   ```bash
   curl http://localhost/api/health
   ```
   *Expected Response:*
   `{"status":"ok","services":{"db":"ok","redis":"ok","minio":"ok"}}`

5. **Access the Application**
   - Web Dashboard: `http://localhost`
   - MinIO Console: `http://localhost:9001` (Use credentials from .env)
   - API Base URL: `http://localhost/api`

## First Login
The system will automatically create a default admin user on the first start:
- Email: `admin@winrepo.local` (or what is configured in `INITIAL_ADMIN_EMAIL`)
- Password: `changeme123` (or what is configured in `INITIAL_ADMIN_PASSWORD`)

Please log in and change your password immediately.
