# Lively Notes — Backend

Minimal Express.js backend for the Lively Notes app implementing notes CRUD, Cloudinary image listing, and app settings.

> Personal pet project — I build and modify this manually, using an AI as a strict teacher to guide and critique my approach. lol

# Things Implemented
* Express JS (really want to migrate to typescript soon, i hate guessing)
* Routers
* Controllers
* Swagger UI
* Env Variables
* Middleware
* CORS
* JWT Token
* Cookie Parser
* MongoDB Services
* Cloudinary
* DynamoDB dual-write layer (`repositories/`) — writes go to MongoDB (authoritative) **and** DynamoDB; reads switch with `READ_SOURCE`

# Environment Variables

Loaded from `.env` (production), `.env.staging` (staging), or `.env.local` (everything else) — see `server.js`.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | HTTP port for local runs |
| `ORIGIN` | Allowed CORS origin |
| `NODE_ENV` | `development` / `staging` / `production` |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | JWT signing secrets |
| `CLOUDINARY_URL`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `APIFY_URL`, `APIFY_USER_ID`, `APIFY_PAT` | Apify Instagram scraper |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `READ_SOURCE` | `mongo` (default) or `dynamo` — which store serves reads; writes always go to both |
| `AWS_REGION` | DynamoDB region for local runs (`ap-southeast-1`); reserved/auto-set on Lambda |
| `DDB_TABLE_NOTES`, `DDB_TABLE_SECTIONS`, `DDB_TABLE_TODOS`, `DDB_TABLE_CALENDAR_NOTES`, `DDB_TABLE_SETTINGS`, `DDB_TABLE_PUSH_SUBSCRIPTIONS`, `DDB_TABLE_IG_POSTS`, `DDB_TABLE_USER` | DynamoDB table names |

# DynamoDB Migration Scripts

* `scripts/migrate-to-dynamo.js [--dry-run]` — idempotent backfill/reconciliation of all Mongo data into DynamoDB (never modifies Mongo; skips `user.pomodoroSound`)
* `scripts/reconcile-dynamo.js` — diffs every repository read under `READ_SOURCE=mongo` vs `dynamo`, including the GSI-backed queries
* `scripts/apply-lambda-config.sh [mongo|dynamo]` — run manually with admin AWS credentials to attach the DynamoDB IAM policy to the Lambda role and merge the `DDB_TABLE_*`/`READ_SOURCE` env vars into the deployed function

