# Pixel Vault

The Google Pixel XL (1st generation, 2016) came with a lifetime guarantee of unlimited original-quality Google Photos storage. Google stopped offering this to newer devices, and iCloud storage costs money. Rather than pay or switch ecosystems, I built a small pipeline that keeps my iPhone as my primary camera while the Pixel XL handles archival in the background.

Total ongoing cost: $0.

---

## How It Works

```
iPhone -> Vercel API -> Google Pixel XL -> Google Photos
```

Every Sunday at 11 PM, an iOS Shortcut on my iPhone finds all photos taken since the last run and uploads them to a Next.js API on Vercel. The API holds each file in Vercel Blob and tracks its state in Upstash Redis. Files sit there until the Pixel XL is powered on and ready, which could be hours or days later since the Pixel has a degraded battery and cannot stay on permanently.

When the Pixel is available, opening the app and tapping Sync starts a Kotlin coroutine that fetches pending files, downloads each one, inserts it into the device's MediaStore under `Pictures/PixelVault/`, and waits 90 seconds for Google Photos to detect and back it up at original quality. Once confirmed, the app tells the API to delete the blob from the relay. Vercel Blob stays near-empty at rest.

The iPhone uploads on its own schedule. The Pixel syncs when it is convenient. The relay holds everything in between.

---

## Components

| Directory | Stack | Role | Cost |
|-----------|-------|------|------|
| `api/` | Next.js, Vercel Blob, Upstash Redis | Relay, state tracking, dashboard | Free |
| `android/` | Kotlin, Retrofit, Coroutines, MediaStore | Downloads files, triggers Google Photos backup, confirms relay | Free |
| `shortcuts/` | iOS Shortcuts | Weekly automated upload from iPhone | Free |
| -- | Google Photos on Pixel XL | Lossless long-term archive | Free (lifetime perk) |

---

## Requirements

### Hardware
- iPhone -- primary camera and Shortcut host
- Google Pixel XL (1st generation, 2016) -- the device whose Google account has the unlimited storage benefit
- USB-C cable -- for initial ADB sideload
- Wi-Fi -- both devices need Wi-Fi during their respective stages

### Accounts and Services
- Google account linked to the Pixel XL unlimited benefit -- do not enable Google Photos backup on the iPhone with this account
- [Vercel](https://vercel.com) -- free Hobby plan
- [Upstash](https://upstash.com) -- free Redis tier
- GitHub

### Dev Tools
- Node.js 18+
- Android Studio
- Vercel CLI: `npm i -g vercel`
- ADB -- bundled with Android Studio

---

## Setup

### 0. Verify the Pixel XL Storage Perk

Do this before anything else. The whole pipeline depends on it.

1. Sign into your Google account on the Pixel XL
2. Google Photos -> profile -> Photos settings -> Backup -> set **Original quality**
3. Take a test photo on the Pixel and let it upload
4. Check [google.com/drive/storage](https://google.com/drive/storage) -- your quota should not change

If the quota drops, the benefit is on a different account. Figure that out before continuing.

**Note:** On your iPhone, install Google Photos in browse-only mode and turn off Backup and Sync right after signing in. Photos must go through the Pixel, not directly from the iPhone.

### 1. Clone the Repo

```bash
git clone https://github.com/MenaceHecker/pixel-vault.git
cd pixel-vault
```

### 2. Deploy the API

```bash
cd api
npm install
vercel deploy
```

In the Vercel dashboard, create a Blob store and connect an Upstash Redis integration. Add your `VAULT_SECRET_KEY` as an environment variable, then redeploy.

```bash
vercel env pull .env.local
vercel --prod
```

### 3. Set Up the iOS Shortcut

See `shortcuts/README.md` for the full action chain. Before the first run, create `PixelVault/last_run.txt` in iCloud Drive through the Files app and enter today's date as `YYYY-MM-DD`. Without this, the Shortcut will try to upload your entire photo library on the first execution.

### 4. Build and Sideload the Android App

Open the `android/` folder in Android Studio. Add your API URL and secret key to `gradle.properties`:

```
VAULT_BASE_URL=https://your-api.vercel.app
VAULT_SECRET_KEY=your-secret-key
```

Enable Developer Options on the Pixel XL (Settings -> About phone -> tap Build number 7 times), connect via USB, and run from Android Studio. Once it works, generate a signed APK so you can reinstall without a laptop.

---

## Weekly Routine

| When | What happens | Effort |
|------|-------------|--------|
| Sunday 11 PM | iOS Shortcut uploads new photos to Vercel | Automatic |
| Anytime during the week | Power on Pixel XL, open app, tap Sync | 30 seconds |
| After sync | Check Google Photos on iPhone | 2 minutes |
| After checking | Delete confirmed photos from iPhone Camera Roll | 2 minutes |

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `BLOB_READ_WRITE_TOKEN` | `api/` | Vercel Blob access -- auto-populated when store is connected |
| `KV_REST_API_URL` | `api/` | Upstash Redis URL -- auto-populated via integration |
| `KV_REST_API_TOKEN` | `api/` | Upstash Redis token -- auto-populated via integration |
| `VAULT_SECRET_KEY` | `api/`, Android, iOS Shortcut | Shared secret for request authentication |

Do not commit `.env.local` or `gradle.properties` with real values. Both are in `.gitignore`.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Google removes the unlimited storage perk | Medium | Check quota monthly. Photos already uploaded stay unaffected |
| Pixel XL hardware fails | Medium | Any 1st or 2nd gen Pixel has the same benefit. Reinstall the APK via ADB |
| Vercel Blob fills up between syncs | Low | Blobs are deleted after each confirm. The dashboard warns if a file has been pending over 14 days |
| iOS Shortcut fails silently | Medium | The Shortcut sends a notification on success. No notification on Monday morning means something went wrong |

---

## Ideas for Later

- Run uploaded photos through a vision model for auto-tagging before the Pixel syncs
- Add a `userId` field to the API routes so a second person can use the same relay with their own Shortcut
- Compress videos in the Shortcut before upload to reduce relay storage and sync time

---
