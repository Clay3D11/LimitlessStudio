import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { closeDatabase, database } from '../src/db.mjs';

const schemaPath = fileURLToPath(
  new URL('./001_initial_schema.sql', import.meta.url)
);

async function migrate() {
  const schema = await readFile(schemaPath, 'utf8');

  const statements = schema
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
    .filter((statement) => !/^CREATE DATABASE\b/i.test(statement))
    .filter((statement) => !/^USE\b/i.test(statement));

  for (const statement of statements) {
    await database().query(statement);
  }

  console.log('Database schema is ready.');
}

try {
  await migrate();
} catch (error) {
  console.error('Database migration failed.');
  console.error(error);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}