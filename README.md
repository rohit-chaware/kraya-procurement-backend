# Kraya Procurement Backend

NestJS + PostgreSQL + Prisma backend for a simplified procurement platform with JWT authentication, RBAC, and modules for Items, Indents, Material Issues (MI), Vendors, and RFQs.

## Tech Stack

- **Runtime:** Node.js 20, TypeScript
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (users + vendors)
- **API:** REST (`/api/v1`)
- **Bonus:** Docker, Pino logging, Swagger, rate limiting, unit tests, soft delete (items)

## Features


| Module      | Highlights                                                              |
| ----------- | ----------------------------------------------------------------------- |
| **Users**   | Register, login (email/phone), activate/deactivate, role assignment     |
| **Roles**   | Admin-managed roles with JSON permissions per entity/action             |
| **RBAC**    | `Admin` bypasses all checks; normal users validated per entity + action |
| **Items**   | CRUD, filters, pagination, `isLocked` when used in Indent/MI/RFQ        |
| **Indents** | Multi-item indents, DRAFT → SUBMITTED → APPROVED/REJECTED               |
| **MI**      | Material issue with optional indent link, DRAFT → ISSUED                |
| **Vendors** | CRUD + vendor JWT auth + RFQ quoting portal                             |
| **RFQ**     | Create with items, attach vendors, send, close, receive vendor quotes   |


## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

- API: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- Health: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

### Full Docker (API + Postgres)

```bash
docker compose up --build
```

## Local Setup (without Docker API)

1. Install PostgreSQL and create database `kraya_procurement`
2. Copy `.env.example` → `.env` and set `DATABASE_URL`
3. Run:

```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

## Seed Credentials


| Actor  | Email / Phone                                   | Password   |
| ------ | ----------------------------------------------- | ---------- |
| Admin  | [admin@kraya.com](mailto:admin@kraya.com)       | Admin@123  |
| User   | [user@kraya.com](mailto:user@kraya.com)         | User@123   |
| Vendor | [vendor@example.com](mailto:vendor@example.com) | Vendor@123 |


**Demo Company ID:** `00000000-0000-4000-8000-000000000001`

## API Overview

All protected user routes require header: `Authorization: Bearer <user_jwt>`

Vendor portal routes require: `Authorization: Bearer <vendor_jwt>` (from vendor login)

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Users (Admin)

- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users/:id/roles`
- `PATCH /api/v1/users/:id/activate`
- `PATCH /api/v1/users/:id/deactivate`

### Roles (Admin)

- `POST /api/v1/roles`
- `GET /api/v1/roles`
- `GET /api/v1/roles/:id`
- `PATCH /api/v1/roles/:id`

### Items (RBAC: `item.*`)

- `POST /api/v1/items`
- `GET /api/v1/items?page=1&limit=10&companyId=&search=&itemCode=`
- `GET /api/v1/items/:id`
- `PATCH /api/v1/items/:id`
- `DELETE /api/v1/items/:id` (soft delete)

### Indents (RBAC: `indent.*`)

- `POST /api/v1/indents`
- `GET /api/v1/indents`
- `GET /api/v1/indents/:id`
- `PATCH /api/v1/indents/:id` (DRAFT only)
- `POST /api/v1/indents/:id/status` — body: `{ "action": "submit" | "approve" | "reject" }`

### Material Issues (RBAC: `mi.*`)

- `POST /api/v1/mi`
- `GET /api/v1/mi`
- `GET /api/v1/mi/:id`
- `POST /api/v1/mi/:id/issue`

### Vendors (RBAC: `vendor.*` for admin routes)

- `POST /api/v1/vendors`
- `GET /api/v1/vendors`
- `GET /api/v1/vendors/:id`
- `PATCH /api/v1/vendors/:id`
- `POST /api/v1/vendors/auth/login`
- `GET /api/v1/vendors/portal/rfqs` (vendor JWT)
- `POST /api/v1/vendors/portal/rfqs/:rfqId/quote` (vendor JWT)

### RFQ (RBAC: `rfq.*`)

- `POST /api/v1/rfq`
- `GET /api/v1/rfq`
- `GET /api/v1/rfq/:id`
- `POST /api/v1/rfq/:id/vendors`
- `POST /api/v1/rfq/:id/send`
- `POST /api/v1/rfq/:id/close`

## RBAC Model

Permissions are stored per role as JSON:

```json
{
  "item": { "create": true, "read": true, "update": true, "delete": false },
  "indent": { "create": true, "read": true, "update": true, "delete": false }
}
```

Entities: `item`, `indent`, `mi`, `rfq`, `vendor`  
Actions: `create`, `read`, `update`, `delete`

- **Admin users** (`is_admin = true`) bypass RBAC entirely.
- **Normal users** must have at least one role; permissions from all roles are merged (OR logic).

## Assumptions

1. **Company model** added for referential integrity (`company_id` on items/indents/rfqs); not a full company management module.
2. **Registration** assigns the default `Viewer` role if no `roleIds` are provided (after seed).
3. **Item lock** is derived at runtime by checking usage in `indent_items`, `mi_items`, or `rfq_items`.
4. **Indent approval** is allowed for any user with `indent.update` permission (no separate approver role).
5. **Vendor quotes** can be updated via upsert until RFQ is closed.
6. **Vendor portal** uses a separate JWT secret from internal users.
7. **Soft delete** implemented for items only (`is_deleted` flag).
8. **Phone login** uses exact phone string match (include country code as stored).

## Scripts

```bash
npm run start:dev      # Dev server with watch
npm run build          # Compile
npm run test           # Unit tests
npm run prisma:migrate # Create/apply migrations
npm run prisma:seed    # Seed demo data
```

## Postman

Import `postman/Kraya-Procurement.postman_collection.json`.

Set collection variables:

- `baseUrl` = `http://localhost:3000/api/v1`
- `userToken` / `vendorToken` are auto-set by login requests

## Project Structure

```
src/
  auth/          JWT, guards, login/register
  users/         User management (admin)
  roles/         Role & permission management (admin)
  items/         Item catalog
  indents/       Purchase indents
  mi/            Material issues
  vendors/       Vendor CRUD + vendor portal
  rfq/           Request for quotation
  common/        RBAC utils, pagination, filters
  prisma/        Prisma service
```

## License

UNLICENSED – assignment project.