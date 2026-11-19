import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
    loadCredentials, clearCredentials, saveCredentials,
    checkBiometricAvailable, authenticateBiometric,
} from '../services/auth';
import { setApiCredentials } from '../services/api';

export type AuthState = 'loading' | 'unauthenticated' | 'needs_biometric' | 'authenticated';

export interface AuthContextValue {
    authState: AuthState;
    biometricAvailable: boolean;
    login(url: string, token: string): Promise<void>;
    logout(): Promise<void>;
    unlockBiometric(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [authState, setAuthState] = useState<AuthState>('loading');
    const [biometricAvailable, setBiometricAvailable] = useState(true);
    const authStateRef = useRef<AuthState>('loading');

    // keep ref in sync so AppState listener can read current state without stale closure
    useEffect(() => {
        authStateRef.current = authState;
    }, [authState]);

    // initial load
    useEffect(() => {
        (async () => {
            try {
                const creds = await loadCredentials();
                if (!creds) {
                    setAuthState('unauthenticated');
                    return;
                }
                setApiCredentials(creds.url, creds.token);
                const available = await checkBiometricAvailable();
                setBiometricAvailable(available);
                setAuthState('needs_biometric');
            } catch {
                setAuthState('unauthenticated');
            }
        })();
    }, []);

    // AppState re-lock: only lock if app was in background for >15 s
    // Shorter absences (system dialogs, document picker) are ignored.
    useEffect(() => {
        let backgroundedAt: number | null = null;
        const LOCK_AFTER_MS = 15_000;

        const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
            if (next === 'background' || next === 'inactive') {
                backgroundedAt = Date.now();
            } else if (next === 'active') {
                const elapsed = backgroundedAt !== null ? Date.now() - backgroundedAt : 0;
                backgroundedAt = null;
                if (elapsed >= LOCK_AFTER_MS && authStateRef.current === 'authenticated') {
                    setAuthState('needs_biometric');
                }
            }
        });
        return () => sub.remove();
    }, []);

    const login = async (url: string, token: string) => {
        setApiCredentials(url, token);
        saveCredentials(url, token).catch(() => {/* best-effort; credentials already in memory */});
        const available = await checkBiometricAvailable();
        setBiometricAvailable(available);
        setAuthState('needs_biometric');
    };

    const logout = async () => {
        await clearCredentials();
        setApiCredentials('', '');
        setAuthState('unauthenticated');
    };

    const unlockBiometric = async () => {
        const success = await authenticateBiometric();
        if (success) setAuthState('authenticated');
    };

    return (
        <AuthContext.Provider value={{ authState, biometricAvailable, login, logout, unlockBiometric }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
