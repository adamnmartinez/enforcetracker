//https://www.webdevtutor.net/blog/typescript-pg-connect
import { Pool } from 'pg';

// update this with new server
const pool = new Pool({
  user: '',
  host: '',
  database: '',
  password: '',
  port: ,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error executing query', err);
  } else {
    console.log('Connected to PostgreSQL on', res.rows[0].now);
  }
});

export {pool};
