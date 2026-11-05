import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_DOCUMENTS } from '../../src/data/mockDocuments';

export default function DocumentDetailScreen() {
    const { id } = useLocalSearchParams();
    const document = MOCK_DOCUMENTS.find((doc) => doc.id === id);

    if (!document) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Dokument nicht gefunden.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <View style={styles.content}>
                <Text style={styles.title}>{document.title}</Text>
                <Text style={styles.meta}>Absender: {document.correspondent}</Text>
                <Text style={styles.meta}>Datum: {document.created}</Text>
                <Text style={styles.meta}>Typ: {document.document_type}</Text>

                <View style={styles.tagContainer}>
                    {document.tags.map((tag, index) => (
                        <Text key={index} style={styles.tag}>{tag}</Text>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
    content: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#212529', marginBottom: 16 },
    meta: { fontSize: 15, color: '#495057', marginBottom: 8 },
    errorText: { fontSize: 16, color: '#fa5252', textAlign: 'center', marginTop: 40 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
    tag: { backgroundColor: '#f1f3f5', color: '#495057', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
});