import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_DOCUMENTS, Document } from './src/data/mockDocuments';

export default function App() {
    const renderDocumentItem: ListRenderItem<Document> = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.metaContainer}>
                <Text style={styles.subtext}>🏢 {item.correspondent}</Text>
                <Text style={styles.subtext}>📅 {item.created}</Text>
            </View>
            <View style={styles.tagContainer}>
                <Text style={styles.typeTag}>{item.document_type}</Text>
                {item.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>{tag}</Text>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar style="dark" />
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>TameTheWild 🦁</Text>
                    <Text style={styles.headerSubtitle}>Deine Dokumente (Offline-Modus)</Text>
                </View>

                <FlatList
                    data={MOCK_DOCUMENTS}
                    renderItem={renderDocumentItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerContainer: { padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#212529' },
    headerSubtitle: { fontSize: 14, color: '#6c757d', marginTop: 2 },
    listContainer: { padding: 16 },
    card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    title: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 },
    metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    subtext: { fontSize: 13, color: '#6c757d' },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    typeTag: { backgroundColor: '#e7f5ff', color: '#1971c2', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tag: { backgroundColor: '#f1f3f5', color: '#495057', fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});