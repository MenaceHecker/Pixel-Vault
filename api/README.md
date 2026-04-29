# Pixel Vault API — v2.0

Next.js API relay for the Pixel Vault photo archival pipeline.

## Structure

```
app/
  api/
    upload/route.ts     POST  — receive file from iPhone, write to Blob + KV
    pending/route.ts    GET   — return pending files + signed URLs for Pixel
    confirm/route.ts    POST  — mark file done, delete blob, update stats
  page.tsx              Dashboard — server component, reads KV + Blob
lib/
  auth.ts               X-Vault-Key header validation
  types.ts              Shared TypeScript interfaces
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Create Vercel project and storage
```bash
npm i -g vercel
vercel deploy          # follow prompts, link to your Vercel account
```

In the Vercel dashboard:
- **Storage → Create → Blob** — name it `pixel-vault-blob`
- **Storage → Create → KV** — name it `pixel-vault-kv`

### 3. Pull env vars
```bash
vercel env pull .env.local
```

Then open `.env.local` and add your `VAULT_SECRET_KEY`:
```
VAULT_SECRET_KEY=your-long-random-secret-here
```

Also add it to Vercel:
```bash
vercel env add VAULT_SECRET_KEY
```

### 4. Deploy to production
```bash
vercel --prod
```

Note your production URL, e.g. `https://pixel-vault-api.vercel.app`

## API Contract

### POST /api/upload
**Headers:** `X-Vault-Key: <secret>`, `Content-Type: multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Photo or video binary |
| `filename` | string | Original filename |
| `takenAt` | string | ISO 8601 date taken |

**Response:** `{ id: string, status: "pending" }`

---

### GET /api/pending
**Headers:** `X-Vault-Key: <secret>`

**Response:** `{ files: [{ id, url, filename, takenAt, size }] }`

---

### POST /api/confirm
**Headers:** `X-Vault-Key: <secret>`, `Content-Type: application/json`

**Body:** `{ id: string }`

**Response:** `{ id: string, status: "done" }`

## Testing with curl

```bash
BASE=https://pixel-vault-api.vercel.app
KEY=your-secret-key

# Upload a test file
curl -X POST "$BASE/api/upload" \
  -H "X-Vault-Key: $KEY" \
  -F "file=@/path/to/photo.jpg" \
  -F "filename=photo.jpg" \
  -F "takenAt=2025-04-28T22:00:00Z"

# Check pending
curl "$BASE/api/pending" -H "X-Vault-Key: $KEY"

# Confirm (use the id from upload response)
curl -X POST "$BASE/api/confirm" \
  -H "X-Vault-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"<id-from-upload>"}'
```

## Dashboard

Visit `https://your-api.vercel.app` to see:
- Pending file count
- Last sync timestamp
- Total archived count
- Blob storage usage
- Stale file alert (pending > 14 days)
