# NoFap Fursan: Elite Sabr Tracker ⚔️

**NoFap Fursan** is a privacy-first, decentralized Sabr (Patience/Discipline) tracker and Vanguard community designed to help you build self-mastery. Built on the **Nostr** protocol, Fursan ensures your data remains yours—encrypted, decentralized, and censorship-resistant.

![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)
![Protocol: Nostr](https://img.shields.io/badge/Protocol-Nostr-purple.svg)
![Platform: Android](https://img.shields.io/badge/Platform-Android-green.svg)
![Privacy: High](https://img.shields.io/badge/Privacy-Local%20Only-blue.svg)

---

## 🚀 Key Features

### 🛡️ Private & Decentralized
*   **Privacy First**: All sensitive data (Journal, Streak) is stored locally or encrypted using **NIP-44 (v2)** before syncing.
*   **No Accounts**: No email, no phone number. Just a generated cryptographic identity (Nostr Keys).
*   **Offline-First**: Works perfectly without internet. Syncs securely when you reconnect.

### ⚔️ The Vanguard (Community)
*   **Encrypted Channels**: Chat with fellow warriors in dedicated channels:
    *   **General**: Command & Strategy
    *   **SOS**: Emergency Assistance
    *   **Motivation**: Power & Wisdom
    *   **Fiqh**: Sacred Knowledge
*   **Identity Discovery**: Automatically fetches profiles from the global Nostr network.

### 🕌 Spiritual & Mental Tools
*   **Panic Button**: Instant redirection and motivational content for urgent moments.
*   **Journal**: Encrypted daily logs to track your mental state (Clear, Foggy, Stormy).
*   **Prayer times & Adhan**: Available in our companion app **[Noor Connect](https://f-droid.org/en/packages/com.noorconnect.app/)** — free and open source on F-Droid.

### 🎨 Premium Experience
*   **Dynamic Theming**:
    *   **Fursan Royal**: A prestigious Cream & Gold aesthetic (Default).
    *   **Fursan Dark**: A high-contrast Gold on Black mode for night operations.
*   **Ad-Free**: Zero ads, zero trackers, 100% Free & Open Source.

---

## 🔧 Technical Details

*   **Framework**: React, TypeScript, Vite, Capacitor
*   **Encryption**: NIP-44 (Secp256k1)
*   **Build System**: Gradle 8.7+ (Android Gradle Plugin 8.7.2)
*   **JDK**: Java 17 Required

---

## 📥 Getting the App

### 🛠️ Build from Source
1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Build the web assets: `npm run build`
4.  Sync Capacitor: `npx cap sync android`
5.  Build APK:
    ```bash
    cd android
    ./gradlew assembleRelease
    ```

### 📦 Releases
Visit the **[Releases](https://gitlab.com/theredhacker0345/nofapfursan/-/releases)** page for the latest APK.

### 🤖 F-Droid

Fursan is prepared for inclusion in the F-Droid repository:

- **License**: MIT (fully FOSS — no Google Play Services, no Firebase, no trackers)
- **Application ID**: `com.nofapfursan.app`
- **Build metadata**: `metadata/com.nofapfursan.app.yml`
- **Store listing**: `fastlane/metadata/android/en-US/` (descriptions, icon, screenshots, changelogs)

F-Droid builds the app from source with this recipe:

```bash
npm ci
npm run build
npx cap sync android
cd android && gradle assembleRelease   # signed by F-Droid
```

Release process for maintainers:

1. Bump `versionCode`/`versionName` in `android/app/build.gradle`.
2. Add a changelog entry at `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`.
3. Commit and tag: `git tag vX.Y.Z && git push origin main --tags`.
4. Add a matching `Builds:` block for the new version in `metadata/com.nofapfursan.app.yml`.
5. Propose the app via a merge request to [fdroiddata](https://gitlab.com/fdroid/fdroiddata).

---

## 📚 Companion App: Noor Connect

Looking for prayer times, adhan alerts and more? Check out our free Islamic companion app:

**[Noor Connect on F-Droid](https://f-droid.org/en/packages/com.noorconnect.app/)**

---

## 💰 Support the Mission

Fursan is developed by **Ubaid**. If this tool helps you in your journey, consider supporting the development.

**Contact**: `ubaid0345@proton.me`

**Donations**:
*   **Solana (SOL)**: `3Aw78BrsdtBeZNpTQvAP6kjtUpGqDBqhr8dATzEZgp8V`
*   **Bitcoin (BTC)**: `bc1q43nelc0skgng752wesq5ez4qzhgl09cksmlddx`

---

## 📄 License & Privacy

**License**: MIT License. Free to fork, modify, and distribute.

**Privacy Policy**: This app does NOT collect usage data. It does NOT use your location. Chat messages are public (Signed Events) but stored on decentralized relays, not our servers. Encrypted data (Journal, Streak) is readable only by YOU.

*"Stay strong. Stay disciplined. Become legendary."* ⚔️
