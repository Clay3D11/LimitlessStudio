# Limitless Visual

Full-stack storefront for Limitless Visual / Limitless Studio. Customers build a project cart, provide production details, and pay through Stripe Checkout. MySQL stores customers, orders, line items, inquiries, and processed webhook events.

## Architecture

```text
Browser
  +-- site/assets -------------> Express static server
  +-- GET /api/catalog --------> server-owned prices
  +-- POST /api/inquiries -----> validation -> MySQL
  +-- POST /api/checkout/sessions
  |                              -> MySQL order -> Stripe Checkout
  `-- GET /api/orders/status --> MySQL order status

Stripe
  `-- POST /api/webhooks/stripe -> signature verification
                                  -> idempotent event -> order update
```

```text
.
|-- src/
|   |-- app.mjs          routes, middleware, errors
|   |-- catalog.mjs      authoritative products and prices
|   |-- config.mjs       environment configuration
|   |-- db.mjs           MySQL pool and transactions
|   |-- orders.mjs       persistence and fulfillment
|   |-- stripe.mjs       Checkout and webhook verification
|   `-- validation.mjs   input validation
|-- database/001_initial_schema.sql
|-- test/
|-- .github/workflows/ci.yml
|-- Dockerfile
|-- docker-compose.yml
|-- server.mjs
`-- index.html / script.js / styles / assets
```

## Local Setup

Requirements: Docker Desktop, Node.js 18+ (22 recommended), and a Stripe account.

1. Copy `.env.example` to `.env`.
2. Replace both database passwords with long random values.
3. Add the Stripe test secret key (`sk_test_...`) to `STRIPE_SECRET_KEY`.
4. Run `docker compose up --build`.
5. Open `http://localhost:4175`.

The MySQL container applies `database/001_initial_schema.sql` when its volume is first created. MySQL is not exposed publicly.

## Stripe Webhooks

For local testing:

```powershell
stripe listen --forward-to localhost:4175/api/webhooks/stripe
```

Copy its `whsec_...` value to `STRIPE_WEBHOOK_SECRET`, restart the web container, and test with card `4242 4242 4242 4242`, any future expiration date, and any CVC.

For production, create `https://limitlessvisual.com/api/webhooks/stripe` in Stripe and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Store live keys in the hosting platform's secret manager, never in Git or the image.

## Environment

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production` online |
| `HOST`, `PORT` | Web bind address and port |
| `PUBLIC_URL` | HTTPS origin for Stripe redirects |
| `DB_*` | MySQL connection and credentials |
| `STRIPE_SECRET_KEY` | Server-only Stripe key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_AUTOMATIC_TAX` | Enable only after configuring Stripe Tax |

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Web and MySQL readiness |
| `GET` | `/api/catalog` | Public trusted catalog |
| `POST` | `/api/inquiries` | Custom quote request |
| `POST` | `/api/checkout/sessions` | Create order and Checkout Session |
| `POST` | `/api/webhooks/stripe` | Verified Stripe event receiver |
| `GET` | `/api/orders/status?session_id=...` | Payment-return status |

The browser sends only product IDs and quantities. The server recalculates all prices from `src/catalog.mjs`.

## Checks

```powershell
npm run check
npm test
docker compose config
docker build -t limitless-visual .
```

CI runs syntax checks, tests, and a Docker build on pushes and pull requests.

## Production Checklist

1. Push this project to its own GitHub repository.
2. Provision the Docker web service and persistent MySQL on Oracle Cloud or another host.
3. Add production secrets and `PUBLIC_URL=https://limitlessvisual.com`.
4. Apply the SQL migration to production MySQL.
5. Deploy behind HTTPS.
6. Register the production Stripe webhook and add its secret.
7. Complete test-mode checkout, then switch to live Stripe keys.
8. Configure Stripe business verification, payouts, branding, receipts, taxes, refunds, privacy policy, and terms.
9. Point DNS to the deployment and verify `/api/health` returns `200`.
10. Enable MySQL backups and application/webhook monitoring.

## Security

Helmet headers, body limits, rate limiting, server validation, parameterized SQL, non-root Docker execution, server-owned prices, and webhook signature verification are enabled. Stripe hosts the card form, so card data never passes through this application. Webhook IDs are persisted for idempotent fulfillment. `.env` is ignored and must never be committed.
