# WinRepo API Documentation

## Base URL
`/api`

## Authentication

All protected routes require a JWT token in the Authorization header:
`Authorization: Bearer <token>`

### POST `/api/auth/login`
Logs in a user and returns access and refresh tokens.
- **Body**: `{ "email": "admin@example.com", "password": "password123" }`
- **Response**: `{ "success": true, "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }`

### POST `/api/auth/refresh`
Refreshes an expired access token.
- **Body**: `{ "refreshToken": "..." }`
- **Response**: `{ "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }`

## Software Management

### GET `/api/software`
Gets a paginated list of software.
- **Query Params**: `page` (default 1), `pageSize` (default 10), `search`, `category`
- **Response**: `{ "success": true, "data": { "items": [...], "total": 45, "page": 1, "pageSize": 10, "totalPages": 5 } }`

### POST `/api/software`
Uploads a new software package (Requires role: admin or deployer).
- **Body**: `multipart/form-data` with fields `name`, `version`, `vendor`, `category`, and `file`.
- **Response**: `{ "success": true, "data": { ...softwareObject } }`

### GET `/api/software/:id/download`
Gets a presigned download URL and increments the download counter.
- **Response**: `{ "success": true, "data": { "url": "https://minio..." } }`
