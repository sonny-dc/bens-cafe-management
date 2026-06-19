import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import {testConnection} from './config/database.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend root directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath }); 

// Validate required environment variables
if (!process.env.PORT) {
  console.error('ERROR: PORT is not defined in .env file');
  process.exit(1);
}

const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}));

// API Routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Bens Cafe Management API is running' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`Server ready at http://localhost:${PORT}`);
  testConnection();
});


