# Nest Ecommerce Backend

An ecommerce backend built with NestJS, TypeScript, PostgreSQL, and TypeORM.

## Current Features

- User registration with request validation and Argon2id password hashing.
- Login with JWT access tokens that expire after 15 minutes.
- Protected user profile endpoint.
- Refresh-token generation with hashed sessions stored in PostgreSQL.

Refresh-token rotation, logout, and browser cookie handling are still in progress.

## Requirements

- Node.js 26.3.0 and npm 11.16.0 were used during development.
- PostgreSQL running locally on port 5432.

## Setup

Run all commands from the project root.

Install dependencies:

```powershell
npm ci
```

Create the database using pgAdmin or a PostgreSQL query tool:

```sql
CREATE DATABASE ecommerce;
```

Create a `.env` file beside `package.json`:

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

Copy the output into `JWT_ACCESS_SECRET`.

Build and apply the database migrations:

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js
```

Start the development server:

```powershell
npm run start:dev
```

The API runs at `http://localhost:3000` by default. Restart the server after changing `.env`.

## Database Migrations

Automatic schema synchronization is disabled. Database changes are managed through TypeORM migrations.

The migration tool uses `src/database/data-source.ts`, compiled to `dist/database/data-source.js`.

### Generate a Migration

After creating or updating an entity:

1. Register new entities in `src/database/data-source.ts`.
2. Register them through `TypeOrmModule.forFeature()` in the relevant NestJS module.
3. Build and generate the migration:

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:generate ./src/database/migrations/DescribeYourChange -d ./dist/database/data-source.js
```

Replace `DescribeYourChange` with a descriptive name. Review the generated SQL before applying it.

### Apply Pending Migrations

Build again to compile newly generated migrations:

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:run -d ./dist/database/data-source.js
```

Applied migrations are tracked in the database's `migrations` table.

### Show Migration Status

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:show -d ./dist/database/data-source.js
```

### Revert the Latest Migration

Review its `down()` method first: reverting can delete tables and data.

```powershell
npm run build
node --env-file=.env ./node_modules/typeorm/cli.js migration:revert -d ./dist/database/data-source.js
```

### Avoid Stale Compiled Migrations

If an unapplied migration is deleted or renamed, remove the project's `dist` folder before rebuilding. Old compiled files can otherwise execute alongside their replacements.

Do not rewrite migrations that have already been applied. Create a new migration for subsequent schema changes.

## Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Create a user |
| POST | `/auth/login` | Verify credentials and issue tokens |
| GET | `/auth/me` | Return the authenticated user's profile |

### Registration

```json
{
  "name": "Manish",
  "email": "manish@example.com",
  "password": "LearningNest123!"
}
```

Expected responses:

- `201 Created