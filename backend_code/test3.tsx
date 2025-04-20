/*
From https://thriveread.com/typescript-express-postgresql-pg-nodejs/
*/

// Import necessary types from Express
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
// Import the PostgreSQL connection pool from database.ts
import { pool } from './test2.js';

// Get all tasks
export const getTasks = async (req: Request, res: Response): Promise<Response> => {
  console.log("Checking in");
  try {
    // Execute a PostgreSQL query to select all tasks
    const response: QueryResult = await pool.query('SELECT * FROM cars');

    // Return a JSON response with the retrieved tasks
    return res.status(200).json(response.rows);
  } catch (error) {
    // Handle errors, log them, and return an internal server error response
    console.error(error);
    return res.status(500).json('Internal Server error');
  }
}
