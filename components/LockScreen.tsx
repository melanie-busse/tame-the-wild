import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';

export default function LockScreen() {
    const { biometricAvailable, unlockBiometric, logout } = useAuth();

    // Auto-trigger biometric prompt once on mount (only if available)
    useEffect(() => {
        if (biometricAvailable) {
            unlockBiometric();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>TameTheWild</Text>
                <Text style={styles.subtitle}>App ist gesperrt</Text>

                {biometricAvailable ? (
                    <>
                        <TouchableOpacity style={styles.unlockButton} onPress={unlockBiometric} activeOpacity={0.8}>
                            <Text style={styles.unlockText}>Entsperren</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                            <Text style={styles.logoutText}>Abmelden</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.unavailableText}>
                            Keine Bildschirmsperre eingerichtet.{'\n'}
                            Bitte richte eine Geräte-PIN oder Biometrie ein, um die App zu entsperren.
                        </Text>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                            <Text style={styles.logoutText}>Abmelden</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    title: { fontSize: 26, fontWeight: '700', color: '#212529', marginBottom: 6 },
    subtitle: { fontSize: 15, color: '#6c757d', marginBottom: 40 },
    unlockButton: {
        width: '100%', backgroundColor: '#228be6', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center', marginBottom: 12,
    },
    unlockText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    logoutButton: {
        width: '100%', borderRadius: 10, paddingVertical: 14,
        alignItems: 'center', borderWidth: 1, borderColor: '#fa5252',
    },
    logoutText: { color: '#fa5252', fontSize: 15, fontWeight: '600' },
    unavailableText: {
        fontSize: 14, color: '#6c757d', textAlign: 'center',
        lineHeight: 22, marginBottom: 32,
    },
});
