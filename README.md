# Ben's Café Management System

**Public Repository** — this project is open for inspection and contribution within the repo's normal workflow.

This README is a map of the repository, not an installation guide. It shows where the current code lives, what each folder is responsible for, and where to start when you need to understand or change something.

## Repository Map

The workspace is organized into four main areas:

- `frontend/` for the Vite + React user interface
- `backend/` for the Express + TypeScript API
- `shared/` for cross-app models and constants
- `database/` for the SQL schema used by the backend

## How To Navigate

If you are trying to orient yourself quickly, start here:

| Goal | Start here | Why |
|---|---|---|
| See the app boot sequence | `frontend/src/main.tsx` and `backend/src/server.ts` | These are the runtime entry points |
| Understand the UI flow | `frontend/src/App.tsx` | This is the top-level app shell |
| Find an API endpoint | `backend/src/routes/` | Routes define URL-to-controller mapping |
| Find request handling | `backend/src/controllers/` | Controllers translate HTTP into app calls |
| Find business logic | `backend/src/services/` | Services hold the rules and orchestration |
| Find SQL access | `backend/src/repositories/` | Repositories talk to the database |
| Find validation rules | `backend/src/validators/` | Validators define payload constraints |
| Find shared contracts | `shared/src/models/` and `shared/src/constants/` | Used by both frontend and backend |
| Find table structure | `database/schema/schema.sql` | Source of truth for the schema |

## Flow Of Responsibility

The backend follows a consistent path:

`HTTP request -> route -> controller -> service -> repository -> database`

Use that chain as the default mental model:

- Routes decide which controller handles a URL.
- Controllers parse request data, call services, and return responses.
- Services contain business rules, calculations, and cross-cutting decisions.
- Repositories only query and mutate database state.
- Validators keep bad input out before it reaches the service layer.

The frontend mirrors that same separation in a UI-friendly way:

- `App.tsx` defines the app shell and routing structure.
- `components/` contains feature-specific screens and reusable UI parts.
- `api/` wraps backend communication.
- `utils/` holds local helpers for formatting and transformation.

## Detailed Tree

```txt
bens-cafe-management/
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── config/
│       │   ├── constants.ts
│       │   ├── database.ts
│       │   ├── db-options.ts
│       │   └── session-store.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── employee.controller.ts
│       │   ├── expense.controller.ts
│       │   ├── index.ts
│       │   ├── inventory-budget-account.controller.ts
│       │   ├── inventory-budget-log.controller.ts
│       │   ├── inventory-item.controller.ts
│       │   ├── inventory-request.controller.ts
│       │   ├── restock-calculation.controller.ts
│       │   ├── sales-entry.controller.ts
│       │   ├── shift.controller.ts
│       │   ├── staff-message.controller.ts
│       │   └── xml-export.controller.ts
│       ├── middleware/
│       │   ├── auth.middleware.ts
│       │   └── validation.middleware.ts
│       ├── models/
│       │   └── index.ts
│       ├── repositories/
│       │   ├── employee.repository.ts
│       │   ├── expense.repository.ts
│       │   ├── index.ts
│       │   ├── inventory-adjustment.repository.ts
│       │   ├── inventory-budget-account.repository.ts
│       │   ├── inventory-budget-log.repository.ts
│       │   ├── inventory-item.repository.ts
│       │   ├── inventory-request.repository.ts
│       │   ├── payroll-entry.repository.ts
│       │   ├── restock-calculation-item.repository.ts
│       │   ├── restock-calculation.repository.ts
│       │   ├── sales-entry.repository.ts
│       │   ├── shift.repository.ts
│       │   ├── staff-message.repository.ts
│       │   └── user.repository.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── employee.routes.ts
│       │   ├── expense.routes.ts
│       │   ├── index.ts
│       │   ├── inventory-budget-account.routes.ts
│       │   ├── inventory-budget-log.routes.ts
│       │   ├── inventory-item.routes.ts
│       │   ├── inventory-request.routes.ts
│       │   ├── restock-calculation.routes.ts
│       │   ├── sales-entry.routes.ts
│       │   ├── shift.routes.ts
│       │   ├── staff-message.routes.ts
│       │   └── xml-export.routes.ts
│       ├── scripts/
│       │   └── seed-admin.cjs
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── employee.service.ts
│       │   ├── expense.service.ts
│       │   ├── index.ts
│       │   ├── inventory-budget-account.service.ts
│       │   ├── inventory-budget-log.service.ts
│       │   ├── inventory-item.service.ts
│       │   ├── inventory-request.service.ts
│       │   ├── restock-calculation.service.ts
│       │   ├── sales-entry.service.ts
│       │   ├── shift.service.ts
│       │   └── staff-message.service.ts
│       ├── types/
│       ├── utils/
│       │   ├── datetime.utils.ts
│       │   ├── password-hash.ts
│       │   └── xmlFormatter.ts
│       └── validators/
│           ├── auth.validator.ts
│           ├── common.validator.ts
│           ├── employee.validator.ts
│           ├── expense.validator.ts
│           ├── index.ts
│           ├── inventory-budget-account.validator.ts
│           ├── inventory-budget-log.validator.ts
│           ├── inventory-item.validator.ts
│           ├── inventory-request.validator.ts
│           ├── payroll-entry.validator.ts
│           ├── restock-calculation-item.validator.ts
│           ├── restock-calculation.validator.ts
│           ├── sales-entry.validator.ts
│           ├── shift.validator.ts
│           └── staff-message.validator.ts
├── database/
│   └── schema/
│       └── schema.sql
├── frontend/
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── lint-results.json
│   ├── package.json
│   ├── public/
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vercel.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.css
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── vite-env.d.ts
│       ├── api/
│       │   ├── apiError.ts
│       │   ├── apiFetch.ts
│       │   ├── csvExportApi.ts
│       │   ├── employeeApi.ts
│       │   ├── expenseApi.ts
│       │   ├── inventoryBudgetAccountApi.ts
│       │   ├── inventoryBudgetLogApi.ts
│       │   ├── inventoryItemApi.ts
│       │   ├── inventoryRequestApi.ts
│       │   ├── notesApi.ts
│       │   ├── restockCalculationApi.ts
│       │   ├── salesApi.ts
│       │   ├── shiftApi.ts
│       │   ├── shiftSummaryApi.ts
│       │   └── xmlExportApi.ts
│       ├── assets/
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── components/
│       │   ├── AddNewEmployeeModal.tsx
│       │   ├── Admin/
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── AdminInventory.tsx
│       │   │   ├── AdminPortal.tsx
│       │   │   ├── AdminReports.tsx
│       │   │   ├── AdminStaffBoard.tsx
│       │   │   ├── CsvExportButton.tsx
│       │   │   ├── SalesEntry.tsx
│       │   │   ├── StaffRegistry.tsx
│       │   │   └── XmlExportButton.tsx
│       │   ├── Auth/
│       │   │   └── Login.tsx
│       │   └── StaffPortal/
│       │       ├── InventoryManager.tsx
│       │       ├── NotesManager.tsx
│       │       ├── ShiftManager.tsx
│       │       └── StaffPortal.tsx
│       ├── config/
│       │   └── api.ts
│       └── utils/
│           ├── datetime.utils.ts
│           ├── storeWeek.utils.ts
│           └── xmlToCsv.ts
└── shared/
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── constants/
        │   ├── app.constants.ts
        │   └── index.ts
        └── models/
            ├── auth.model.ts
            ├── employee.model.ts
            ├── expense.model.ts
            ├── index.ts
            ├── inventory-adjustment.model.ts
            ├── inventory-budget-account.model.ts
            ├── inventory-budget-log.model.ts
            ├── inventory-item.model.ts
            ├── inventory-request.model.ts
            ├── payroll-entry.model.ts
            ├── restock-calculation-item.model.ts
            ├── restock-calculation.model.ts
            ├── sales-entry.model.ts
            ├── shift.model.ts
            ├── staff-message.model.ts
            └── user.model.ts
```

## What Each Area Is For

### Backend

`backend/src/server.ts` is the runtime start point for the API. From there, the path is usually route first, then controller, then service, then repository.

Use these folders as the default mental model:

- `config/` for shared backend configuration such as database setup and constants
- `controllers/` for request/response orchestration
- `middleware/` for auth and request guards
- `repositories/` for SQL and persistence
- `routes/` for URL wiring
- `services/` for feature logic and domain behavior
- `validators/` for schema validation before controller/service work begins
- `utils/` for reusable backend helpers
- `scripts/` for operational scripts
- `models/` and `types/` for contracts that cross internal modules

If you are changing behavior, find the service first. If you are changing how a request enters the system, find the route. If you are changing how data is stored or retrieved, find the repository.

### Frontend

`frontend/src/main.tsx` mounts the app, and `frontend/src/App.tsx` defines the main shell. Most feature work will fan out from there into `components/` and `api/`.

The frontend folders are intentionally split by concern:

- `api/` wraps the backend calls for each feature area
- `components/Admin/` contains admin-focused screens and actions
- `components/StaffPortal/` contains the staff-facing portal workflow
- `components/Auth/` contains authentication UI
- `assets/` stores images and static media
- `config/` stores frontend configuration such as API wiring
- `utils/` contains formatting and local transformation helpers

### Shared

`shared/` is the bridge between frontend and backend.

Keep these principles in mind:

- Shared models belong in `shared/src/models/` when both apps need the same data shape.
- Shared constants belong in `shared/src/constants/` when both apps need the same values.
- `shared/src/index.ts` should stay the clean import surface for consumers.

### Database

`database/schema/schema.sql` is the source of truth for schema structure. When a table changes, inspect the related repository, service, validator, and shared model together so the API contract stays aligned.

## Typical Change Paths

Use these as the shortest path into the repo:

1. New backend endpoint: `routes/` -> `controllers/` -> `services/` -> `repositories/`
2. New validation rule: `validators/` first, then the controller or service that consumes it
3. UI screen change: `App.tsx` or the relevant feature component under `components/`
4. API contract update: `shared/src/models/` plus the matching frontend API wrapper and backend service/repository
5. Schema change: `database/schema/schema.sql`, then follow every affected backend and shared file

## Working Notes

- This repository is public and intended to be easily understood by reviewers and contributors.
- Follow the backend flow strictly: route → controller → service → repository.
- Keep business logic inside services; avoid placing logic in controllers or repositories.
- Use shared models and constants instead of duplicating types across frontend and backend.
- When updating database schema, ensure corresponding repositories, services, validators, and shared models are updated together.
- Maintain consistent response structures (`success`, `message`, `data`) across API endpoints.
- Keep formatting and UI logic inside frontend `utils/` when reusable.
