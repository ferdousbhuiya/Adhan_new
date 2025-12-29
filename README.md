# Adhan Pro by Ferdous (Expo + React Native)

This is a starter cross-platform mobile app to calculate prayer times and schedule local notifications to call the adhan.

## Key features
- Calculate prayer times using the `adhan` library
- Schedule daily notifications at prayer times using `expo-notifications`
- Play adhan audio (requires `assets/adhan.mp3`)

## Quick start
1. Install dependencies:

   npm install

   Install required packages (if using the created package.json this is already covered). If you need to add them manually, run:

   npm install adhan expo-notifications expo-location expo-av @react-native-async-storage/async-storage @react-navigation/native

2. Start Expo:

   npx expo start

3. Run on a physical device (recommended for notifications):

   - Install Expo Go on your phone and scan the QR.
   - For custom sounds or full background behavior you may need to build a native binary (EAS or bare workflow).

## Notes & next steps
- Add `assets/adhan.mp3` (see `assets/README.md`).
- iOS custom notification sound requires native bundling.
- Android custom channel sounds require placing sound in `android/app/src/main/res/raw/` and configuring channels accordingly.

## EAS build configuration
- I added a minimal `eas.json` with `preview` (APK) and `production` (AAB) profiles. You can customize profiles as needed.
- To configure EAS locally run:

  eas build:configure

- Quick build commands once you have `eas-cli` installed and are logged in with `eas login`:

  - Preview APK (quick testing): `eas build -p android --profile preview`
  - Production AAB (for Play Store): `eas build -p android --profile production`

- I added instructions to help set up GitHub Actions for automated EAS builds. To enable the workflow, add these repository secrets in GitHub:

  - `EXPO_TOKEN`: your Expo access token (required)
  - `GOOGLE_SERVICE_ACCOUNT_KEY`: (optional) JSON content of a Google Play service account for automatic Play Store submits

  The workflow file is at `.github/workflows/eas-build.yml` and will:
  - run a **preview APK** build on pushes to `main` (profile: `preview`)
  - run a **production AAB** build on tags like `v*` or release creation (profile: `production`) and optionally submit to Play Store when `GOOGLE_SERVICE_ACCOUNT_KEY` is present

  Useful npm scripts were added to simplify commands:

  - `npm run prebuild` — generate native projects (`npx expo prebuild`)
  - `npm run android` — build and install debug APK on connected device (`expo run:android`)
  - `npm run build:preview` — start an EAS preview build (APK)
  - `npm run build:production` — start an EAS production build (AAB)
  - `npm run eas:login` — run `eas login` interactively to authenticate your local machine

  If you want, I can also create a GitHub repo for you and push these changes (ask and provide repo name and visibility), or I can add a GitHub Actions workflow and you can push it to your existing repo.

> Note: If `assets/adhan.mp3` is missing, the app now falls back to a small public-domain beep (hosted remotely) so you can test playback without adding a local audio file.

## Testing notifications (short guide)
- Use a physical device (recommended). Notifications behavior is limited on simulators/emulators.
- Start the app: `npm install` then `npx expo start`.
- Open the app on your phone with Expo Go, grant location and notification permissions when prompted.
- Tap **Schedule daily notifications** to schedule today's upcoming prayer times (if a prayer time is already in the past for today it will be scheduled for tomorrow).
- When a notification is received while the app is in foreground, the app will attempt to play `assets/adhan.mp3`; if it isn't present a short beep will play instead.

## If you want me to add a sample adhan
I added a synthetic sample generator you can install from the app: Open the app and tap **Install synthetic adhan sample** to write a generated `adhan-synthetic.wav` to the app's local documents directory. Then tap **Play adhan now** to preview the sample. This lets you test offline playback without adding your own audio file.

If you prefer, you can still add a custom `assets/adhan.mp3` file to the project and it will be used before the synthetic sample.

## Voices manager
- Open **Manage voices** inside the app to preview, download, and set an offline adhan voice.
- The app ships with synthetic CC0 voices you can preview and download; downloaded voices are stored in the app's documents directory for offline use.
- You can fetch a **remote demo voices list** from the app (Manage voices -> Fetch remote demo voices) which will show remote voice previews and allow you to download them locally for offline use. This simulates connecting to a remote API and demonstrates preview/download flow.
- When you schedule daily notifications, the app will attach the **active offline voice** (if set) to each scheduled notification; when a notification is received while the app is in the foreground (or when the user taps the notification) the app will play the selected offline voice automatically.
- You can quickly verify behavior using **Test notification (1 min)** on the main screen — it schedules a one-off notification one minute from now using the active voice. You can also use **Test now** to immediately present a test notification and (while the app is foregrounded) play the active voice instantly.
- In future this can be extended to fetch voices from a real remote API or accept user-provided files.

## Implemented files
- `src/AppMain.tsx` — main screen, location & scheduling logic
- `src/services/prayerTimes.ts` — wrapper around `adhan` calculations
- `src/services/notifications.ts` — schedule/cancel helpers using `expo-notifications`
- `src/components/PrayerTimesList.tsx` — simple UI list

## To do
- Add settings UI (change calculation method, location input)
- Improve scheduling to repeat daily reliably (consider background services / native code)
- Add tests & CI

