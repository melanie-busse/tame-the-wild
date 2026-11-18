import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#228be6' }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dokumente',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📄</Text>,
                }}
            />
            <Tabs.Screen
                name="master-data"
                options={{
                    title: 'Stammdaten',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🗂️</Text>,
                }}
            />
        </Tabs>
    );
}
