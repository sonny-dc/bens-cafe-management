import type { Request, Response } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import {fileURLToPath} from 'url';

import { testConnection } from './config/database.js';
import { sessionStore } from './config/session-store.js';
import { SESSION_COOKIE_NAME } from 'shared/constants';
import { generalRateLimiter } from './middleware/rate-limiter.middleware.js';
import { globalErrorHandler } from './middleware/error.middleware.js';

// Route imports
import {
  employeeRoutes, 
  shiftRoutes, 
  staffMessageRoutes,
  salesEntryRoutes,
  expenseRoutes,
  inventoryRequestRoutes,
  inventoryItemRoutes,
  restockCalculationRoutes,
  inventoryBudgetAccountRoutes,
  inventoryBudgetLogRoutes,
  authRoutes,
  xmlExportRoutes
} from './routes/index.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend root directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath }); 

// Validate required environment variables
if (!process.env.PORT) {
  console.error('ERROR: PORT is not defined in .env file');
}

if (!process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET is not defined in .env file');
  process.exit(1);
}

const PORT = process.env.PORT || 3000; // Default to 3000 if not set

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", generalRateLimiter); // Apply general rate limiter to all API routes

// Session middleware
app.use(session({
  name: SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 8,
  },
}));


// API Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Bens Cafe Management API is running' });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/staff-messages", staffMessageRoutes);
app.use("/api/sales-entries", salesEntryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/inventory-requests", inventoryRequestRoutes);
app.use("/api/inventory-items", inventoryItemRoutes);
app.use("/api/restock-calculations", restockCalculationRoutes);
app.use("/api/inventory-budget-accounts", inventoryBudgetAccountRoutes);
app.use("/api/inventory-budget-logs", inventoryBudgetLogRoutes);
app.use("/api/export-xml", xmlExportRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found' 
  });
});

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, async () => {
  console.log(`Server ready at http://localhost:${PORT}`);
  testConnection();
});
