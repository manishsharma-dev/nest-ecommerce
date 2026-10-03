# Nest Ecommerce Backend

An ecommerce backend built with NestJS, TypeScript, PostgreSQL, and TypeORM. Intended clients are Angular and Ionic browser/native applications.

## Implemented Features

- User registration with input validation and Argon2id password hashing.
- Login with JWT access tokens and random refresh tokens.
- Protected user profile endpoint.
- Refresh-token rotation with database transactions and row locking.
- Single-session logout that revokes rotated tokens within the same session family.
- Logout from all devices.
- Swagger/OpenAPI documentation.

Browser cookie authentication and frontend integration are not yet complete.

## Requirements

Development versions:

- Node.js: 26.3.0
- npm: 11.16.0
- PostgreSQL: local server on port 5432

## Setup

Run commands from the project root.

Install dependencies:

```powershell
npm ci
```

Create the database through pgAdmin or a PostgreSQL query tool:

```sql
CREATE DATABASE ecommerce;
```

Create `.env` beside `package.json`:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD="replace_with_your_postgres_password"
DB_DATABASE=ecommerce
JWT_ACCESS_SECRET=replace_with_a_generated_secret
```

Generate a JWT signing secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `JWT_ACCESS_SECRET`. Keep credentials and tokens private.

Build and apply migrations:

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js
```

Start the development server:

```powershell
npm run start:dev
```

The API runs at `http://localhost:3000` by default. Restart the server after changing `.env`.

## API Documentation

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

Documentation includes request fields, validation limits, response schemas, error statuses, and bearer authentication.

For protected endpoints, click **Authorize** in Swagger and enter the access token without the `Bearer` prefix.

## Database Migrations

Automatic schema synchronization is disabled.

Migration configuration:

```text
src/database/data-source.ts
```

Compiled configuration used by the migration tool:

```text
dist/database/data-source.js
```

Current tables:

- `users`
- `refresh_sessions`
- `migrations`

### Generate a Migration

After changing entities, register any new entities in the migration data source and the appropriate NestJS feature module.

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:generate ./src/database/migrations/DescribeYourChange -d ./dist/database/data-source.js
```

Replace `DescribeYourChange` with a descriptive name.

Review generated SQL before applying it. Adding required columns to populated tables may require backfilling existing rows first.

### Apply Pending Migrations

Rebuild after generating or editing a migration:

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js
```

TypeORM records applied migrations and skips them on subsequent runs.

### Show Migration Status

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:show -d ./dist/database/data-source.js
```

### Revert the Latest Migration

Review its `down()` method before running. Reverting can delete data.

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:revert -d ./dist/database/data-source.js
```

### Stale Build Files

When deleting or renaming an unapplied migration, remove the project's `dist` folder before rebuilding. Otherwise, stale compiled migrations may execute alongside their replacements.

Do not rewrite applied migrations. Create a new migration for subsequent changes.

## Authentication Endpoints

| Method | Endpoint | Authentication | Success |
|--------|----------|----------------|---------|
| POST | `/auth/register` | Registration body | 201 |
| POST | `/auth/login` | Email and password | 200 |
| GET | `/auth/me` | Bearer access token | 200 |
| POST | `/auth/refresh` | Refresh token in body | 200 |
| POST | `/auth/logout` | Refresh token in body | 204 |
| POST | `/auth/logout-all` | Bearer access token | 204 |

### Registration

```json
{
  "name": "Manish",
  "email": "manish@example.com",
  "password": "LearningNest123!"
}
```

Rules:

- Name: 1–100 characters; trimmed and rejected if blank.
- Email: valid email, maximum 254 characters; normalized to lowercase.
- Password: 12–128 characters.
- Unexpected fields are rejected.

Successful registration returns public user details without issuing tokens.

Invalid input returns `400`. A duplicate email returns `409`.

### Login

```json
{
  "email": "manish@example.com",
  "password": "LearningNest123!"
}
```

Successful login returns:

- `accessToken`
- `refreshToken`
- `refreshTokenExpiresAt`
- `tokenType`
- `expiresIn`, in seconds
- Public `user` details

Incorrect credentials return `401`.

### Protected Requests

```text
Authorization: Bearer <accessToken>
```

`GET /auth/me` returns the authenticated user's public profile.

Missing, invalid, or expired access tokens return `401`.

### Refresh

```json
{
  "refreshToken": "<latest-refresh-token>"
}
```

A successful refresh returns replacement access and refresh tokens.

Clients must:

- Replace the stored refresh token after each successful refresh.
- Send only one refresh request at a time.
- Treat `401` as a failed refresh and require login again.

Malformed input returns `400`. Unknown, expired, revoked, or already-used refresh tokens return `401`.

### Logout

```json
{
  "refreshToken": "<refresh-token>"
}
```

Logout revokes the supplied token's entire session family, including rotated replacements. Other login families remain active.

A correctly formatted unknown or already-revoked token still returns `204`. Successful responses have no body.

### Logout From All Devices

Send `POST /auth/logout-all` with a bearer access token and no request body.

All current refresh sessions for the user are revoked. Success returns `204` with no body.

## Token and Session Behaviour

- Access tokens expire after 15 minutes.
- Access-token verification checks signature, expiry, issuer, and audience.
- Refresh sessions expire seven days after login.
- Rotation preserves the original session expiry.
- Each login starts a separate session family.
- Only SHA-256 hashes of refresh tokens are stored in PostgreSQL.
- Passwords are hashed with Argon2id.
- Logout does not immediately invalidate existing access tokens; they remain usable until expiry.
- Reusing a revoked refresh token is rejected. Automatic family revocation on suspected token reuse is not yet implemented.

Refresh rotation and logout operations use transactions and a shared user-row lock to coordinate concurrent requests.

## Verification Completed

Manual checks covered:

- Successful registration and duplicate-email rejection.
- Password validation.
- Successful login and invalid credentials.
- Valid, missing, and altered access tokens.
- Refresh rotation and rejection of old tokens.
- Simultaneous refresh requests: one succeeds and one is rejected.
- Logout and repeated logout.
- Logout from all devices.
- Concurrent refresh and logout-all, with no active sessions remaining.
- Session-family logout without revoking another login family.
- Swagger request/response documentation and protected profile access.

## Development Checks

```powershell
npm run build
npm run lint
npm test
```

Automated authentication integration tests are still pending. Generated starter tests may need updates for the implemented routes and dependencies.

## Next Steps

- Browser login, refresh, and logout using HttpOnly refresh cookies.
- Trusted browser origins and CSRF protection.
- Updated OpenAPI documentation for browser and native flows.
- Refresh-token reuse detection.
- Authentication rate limiting.
- Automated integration tests.
- Email verification and password reset, subject to scope.
- Angular and Ionic integration after backend completion.