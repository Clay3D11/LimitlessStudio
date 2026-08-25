import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4175);
export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development', isProduction: process.env.NODE_ENV === 'production',
  host: process.env.HOST || '127.0.0.1', port,
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''), projectRoot,
  database: { host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'limitless', password: process.env.DB_PASSWORD || 'limitless_dev_password',
    database: process.env.DB_NAME || 'limitless_visual', connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10) },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '', stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  automaticTax: process.env.STRIPE_AUTOMATIC_TAX === 'true'
});
export function assertPaymentConfiguration() {
  if (!config.stripeSecretKey) throw Object.assign(new Error('Stripe payments are not configured.'), { statusCode: 503 });
  if (config.isProduction && !config.publicUrl.startsWith('https://')) throw new Error('PUBLIC_URL must use HTTPS in production.');
}
