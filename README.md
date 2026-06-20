# Ben's Café Management System

> **Private Repository** — Team members only. All rights reserved.

---

## 🎯 Quick Start

**Backend Setup:**

```bash
cd backend && npm install && npm run build && npm run dev
```

**Frontend Setup:**

```bash
cd frontend && npm install && npm run dev
```

Visit `http://localhost:5173` (frontend) — Backend runs on `:3000`

---

## 📌 Architecture & Team Guidelines

This project follows **strict layered architecture** — all team members must adhere to it:

```txt
HTTP Request → Route → Controller → Service → Repository → Database
```

### ✅ Layer Responsibilities

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| **Models** | Data shape only | `User`, `InventoryItem` (TypeScript interfaces) |
| **Repositories** | SQL queries only | `getUserById()`, `updateStock()` |
| **Services** | ALL business logic | Validation, calculations, constraints |
| **Controllers** | Request/response handling | Parse input, call service, send JSON |
| **Routes** | URL to Controller mapping | `GET /api/users/:id` → `getUserById` controller |

### 🚫 Common Mistakes (Don't Do This)

- ❌ Logic in controllers → **Move to services**
- ❌ SQL in services/controllers → **Move to repositories**
- ❌ Hardcoded status strings → **Use enums from `/config/constants.ts`**
- ❌ Skip layers → **Follow the flow strictly**

### 📐 Code Standards

- **Files:** `filename.dirname.ts` format (`user.service.ts`, `inventory.repository.ts`)
- **Code:** camelCase (`getUserById`, `totalRevenue`)
- **Classes/Types:** PascalCase (`UserService`, `InventoryItem`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`, `DB_TIMEOUT`)
- **Money fields:** Use `string` type to preserve decimal precision

### 🤝 Team Collaboration

- **Before committing:** Pull latest, test locally, clean up console logs
- **Before pushing:** Ensure code passes build (`npm run build`)
- **Commit messages:** `feat:`, `fix:`, `refactor:` — be descriptive
- **Communication:** Discuss before modifying shared files such as schema, routes, and constants
- **Never commit:** `.env` files, `node_modules`, `dist/`

---

## ⚙️ Setup & Development

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- Git

### First Time Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd bens-cafe-management

# 2. Backend
cd backend
npm install
cp .env.example .env
npm run build

# 3. Frontend
cd ../frontend
npm install
npm run build
```

### Development Workflow

**Terminal 1 - Backend:**

```bash
cd backend && npm run dev
```

Backend runs on:

```txt
http://localhost:3000
```

**Terminal 2 - Frontend:**

```bash
cd frontend && npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

### Database Setup

```bash
# Import schema
mysql -h <host> -u <user> -p <database> < database/schema/schema.sql

# Seed test data - optional
mysql -h <host> -u <user> -p <database> < database/seeders/users-seeder.sql
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't connect to DB | Verify `.env` credentials and firewall settings |
| Build fails | Run `npm run build` and check TypeScript errors |
| Frontend shows blank page | Check browser console and verify `VITE_API_URL` |
| Port already in use | Change port in `.env` or kill the process using the port |

---

## 📞 Questions?

- **Architecture:** Review the layer breakdown above
- **Coding issues:** Check team guidelines
- **Git/deployment:** Ask team lead
- **Database:** See `database/schema/schema.sql` for table structure

---

## 📁 Project Structure

```txt
bens-cafe-management/
│
├── frontend/                                   # React + TypeScript frontend using Vite
│   ├── src/
│   │   ├── pages/                             # Page components
│   │   │   ├── admin/                         # Admin-only pages (dashboard, reports, staff management)
│   │   │   └── employee/                      # Employee-only pages (staff board, shift info, requests)
│   │   ├── components/                        # Reusable UI components (buttons, cards, modals, forms, tables, sidebar)
│   │   ├── styles/                            # Global and component CSS
│   │   ├── utils/                             # Helper functions (formatMoney, formatDate, validation helpers)
│   │   ├── App.tsx                            # Main app component with routing
│   │   ├── main.tsx                           # Entry point
│   │   └── index.css                          # Global styles
│   ├── public/                                # Static assets (images, icons, fonts)
│   ├── package.json                           # Frontend dependencies
│   ├── tsconfig.json                          # TypeScript config
│   ├── vite.config.ts                         # Vite bundler config
│   └── .gitignore                             # Git ignore rules
│
├── backend/                                   # Node.js + Express.js + TypeScript backend
│   ├── src/
│   │   ├── models/                            # TypeScript interfaces matching database tables
│   │   │   ├── user.model.ts                  # User and auth related types
│   │   │   ├── employee.model.ts              # Employee profile types
│   │   │   ├── inventory.model.ts             # Inventory item and category types
│   │   │   ├── sales.model.ts                 # Sales entry types
│   │   │   ├── shift.model.ts                 # Shift session types
│   │   │   ├── expense.model.ts               # Expense types
│   │   │   ├── payroll.model.ts               # Payroll entry types
│   │   │   ├── staff-message.model.ts         # Staff board message types
│   │   │   ├── restock.model.ts               # Restock calculation types
│   │   │   └── index.ts                       # Barrel export - export all models for easy importing
│   │   │
│   │   ├── repositories/                      # Database access layer - handles all SQL queries
│   │   │   ├── user.repository.ts             # Queries for user table
│   │   │   ├── employee.repository.ts         # Queries for employee_profiles table
│   │   │   ├── inventory.repository.ts        # Queries for inventory and category tables
│   │   │   ├── sales.repository.ts            # Queries for sales_entries table
│   │   │   ├── shift.repository.ts            # Queries for shift_sessions table
│   │   │   ├── expense.repository.ts          # Queries for expenses table
│   │   │   ├── payroll.repository.ts          # Queries for payroll_entries table
│   │   │   ├── staff-message.repository.ts    # Queries for staff_messages table
│   │   │   └── index.ts                       # Barrel export
│   │   │
│   │   ├── services/                          # Business logic layer
│   │   │   ├── user.service.ts                # User management, password hashing, authentication
│   │   │   ├── employee.service.ts            # Employee profile management
│   │   │   ├── inventory.service.ts           # Stock updates, thresholds, restock logic
│   │   │   ├── sales.service.ts               # Sales entry creation, revenue calculations
│   │   │   ├── shift.service.ts               # Shift tracking and cash variance
│   │   │   ├── expense.service.ts             # Expense categorization and deduction logic
│   │   │   ├── payroll.service.ts             # Payroll calculations
│   │   │   ├── staff-message.service.ts       # Staff message management and status updates
│   │   │   └── index.ts                       # Barrel export
│   │   │
│   │   ├── controllers/                       # Request handlers
│   │   │   ├── user.controller.ts             # User registration, login, profile endpoints
│   │   │   ├── employee.controller.ts         # Employee CRUD endpoints
│   │   │   ├── inventory.controller.ts        # Inventory requests and adjustments
│   │   │   ├── sales.controller.ts            # Sales entry endpoints
│   │   │   ├── shift.controller.ts            # Shift start/end endpoints
│   │   │   ├── expense.controller.ts          # Expense endpoints
│   │   │   ├── payroll.controller.ts          # Payroll endpoints
│   │   │   ├── staff-message.controller.ts    # Staff message endpoints
│   │   │   └── index.ts                       # Barrel export
│   │   │
│   │   ├── routes/                            # Express route definitions
│   │   │   ├── user.routes.ts                 # User and auth routes
│   │   │   ├── employee.routes.ts             # Employee routes
│   │   │   ├── inventory.routes.ts            # Inventory routes
│   │   │   ├── sales.routes.ts                # Sales routes
│   │   │   ├── shift.routes.ts                # Shift routes
│   │   │   ├── expense.routes.ts              # Expense routes
│   │   │   ├── payroll.routes.ts              # Payroll routes
│   │   │   ├── staff-message.routes.ts        # Staff message routes
│   │   │   └── index.ts                       # Mount all routes
│   │   │
│   │   ├── middleware/                        # Request processing middleware
│   │   │   ├── auth.middleware.ts             # JWT verification and role-based access
│   │   │   ├── error.handler.ts               # Global error handling
│   │   │   ├── request.logger.ts              # Request logging
│   │   │   └── validation.middleware.ts       # Request payload validation
│   │   │
│   │   ├── validators/                        # Input validation schemas
│   │   │   ├── user.validator.ts              # User validation
│   │   │   ├── inventory.validator.ts         # Inventory validation
│   │   │   ├── sales.validator.ts             # Sales validation
│   │   │   ├── shift.validator.ts             # Shift validation
│   │   │   └── expense.validator.ts           # Expense validation
│   │   │
│   │   ├── xml/                               # XML handling
│   │   │   ├── parsers/                       # Convert XML to JavaScript objects
│   │   │   │   ├── inventory.parser.ts
│   │   │   │   ├── sales.parser.ts
│   │   │   │   └── payroll.parser.ts
│   │   │   ├── builders/                      # Convert JavaScript objects to XML
│   │   │   │   ├── report.builder.ts
│   │   │   │   ├── inventory.builder.ts
│   │   │   │   └── payroll.builder.ts
│   │   │   └── templates/                     # XML templates
│   │   │       ├── inventory.template.xml
│   │   │       ├── sales.template.xml
│   │   │       └── payroll.template.xml
│   │   │
│   │   ├── utils/                             # Shared utility functions
│   │   │   ├── password.hash.ts               # bcrypt password hashing/verification
│   │   │   ├── date.utils.ts                  # Date formatting and calculations
│   │   │   ├── money.utils.ts                 # Money formatting and decimal calculations
│   │   │   ├── cash.variance.ts               # Cash variance calculation
│   │   │   └── jwt.utils.ts                   # Generate and verify JWT tokens
│   │   │
│   │   ├── config/                            # Configuration files
│   │   │   ├── database.ts                    # MySQL connection pool setup
│   │   │   └── constants.ts                   # App-wide constants
│   │   │
│   │   └── server.ts                          # Express app setup
│   │
│   ├── dist/                                  # Compiled JavaScript output
│   ├── package.json                           # Backend dependencies and scripts
│   ├── package-lock.json                      # Locked dependency versions
│   ├── tsconfig.json                          # TypeScript configuration
│   ├── .env                                   # Environment variables - DO NOT COMMIT
|   ├── .env.example                           # Example environment configuration for the backend.
│   └── .gitignore                             # Git ignore rules
│
├── database/                                  # Database-related files
│   ├── schema/
│   │   └── schema.sql                         # Table definitions
│   ├── migrations/                            # Future schema changes
│   └── seeders/                               # Optional test data
│       ├── users-seeder.sql
│       ├── inventory-seeder.sql
│       └── README.md
│
├── docs/                                      # Project documentation
│   ├── erd/
│   │   └── ben-cafe-erd.pdf
│   ├── prototypes/
│   ├── requirements/
│   └── api-docs/
│       └── API_ROUTES.md
│
├── tests/                                     # Test files
│   ├── unit/
│   ├── integration/
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## 🧠 Key Principles

1. **Models:** Data shape only using TypeScript interfaces from schema
2. **Repositories:** Database queries and CRUD operations only
3. **Services:** Business logic, constraints, validations, and calculations
4. **Controllers:** HTTP request handlers
5. **Routes:** URL mappings to controllers
6. **Middleware:** Request/response processing
7. **XML:** Separate module for XML parsing and building

---

## 🔁 Data Flow

```txt
HTTP Request
    ↓
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

The service layer handles:

- Validation
- Business logic
- Error handling
- Calculations

---

## 🏷️ Naming Conventions

- **File names:** kebab-case  
  Example: `user-service.ts`, `inventory-repository.ts`

- **Classes/Interfaces:** PascalCase  
  Example: `UserService`, `InventoryItem`

- **Functions/Variables:** camelCase  
  Example: `getUserById`, `totalRevenue`

- **Constants:** UPPER_SNAKE_CASE  
  Example: `MAX_RETRIES`, `DB_TIMEOUT`

---

## 👥 Team Notes

### General

- Follow the architecture strictly:
  ```txt
  Model → Repository → Service → Controller → Route
  ```
- Do NOT skip layers
- Keep functions small and focused
- Follow single responsibility principle

### Frontend

- Place API calls in services or utility functions
- Do NOT call backend directly inside components
- Use reusable components from `/components`
- Move heavy logic to hooks or utils

### Backend

- Controllers = request/response only
- Services = ALL business logic
- Repositories = SQL only
- Always validate input before reaching controllers
- Use async/await for asynchronous operations

### Database

- No raw SQL outside repositories
- Follow schema naming consistency
- Use parameterized queries to prevent SQL injection

Correct:

```ts
const [rows] = await pool.query(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

Wrong:

```ts
const [rows] = await pool.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

---

## 🔐 Authentication & Security

- Always hash passwords using `bcrypt` in `password.hash.ts`
- Protect admin routes with auth middleware
- Use JWT tokens for authentication through `jwt.utils.ts`
- Never expose sensitive data such as passwords, tokens, or API keys
- Always release database connections after use

```ts
connection.release();
```

---

## ❌ Error Handling

- Use centralized error handler: `error.handler.ts`
- Services should throw errors with descriptive messages
- Controllers should catch errors and send responses

Standard response format:

```ts
{
  success: boolean,
  message: string,
  data?: any
}
```

---

## 🌿 Git Workflow

- Use clean commit messages:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code cleanup
- One feature per branch
- Do not push broken code
- Do NOT commit `.env`
- Use `.env.example` instead

---

## 🧼 Code Quality

- Follow naming conventions
- Remove unused code before committing
- Remove unnecessary console logs
- Keep files organized in their correct folders
- Use TypeScript types properly
- Avoid `any` unless necessary

---

## 🧪 Testing

- Test services first because they contain business logic
- Use integration tests for API routes
- Run tests before pushing

```bash
npm test
```

---

## 📚 Documentation

- Keep `README.md` updated with setup instructions
- Update `docs/api-docs/API_ROUTES.md` when endpoints change
- Add comments only for complex logic

---

## 🤝 Collaboration

- Communicate before editing shared files:
  - database schema
  - routes
  - constants
- Avoid breaking changes without team discussion
- Review each other's pull requests