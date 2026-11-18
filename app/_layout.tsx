import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import LoginScreen from '../components/LoginScreen';
import LockScreen from '../components/LockScreen';

function RootGate() {
    const { authState } = useAuth();

    if (authState === 'loading') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' }}>
                <ActivityIndicator size="large" color="#228be6" />
            </View>
        );
    }

    if (authState === 'unauthenticated') {
        return <LoginScreen />;
    }

    if (authState === 'needs_biometric') {
        return <LockScreen />;
    }

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#212529',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="document/[id]"
                options={{ title: 'Dokumentdetails' }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <RootGate />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
