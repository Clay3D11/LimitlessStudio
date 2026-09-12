# Limitless Visual

Production storefront for **Limitless Visual**, operated by **Universal Limitless LLC**. Customers select creative services, provide project details, and complete one-time payments through Stripe Checkout. MySQL stores customers, orders, line items, inquiries, and processed webhook events.

- Production: `https://limitlessvisual.com`
- Hosting: Railway
- Runtime: Node.js 22 and Express
- Database: private Railway MySQL
- Payments: Stripe-hosted Checkout

## Production Status

The website is live for genuine **one-time service payments**. Monthly subscription offers are intentionally hidden and rejected by the backend until renewal, failed-invoice, and cancellation lifecycle handling is implemented.

Production safeguards include HTTPS, private database networking, CI-gated Railway deployments, database backups, server-owned pricing, signed Stripe webhooks, idempotent event processing, rate limiting, input validation, and customer-safe error responses.

## Architecture

```text
Browser
  +-- site/assets -------------> Express static server
  +-- GET /api/catalog --------> active server-owned prices
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
|   |-- app.mjs          routes and middleware
|   |-- catalog.mjs      authoritative products, prices, and availability
|   |-- config.mjs       environment configuration
|   |-- db.mjs           MySQL pool and transactions
|   |-- errors.mjs       customer-safe error responses
|   |-- orders.mjs       persistence and fulfillment state
|   |-- stripe.mjs       Checkout and webhook verification
|   `-- validation.mjs   input validation
|-- database/            schema and migration runner
|-- test/                automated regression tests
|-- privacy.html         Privacy Policy
|-- terms.html           Terms of Service
|-- refunds.html         Refund and Cancellation Policy
|-- Dockerfile
|-- docker-compose.yml
|-- server.mjs
`-- index.html / script.js / styles / assets
```

## Local Setup

Requirements: Docker Desktop, Node.js 18+ (22 recommended), and Stripe test credentials.

1. Copy `.env.example` to `.env`.
2. Replace both database passwords with long random values.
3. Add a Stripe test secret key (`sk_test_...`) to `STRIPE_SECRET_KEY`.
4. Run `docker compose up --build`.
5. Open `http://localhost:4175`.

The MySQL container applies `database/001_initial_schema.sql` when its volume is first created. MySQL is not exposed publicly.

## Stripe

### Local testing

Use Stripe test mode or a sandbox. Never test live mode with test card numbers or use real payment details merely to test the integration.

```powershell
stripe listen --forward-to localhost:4175/api/webhooks/stripe
```

Copy the listener's `whsec_...` value to `STRIPE_WEBHOOK_SECRET`, restart the web container, and use Stripe's documented test payment methods.

### Production

The live webhook destination is:

```text
https://limitlessvisual.com/api/webhooks/stripe
```

Subscribed events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Railway uses a restricted live key with **Checkout Sessions: Write** permission for `STRIPE_SECRET_KEY`. The production webhook has a separate signing secret for `STRIPE_WEBHOOK_SECRET`. Store both as sealed Railway variables; never commit, display, or transmit their values.

Stripe Tax remains disabled until the company confirms its registration and tax obligations with a qualified tax professional.

## Environment

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `production` on Railway |
| `HOST`, `PORT` | Web bind address and Railway-provided port |
| `PUBLIC_URL` | `https://limitlessvisual.com` in production |
| `DB_*` | Private MySQL connection and credentials |
| `STRIPE_SECRET_KEY` | Server-only Stripe key; restricted `rk_live_...` in production |
| `STRIPE_WEBHOOK_SECRET` | Environment-specific `whsec_...` signing secret |
| `STRIPE_AUTOMATIC_TAX` | Keep `false` until Stripe Tax is intentionally configured |

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Web and MySQL readiness |
| `GET` | `/api/catalog` | Public active catalog |
| `POST` | `/api/inquiries` | Custom quote request |
| `POST` | `/api/checkout/sessions` | Create order and Checkout Session |
| `POST` | `/api/webhooks/stripe` | Receive verified Stripe events |
| `GET` | `/api/orders/status?session_id=...` | Payment-return status |

The browser sends product IDs and quantities only. The backend validates availability and calculates every price from `src/catalog.mjs`. Inactive subscription product IDs are rejected even if submitted manually or restored from an old browser cart.

## Legal and Customer Disclosures

Checkout requires explicit acceptance of the published Terms of Service, Privacy Policy, and Refund and Cancellation Policy. Customer-facing support uses `universal@limitlessvisual.com`. Legal documents should be reviewed periodically and after material changes to services, data practices, payment methods, or applicable law.

## Checks and Deployment

```powershell
npm run check
npm test
docker compose config
docker build -t limitless-visual .
```

GitHub Actions runs syntax checks, automated tests, and a Docker build for pushes and pull requests. Production changes are developed on `production-deployment`, reviewed through a pull request to `main`, and deployed by Railway only after CI succeeds because **Wait for CI** is enabled.

After deployment:

1. Confirm Railway reports the deployment as Active.
2. Review Deploy Logs for errors.
3. Verify `https://limitlessvisual.com/api/health` reports the web service and database as healthy.
4. Verify a genuine Checkout page shows Limitless Visual, the correct service, and the server-owned price.
5. Monitor the first genuine payment in Stripe and confirm its webhook delivery returns HTTP `200`.

## Security

Helmet headers, CSP, body limits, rate limiting, server validation, parameterized SQL, non-root Docker execution, server-owned prices, and webhook signature verification are enabled. Webhook IDs are persisted for idempotent fulfillment. Detailed Stripe and server errors are logged server-side while customers receive generic safe messages. Stripe hosts the payment form, so card data never passes through this application. `.env` is ignored and must never be committed.

## Deferred Subscription Work

Before restoring monthly plans, add and test subscription lifecycle persistence and webhook handling for activation, renewal, failed invoices, status changes, and cancellation. Update the live webhook subscriptions and restricted-key permissions only when the implementation requires them.
