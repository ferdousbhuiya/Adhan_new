# EAS Build (APK) — Quick Guide ✅

This document explains how to run the GitHub Actions EAS preview build (APK) and how to provide the required secrets.

## 1) Create an Expo/EAS token

1. Install the EAS CLI (locally):
   - npm install -g eas-cli
2. Log in to your Expo account and generate a token:
   - eas login
   - eas token:create --name "github-actions-token"
3. Copy the generated token.

> Note: If you prefer, you can generate a token from the Expo dashboard (https://expo.dev/settings/tokens).

## 2) Add repository secrets

1. Go to your repository on GitHub → Settings → Secrets & variables → Actions → New repository secret.
2. Add `EXPO_TOKEN` with the token value.
3. (Optional for production) Add `GOOGLE_SERVICE_ACCOUNT_KEY` with the JSON service account content if you want Play Store submit.

## 3) Run the workflow

1. Open the **Actions** tab in GitHub and select the **"Preview build (APK)"** workflow.
2. Click **Run workflow** → choose branch `main` → Run.
3. The workflow will start, run `eas build` on Expo servers, wait for completion, download the resulting APK, and attach it as an artifact named `adhan-android-apk`.

## 4) Download & install the APK

1. After the workflow completes, open the run and download the `adhan-android-apk` artifact.
2. Install to your connected device (example using adb):
   - adb install -r path/to/adhan-app.apk

## Troubleshooting

- If the build fails on EAS, open the build log link in the workflow job output to see full EAS logs.
- If you prefer not to auto-manage credentials, configure your Android keys/keystore according to Expo docs.

---

If you'd like, I can push a small commit now to trigger the workflow (I will make a tiny docs change). Let me know to proceed.