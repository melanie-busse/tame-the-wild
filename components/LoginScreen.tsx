import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchToken, normalizeBaseUrl } from '../src/services/auth';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
    const auth = useAuth();
    const [serverUrl, setServerUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit = serverUrl.trim() && username.trim() && password.trim() && !submitting;

    const handleLogin = async () => {
        setError(null);
        setSubmitting(true);
        try {
            const token = await fetchToken(serverUrl.trim(), username.trim(), password);
            auth.login(normalizeBaseUrl(serverUrl.trim()), token);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '';
            if (msg === 'invalid_credentials') {
                setError('Benutzername oder Passwort falsch.');
            } else {
                setError('Server nicht erreichbar. URL prüfen.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.title}>TameTheWild</Text>
                        <Text style={styles.subtitle}>Paperless-ngx verbinden</Text>

                        <Text style={styles.label}>Server-URL</Text>
                        <TextInput
                            style={styles.input}
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            placeholder="https://paperless.example.com"
                            placeholderTextColor="#adb5bd"
                            keyboardType="url"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!submitting}
                        />

                        <Text style={styles.label}>Benutzername</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="admin"
                            placeholderTextColor="#adb5bd"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!submitting}
                        />

                        <Text style={styles.label}>Passwort</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor="#adb5bd"
                            secureTextEntry
                            editable={!submitting}
                            onSubmitEditing={canSubmit ? handleLogin : undefined}
                            returnKeyType="done"
                        />

                        <TouchableOpacity
                            style={[styles.button, !canSubmit && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={!canSubmit}
                            activeOpacity={0.8}
                        >
                            {submitting
                                ? <ActivityIndicator color="#ffffff" />
                                : <Text style={styles.buttonText}>Anmelden</Text>
                            }
                        </TouchableOpacity>

                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    keyboardView: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    card: {
        backgroundColor: '#ffffff', borderRadius: 14, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    title: { fontSize: 26, fontWeight: '700', color: '#212529', textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#6c757d', textAlign: 'center', marginBottom: 24 },
    label: {
        fontSize: 12, color: '#adb5bd', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 6, marginTop: 16,
    },
    input: {
        backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 12,
        paddingVertical: 11, fontSize: 15, color: '#212529',
        borderWidth: 1, borderColor: '#dee2e6',
    },
    button: {
        marginTop: 24, backgroundColor: '#228be6', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center',
    },
    buttonDisabled: { backgroundColor: '#adb5bd' },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    errorText: { marginTop: 12, color: '#fa5252', fontSize: 14, textAlign: 'center' },
});
