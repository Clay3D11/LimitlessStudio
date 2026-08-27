import mysql from 'mysql2/promise';
import { config } from './config.mjs';
let pool;
export function database() {
  if (!pool) pool = mysql.createPool({...config.database,waitForConnections:true,queueLimit:0,decimalNumbers:true,timezone:'Z'});
  return pool;
}
export async function pingDatabase() { const connection=await database().getConnection(); try { await connection.ping(); } finally { connection.release(); } }
export async function closeDatabase() { if (pool) await pool.end(); pool=undefined; }
export async function transaction(work) {
  const connection=await database().getConnection();
  try { await connection.beginTransaction(); const result=await work(connection); await connection.commit(); return result; }
  catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
