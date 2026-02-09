# How to Build Your Android App (.apk)

I have set up the entire Android project for you. Since I cannot generate the final `.apk` file directly (it requires Android Studio installed on your machine), follow these simple steps to build it yourself.

## Prerequisites
- **Android Studio**: Installed on your computer.

## Steps to Build
1.  **Open Project in Android Studio**:
    -   Open Android Studio.
    -   Click **Open**.
    -   Navigate to: `f:\enakshis project backup\NEW PROJECT\client\android`
    -   Click **OK**.

2.  **Wait for Sync**:
    -   Android Studio will take a few minutes to sync the project and download necessary tools (Gradle).
    -   Wait until the bottom progress bar finishes.

3.  **Build APK**:
    -   Go to the top menu: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
    -   Wait for the build to complete.

4.  **Locate APK**:
    -   Once finished, a popup will appear at the bottom right. Click **locate**.
    -   Or navigate manually to: `client\android\app\build\outputs\apk\debug\app-debug.apk`

5.  **Install**:
    -   Transfer this `.apk` file to your Android phone and install it!

## Features Included
-   **Custom Icon**: The icon you provided is set as the app icon.
-   **Splash Screen**: Black background with your icon.
-   **Native Notifications**: The app now uses the native Android notification system, so permissions will work correctly.
