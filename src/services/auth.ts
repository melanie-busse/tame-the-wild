import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const KEY_URL   = 'PAPERLESS_URL';
const KEY_TOKEN = 'PAPERLESS_TOKEN';

export function normalizeBaseUrl(raw: string): string {
    return raw
        .trim()
        .replace(/\/documents\/?$/, '')
        .replace(/\/api\/?$/, '')
        .replace(/\/$/, '');
}

export async function saveCredentials(url: string, token: string): Promise<void> {
    await SecureStore.setItemAsync(KEY_URL, url);
    await SecureStore.setItemAsync(KEY_TOKEN, token);
}

export async function loadCredentials(): Promise<{ url: string; token: string } | null> {
    const url   = await SecureStore.getItemAsync(KEY_URL);
    const token = await SecureStore.getItemAsync(KEY_TOKEN);
    if (!url || !token) return null;
    return { url, token };
}

export async function clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_URL);
    await SecureStore.deleteItemAsync(KEY_TOKEN);
}

export async function fetchToken(
    serverUrl: string,
    username: string,
    password: string,
): Promise<string> {
    const base = normalizeBaseUrl(serverUrl);
    let response: Response;
    try {
        response = await fetch(`${base}/api/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    } catch {
        throw new Error('network_error');
    }
    if (response.status === 400 || response.status === 401) {
        throw new Error('invalid_credentials');
    }
    if (!response.ok) {
        throw new Error('network_error');
    }
    const data = await response.json();
    if (typeof data.token !== 'string') {
        throw new Error('network_error');
    }
    return data.token;
}

export async function checkBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
}

export async function authenticateBiometric(): Promise<boolean> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'TameTheWild entsperren',
            fallbackLabel: 'PIN verwenden',
            cancelLabel: 'Abbrechen',
        });
        return result.success;
    } catch {
        return false;
    }
}
