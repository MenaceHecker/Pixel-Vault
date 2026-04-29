# Pixel Vault

> A zero-cost pipeline that routes iPhone photos through a Vercel relay to a Google Pixel XL — exploiting its lifetime unlimited original-quality Google Photos storage. Total ongoing cost: **$0**.

---

## The idea

Here's the situation: Google gave the original Pixel XL **unlimited original-quality Google Photos storage for life**. 

Meanwhile, iCloud storage isn't free, and Google Photos no longer gives iPhone users the same deal. So I built a little pipeline that lets my iPhone stay as the daily camera while the Pixel XL quietly handles archiving in the background.

The flow looks like this:

```
iPhone                   Vercel API               Google Pixel XL
──────                   ──────────               ───────────────
iOS Shortcut        →    POST /api/upload    →    Pixel Vault App
(weekly, auto)           Vercel Blob               (manual sync)
                         Vercel KV            →    Google Photos
                    ←    POST /api/confirm         (unlimited)
                         (cleanup)
```

Every Sunday night, an iOS Shortcut picks up the week's new photos and uploads them to a Vercel API. They sit there in Vercel Blob — temporarily — until I power on the Pixel XL and hit Sync. The Android app pulls them down, hands them off to Google Photos, then tells the API they're safe to delete. Photos never live in Blob for more than a few days.

---

## Repo structure

```
pixel-vault/
├── api/              Next.js API — upload relay, dashboard (Vercel)
├── android/          Kotlin Android app — Pixel XL sync client
├── shortcuts/        iOS Shortcut export + setup instructions
├── docs/             Architecture notes and diagrams
└── README.md         You're here
```

---

## What each piece does

| Component | Stack | What it does | Cost |
|-----------|-------|--------------|------|
| `api/` | Next.js + Vercel Blob + Vercel KV | Holds photos temporarily and tracks what's been backed up | Free (Hobby plan) |
| `android/` | Kotlin + Retrofit + Coroutines | Downloads pending photos, adds them to Google Photos, confirms the cleanup | Free (sideloaded) |
| `shortcuts/` | iOS Shortcuts | Grabs new photos every Sunday night and ships them to the API | Free (built into iOS) |
| Archive | Google Photos on Pixel XL | Where everything ends up, at full quality, forever | Free (lifetime perk) |

---

## What you'll need

### Hardware
- An iPhone — your main camera, nothing changes there
- A Google Pixel XL (1st gen, 2016) — the archival workhorse. 
- A USB-C cable — for sideloading the app and keeping the Pixel charged
- Wi-Fi — both devices need to be on the same network during sync

### Accounts and services
- A Google account linked to the Pixel's unlimited storage benefit
- A [Vercel](https://vercel.com) account — the free Hobby plan is more than enough
- A [GitHub](https://github.com) account

### Dev tools
- Node.js 18+
- Android Studio (for building and sideloading the Android app)
- Vercel CLI: `npm i -g vercel`
- ADB (Android Debug Bridge) — comes with Android Studio

---

## Setup

### Step 0 — Make sure the Pixel's unlimited storage is actually active

This is the most important step and worth doing before anything else. The perk only applies to photos uploaded *from* the Pixel itself, so verify it's working:

1. Power on the Pixel XL and sign in with the Google account you want to use for archiving
2. Go to **Google Photos → your profile → Photos settings → Backup → set to Original quality**
3. Take a quick test photo and let it upload
4. Check [google.com/drive/storage](https://google.com/drive/storage) — your quota should stay exactly the same
5. On your iPhone, you can install Google Photos if you want, but **immediately turn off Backup and Sync** — photos should only reach Google Photos via the Pixel

> ⚠️ Seriously, don't let your iPhone back up directly to Google Photos. The unlimited perk only applies to the Pixel. If you upload from the iPhone, it counts against your quota.

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/MenaceHecker/pixel-vault.git
cd pixel-vault
```

---

### Step 2 — Deploy the API

```bash
cd api
npm install
vercel deploy
```

Then in your Vercel dashboard:
- Go to **Storage → Create → Blob** and name it `pixel-vault-blob`
- Go to **Storage → Create → KV** and name it `pixel-vault-kv`
- Under **Settings → General → Root Directory**, set it to `api`

Pull the generated environment variables and add your secret key:

```bash
vercel env pull .env.local
# Open .env.local and set VAULT_SECRET_KEY to any long random string you like
vercel env add VAULT_SECRET_KEY   # push it to Vercel as well
vercel --prod
```

To make sure everything's working, run a quick smoke test:

```bash
BASE=https://your-api.vercel.app
KEY=your-secret-key

# Upload a test file
curl -X POST "$BASE/api/upload" \
  -H "X-Vault-Key: $KEY" \
  -F "file=@test.jpg" \
  -F "filename=test.jpg" \
  -F "takenAt=2025-04-28T22:00:00Z"

# Check that it's pending
curl "$BASE/api/pending" -H "X-Vault-Key: $KEY"
```

Your dashboard lives at `https://your-api.vercel.app`.

---

### Step 3 — Set up the iOS Shortcut

Full instructions are in [`shortcuts/README.md`](shortcuts/README.md), but the one thing to do before the first run is create a file at `PixelVault/last_run.txt` in your iCloud Drive (via the Files app) and put today's date in it — like `2025-04-28`. Without this, the Shortcut will try to upload your entire photo library the first time it runs, which you probably don't want.

After that, the Shortcut fires automatically every Sunday at 11 PM on Wi-Fi. It uploads everything since the last run and sends you a notification when it's done. You don't have to think about it.

---

### Step 4 — Build and sideload the Android app

Full build instructions are in [`android/README.md`](android/README.md). The short version:

```bash
# Enable Developer Options on Pixel XL:
# Settings → About phone → tap Build number 7 times

# Connect the Pixel via USB and confirm ADB sees it
adb devices

# Open android/ in Android Studio and run it on the Pixel XL
```

Before building, make sure to set `BASE_URL` and `VAULT_SECRET_KEY` in the `buildConfigField` entries in `android/app/build.gradle`.

---

## The weekly rhythm

Once everything is set up, this is all you really do:

| When | Who | What happens | Time |
|------|-----|--------------|------|
| Sunday 11 PM | iPhone (automatic) | Shortcut uploads the week's photos | 0 min |
| Whenever you feel like it | You | Power on the Pixel XL, open the app | 30 sec |
| While the Pixel is on | Android app | Tap Sync — it downloads, backs up, confirms, and cleans up | 1 tap |
| After sync | You | Spot-check Google Photos on your iPhone | 2 min |
| After spot-check | You | Delete the originals from your iPhone Camera Roll | 2 min |

Realistically this takes about 5 minutes once a week if you want to keep your iPhone storage clean. You can also just let it accumulate and sync less often — totally up to you.

---

## Environment variables

| Variable | Where it's used | What it does |
|----------|----------------|--------------|
| `BLOB_READ_WRITE_TOKEN` | `api/` | Vercel Blob access — auto-generated when you run `vercel env pull` |
| `KV_URL` + related | `api/` | Vercel KV access — also pulled via `vercel env pull` |
| `VAULT_SECRET_KEY` | `api/`, Android, iOS Shortcut | The shared secret used in the `X-Vault-Key` header to authenticate requests |

Don't commit `.env.local`. The `.gitignore` already takes care of this.

---

## Things that could go wrong (and what to do)

| Risk | How likely? | What to do |
|------|------------|------------|
| Google revokes the unlimited storage perk | Medium | Check your quota once a month. Photos already uploaded won't be touched even if the perk goes away |
| The Pixel XL's battery gives up | Medium | Any Pixel 1 or Pixel 2 has the same unlimited benefit — just reinstall the APK via ADB and you're back |
| Vercel Blob fills up | Low | Blob only holds pending files; they get deleted on sync. The dashboard flags anything that's been sitting for more than 14 days |
| The iOS Shortcut fails without you noticing | Medium | The Shortcut sends a completion notification — if you don't see one on Monday morning, something went wrong |

---

## What's next / upgrade paths

A few ideas if you want to take this further:

| Scenario | What to do |
|----------|-----------| 
| You want AI tagging | Add a `POST /api/analyze` route that calls a vision model on upload |
| A second person wants to use this | Add a `userId` field to all routes; each person gets their own Shortcut instance |
| Video files are making syncs slow | Use the **Encode Media** action in the Shortcut to compress videos before upload |
