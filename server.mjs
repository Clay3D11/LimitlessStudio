import 'dotenv/config';
import { createApp } from './src/app.mjs';
import { config } from './src/config.mjs';
import { closeDatabase, pingDatabase } from './src/db.mjs';

const app = createApp();
const server = app.listen(config.port, config.host, async () => {
  console.log(`Limitless Visual is available at http://${config.host}:${config.port}`);
  try { await pingDatabase(); console.log('MySQL connection ready.'); }
  catch (error) { console.warn(`MySQL is not ready: ${error.message}`); }
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => { await closeDatabase(); process.exit(0); });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
export { server };
