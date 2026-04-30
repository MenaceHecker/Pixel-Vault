# Pixel Vault

> A zero-cost pipeline that routes iPhone photos through a Vercel relay
> to a Google Pixel XL, using its lifetime unlimited original-quality
> Google Photos storage.\
> **Total ongoing cost: \$0**

------------------------------------------------------------------------

## The Idea

The original Pixel XL came with a rare perk: **unlimited
original-quality Google Photos storage for life**.

iPhones don't get that deal anymore, and iCloud storage isn't free. So
instead of switching ecosystems, I built a small pipeline where:

-   My **iPhone stays my main camera**
-   The **Pixel XL quietly handles archival storage**


------------------------------------------------------------------------

## How It Works

iPhone → Vercel API → Pixel XL → Google Photos

-   Weekly upload from iPhone (iOS Shortcut)
-   Temporary storage in Vercel Blob
-   Pixel sync uploads to Google Photos
-   Cleanup after confirmation

------------------------------------------------------------------------

## Components

  ----------------------------------------------------------------------------
  Component   Stack                     Responsibility                  Cost
  ----------- ------------------------- ------------------------------- ------
  api         Next.js + Vercel Blob +   Temporary storage + sync        Free
              KV                        tracking                        

  android     Kotlin + Retrofit +       Uploads to Google Photos        Free
              Coroutines                                                

  shortcuts   iOS Shortcuts             Weekly automation               Free

  Archive     Google Photos (Pixel XL)  Long-term storage               Free
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

## 🛠 Requirements

### Hardware

-   iPhone\
-   Google Pixel XL\
-   USB-C cable\
-   Wi-Fi

### Accounts

-   Google account\
-   Vercel account\
-   GitHub

### Dev Tools

-   Node.js 18+\
-   Android Studio\
-   Vercel CLI\
-   ADB

------------------------------------------------------------------------

## Setup

### 0. Confirm Pixel Storage Perk

-   Set Google Photos backup to Original Quality\
-   Upload test photo\
-   Verify storage does not change

------------------------------------------------------------------------

### 1. Clone

git clone https://github.com/MenaceHecker/pixel-vault.git\
cd pixel-vault

------------------------------------------------------------------------

### 2. Deploy API

cd api\
npm install\
vercel deploy

------------------------------------------------------------------------

### 3. iOS Shortcut

Create: PixelVault/last_run.txt\
Add today's date

------------------------------------------------------------------------

### 4. Android App

Run via Android Studio

------------------------------------------------------------------------

## Weekly Routine

-   Sunday: auto upload\
-   Sync Pixel\
-   Verify photos

------------------------------------------------------------------------

## Environment Variables

-   BLOB_READ_WRITE_TOKEN\
-   KV_URL\
-   VAULT_SECRET_KEY

------------------------------------------------------------------------

## Risks

-   Pixel failure\
-   Storage perk removal\
-   Sync failures

------------------------------------------------------------------------

## Future Ideas

-   AI tagging\
-   Multi-user\
-   Video compression
