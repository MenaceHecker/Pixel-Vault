# Pixel Vault

> A zero-cost pipeline that routes iPhone photos through a Vercel relay to a Google Pixel XL, using its lifetime unlimited original-quality Google Photos storage. Total ongoing cost: **$0**.

---

## The idea

Google gave the original Pixel XL unlimited original-quality Google Photos storage for life.

iCloud storage is not free, and Google Photos no longer gives iPhone users that same deal. So I built a small pipeline that lets my iPhone stay my main camera while the Pixel XL quietly handles archiving in the background.

The flow looks like this:

iPhone                   Vercel API               Google Pixel XL
──────                   ──────────               ───────────────
iOS Shortcut        →    POST /api/upload    →    Pixel Vault App
(weekly, auto)           Vercel Blob               (manual sync)
                         Vercel KV            →    Google Photos
                    ←    POST /api/confirm         (unlimited)
                         (cleanup)

Every Sunday night, an iOS Shortcut picks up the week's new photos and uploads them to a Vercel API. They sit in Vercel Blob temporarily until I power on the Pixel XL and hit Sync. The Android app pulls them down, sends them to Google Photos, then tells the API they are safe to delete. Photos stay in Blob only for a few days.

---

## Repo structure

pixel-vault/
├── api/              Next.js API, upload relay, dashboard (Vercel)
├── android/          Kotlin Android app, Pixel XL sync client
├── shortcuts/        iOS Shortcut export + setup instructions
├── docs/             Architecture notes and diagrams
└── README.md         You're here

---

## What each piece does

| Component | Stack | What it does | Cost |
|-----------|-------|--------------|------|
| `api/` | Next.js + Vercel Blob + Vercel KV | Holds photos temporarily and tracks what has been backed up | Free (Hobby plan) |
| `android/` | Kotlin + Retrofit + Coroutines | Downloads pending photos, adds them to Google Photos, confirms cleanup | Free (sideloaded) |
| `shortcuts/` | iOS Shortcuts | Grabs new photos every Sunday night and uploads them to the API | Free (built into iOS) |
| Archive | Google Photos on Pixel XL | Final storage at full quality | Free (lifetime perk) |

---

## What you'll need

### Hardware
- An iPhone as your main camera  
- A Google Pixel XL (1st gen, 2016) as the archive device  
- A USB-C cable for sideloading and charging  
- Wi-Fi for both devices during sync  

### Accounts and services
- A Google account linked to the Pixel storage benefit  
- A Vercel account (free Hobby plan works fine)  
- A GitHub account  

### Dev tools
- Node.js 18+  
- Android Studio  
- Vercel CLI: `npm i -g vercel`  
- ADB (comes with Android Studio)  

---

## Setup

### Step 0: Confirm the Pixel storage perk is active

1. Power on the Pixel XL and sign in with your Google account  
2. Go to Google Photos → Profile → Photos settings → Backup → set to Original quality  
3. Take a test photo and let it upload  
4. Check https://google.com/drive/storage and confirm your quota does not change  
5. On your iPhone, if you install Google Photos, turn off Backup and Sync immediately  

Do not upload directly from your iPhone to Google Photos. That will count against your storage.

---

### Step 1: Clone the repo

git clone https://github.com/MenaceHecker/pixel-vault.git  
cd pixel-vault

---

### Step 2: Deploy the API

cd api  
npm install  
vercel deploy  

Then in the Vercel dashboard:

- Create Blob: pixel-vault-blob  
- Create KV: pixel-vault-kv  
- Set Root Directory to api  

Pull environment variables:

vercel env pull .env.local  
Set VAULT_SECRET_KEY  
vercel env add VAULT_SECRET_KEY  
vercel --prod  

---

### Step 3: Set up the iOS Shortcut

Create:

PixelVault/last_run.txt  

Add today's date (example: 2025-04-28)

---

### Step 4: Build Android app

Enable developer options and run via Android Studio.

---

## Weekly usage

- Sunday: auto upload  
- Turn on Pixel and sync  
- Check photos  
- Optionally delete from iPhone  

---

## Environment variables

- BLOB_READ_WRITE_TOKEN  
- KV_URL  
- VAULT_SECRET_KEY  

---

## Risks

- Storage perk removed  
- Pixel battery failure  
- Blob fills up  
- Shortcut fails  

---

## Future ideas

- AI tagging  
- Multi-user support  
- Video compression  
