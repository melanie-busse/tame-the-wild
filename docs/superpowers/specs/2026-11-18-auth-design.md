# Auth & Biometric Security Design

**Date:** 2026-11-18
**Branch:** feature/auth
**Status:** Approved

## Goal

Replace hardcoded `EXPO_PUBLIC_*` credentials with a full login flow: the user enters their Paperless-ngx server URL, username and password once; the app fetches an API token via `POST /api/token/`, stores URL and token encrypted in `expo-secure-store`, and protects every subsequent app session with biometric authentication (fingerprint, Face ID, or device PIN fallback via `expo-local-authentication`). A logout option clears all credentials.

## Scope

This spec covers exactly the four features described:
1. Login screen and token fetch
2. Encrypted credential storage
3. Biometric re-lock on every cold start and foreground return
4. Logout

It does not cover: token refresh, multi-account, server certificate pinning, or offline mode.

---

## Architecture

### Auth state machine (in root layout)

```
LOADING
  → SecureStore read
      no credentials → UNAUTHENTICATED
      credentials found → setApiCredentials(); → NEEDS_BIOMETRIC

UNAUTHENTICATED
  → user completes LoginScreen → fetch token → save → NEEDS_BIOMETRIC

NEEDS_BIOMETRIC
  → authenticateAsync() succeeds → AUTHENTICATED
  → user cancels (stays in NEEDS_BIOMETRIC) → LockScreen shown
      "Entsperren"-button → retry authenticateAsync()
      "Abmelden"-button   → clearCredentials(); → UNAUTHENTICATED

AUTHENTICATED
  → AppState: active after background → NEEDS_BIOMETRIC
```

There is no "skip biometrics" path. If the device has no enrolled biometrics, `expo-local-authentication` falls back to the device PIN automatically — no extra code path needed.

### Component ownership

| File | Role |
|---|---|
| `src/services/auth.ts` | Secure Store I/O, token fetch, biometric, URL normalization |
| `src/context/AuthContext.tsx` | React context — exposes `authState`, `login()`, `logout()` |
| `components/LoginScreen.tsx` | Full-screen login UI |
| `components/LockScreen.tsx` | Full-screen lock UI (shown in NEEDS_BIOMETRIC after cancel) |
| `app/_layout.tsx` | Auth gate: reads context, renders correct screen, AppState listener |
| `app/(tabs)/master-data.tsx` | Logout button (via `useAuth()`) |
| `src/services/api.ts` | Gains `setApiCredentials(url, token)` setter; static env vars removed |

---

## `src/services/auth.ts`

### URL normalization

```
normalizeBaseUrl(raw: string): string
```

Strips trailing `/`, `/api`, `/api/` from whatever the user typed so that appending `/api/token/` always works:

| User input | Normalized |
|---|---|
| `https://domain.de` | `https://domain.de` |
| `https://domain.de/` | `https://domain.de` |
| `https://domain.de/api` | `https://domain.de` |
| `https://domain.de/api/` | `https://domain.de` |
| `https://domain.de/documents` | `https://domain.de` |

Rule: strip `/documents/?$`, then strip `/api/?$`, then strip trailing `/`.

### Secure Store keys

```
PAPERLESS_URL   → normalized base URL
PAPERLESS_TOKEN → API token
```

### Functions

```ts
saveCredentials(url: string, token: string): Promise<void>
loadCredentials(): Promise<{ url: string; token: string } | null>
clearCredentials(): Promise<void>

fetchToken(serverUrl: string, username: string, password: string): Promise<string>
// POST {normalizeBaseUrl(serverUrl)}/api/token/
// body: { username, password }
// Paperless returns: { token: string }
// throws on HTTP error or missing token field

checkBiometricAvailable(): Promise<boolean>
// LocalAuthentication.hasHardwareAsync() && isEnrolledAsync()
// true means biometric OR device-PIN is available

authenticateBiometric(): Promise<boolean>
// LocalAuthentication.authenticateAsync({
//   promptMessage: 'TameTheWild entsperren',
//   fallbackLabel: 'PIN verwenden',
//   cancelLabel: 'Abbrechen',
// })
// returns success boolean; never throws
```

---

## `src/context/AuthContext.tsx`

```ts
type AuthState = 'loading' | 'unauthenticated' | 'needs_biometric' | 'authenticated';

interface AuthContextValue {
  authState: AuthState;
  login(url: string, token: string): void;   // called by LoginScreen after fetchToken
  logout(): Promise<void>;                   // called by LockScreen + master-data
  unlockBiometric(): Promise<void>;          // called by LockScreen "Entsperren"-button
}
```

`AuthProvider` wraps the whole app (placed in `_layout.tsx`). It:
- reads SecureStore on mount → sets initial state
- calls `setApiCredentials` whenever credentials are set
- listens to `AppState` and transitions `authenticated → needs_biometric` on foreground return

---

## `src/services/api.ts` changes

Replace:
```ts
export const BASE_URL = (process.env.EXPO_PUBLIC_PAPERLESS_URL || '')...
export const API_TOKEN = process.env.EXPO_PUBLIC_PAPERLESS_TOKEN || '';
```

With:
```ts
let _baseUrl = '';
let _token   = '';

export function setApiCredentials(url: string, token: string): void {
    _baseUrl = url;
    _token   = token;
}

// All existing functions replace BASE_URL → _baseUrl, API_TOKEN → _token.
// Two compatibility getters so document/[id].tsx thumbnail/download URLs still work:
export const getBaseUrl  = () => _baseUrl;
export const getApiToken = () => _token;
```

`document/[id].tsx` and other consumers of the old constants are updated to call `getBaseUrl()` / `getApiToken()`.

---

## `components/LoginScreen.tsx`

Three fields: **Server-URL**, **Benutzername**, **Passwort**.
One primary button: **Anmelden**.

Behavior:
- Validates that all three fields are non-empty before enabling the button
- Calls `fetchToken(url, username, password)` on press
- Shows an inline error message below the button on failure (not an Alert)
- On success: calls `AuthContext.login(normalizedUrl, token)`

Visual style: matches existing app (`#228be6`, `#f4f6f8` background, white card, border-radius 14).

---

## `components/LockScreen.tsx`

Shown when `authState === 'needs_biometric'` and the system prompt was dismissed.

Two buttons:
- **Entsperren** (primary, `#228be6`) → calls `AuthContext.unlockBiometric()`
- **Abmelden** (destructive, `#fa5252`) → calls `AuthContext.logout()`

The biometric prompt fires automatically on entering `needs_biometric` state, so the LockScreen is only the fallback UI that appears if the user cancels the prompt. The "Entsperren" button re-fires `authenticateBiometric()`.

---

## `app/_layout.tsx`

Wraps everything in `<AuthProvider>`. Reads `authState` from context:

```
authState === 'loading'           → <LoadingSpinner />
authState === 'unauthenticated'   → <LoginScreen />
authState === 'needs_biometric'   → <LockScreen />
authState === 'authenticated'     → <Stack> (unchanged)
```

The `<Stack>` and its `Stack.Screen` entries are identical to today.

---

## Logout (master-data screen)

A red **Abmelden**-button at the bottom of `app/(tabs)/master-data.tsx`, styled clearly as destructive. Calls `AuthContext.logout()` via `useAuth()`. No confirmation dialog — the LockScreen / LoginScreen appears immediately after.

---

## Error handling

| Scenario | Behavior |
|---|---|
| Wrong credentials on login | Inline error: "Benutzername oder Passwort falsch." |
| Server not reachable on login | Inline error: "Server nicht erreichbar. URL prüfen." |
| Biometric prompt cancelled | LockScreen shown; user can retry or log out |
| SecureStore read failure | Treat as unauthenticated; log error |
| API call with empty credentials (bug) | Existing `throw new Error('HTTP ...')` propagates as before |

---

## Dependencies to install

```
expo install expo-secure-store expo-local-authentication
```

Both are first-party Expo packages, compatible with SDK 58, no native build changes required beyond running `expo prebuild` (already done for this project).

---

## Out of scope (explicitly)

- Token expiry / automatic re-login — if a 401 occurs after login, the user must log out and log in again manually.
- Multiple Paperless server accounts.
- "Remember me" / opt-out of biometrics.
