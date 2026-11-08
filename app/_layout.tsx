import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: '#ffffff' },
                    headerTintColor: '#212529',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{ title: 'TameTheWild', headerShown: false }}
                />
                <Stack.Screen
                    name="document/[id]"
                    options={{ title: 'Dokumentdetails' }}
                />
            </Stack>
        </SafeAreaProvider>
    );
}