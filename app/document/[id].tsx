import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { Document } from '../../src/data/mockDocuments';
import { fetchPaperlessDocuments } from '../../src/services/api';

export default function DocumentDetailScreen() {
    const { id } = useLocalSearchParams();
    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadDocumentDetail() {
            try {
                const docs = await fetchPaperlessDocuments();
                const found = docs.find((doc) => doc.id === id);
                setDocument(found || null);
            } catch (error) {
                console.error('Fehler beim Laden des Dokuments:', error);
            } finally {
                setLoading(false);
            }
        }
        loadDocumentDetail();
    }, [id]);

    // Funktion zum Öffnen/Download des PDFs von deiner Paperless-Instanz
    const handleOpenPdf = async () => {
        // Beispiel-URL für den PDF-Download in Paperless-ngx:
        // https://deine-paperless-url.de/api/documents/{id}/download/
        const pdfUrl = `https://paperless.melanie-busse.de/api/documents/${id}/download/`;

        const supported = await Linking.canOpenURL(pdfUrl);
        if (supported) {
            await Linking.openURL(pdfUrl);
        } else {
            Alert.alert('Fehler', 'Das Dokument konnte nicht geöffnet werden.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#228be6" />
                <Text style={styles.loadingText}>Lade Dokumentdetails...</Text>
            </SafeAreaView>
        );
    }

    if (!document) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Dokument nicht gefunden.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <Text style={styles.typeTag}>{document.document_type}</Text>
                        <Text style={styles.dateText}>📅 {document.created}</Text>
                    </View>

                    <Text style={styles.title}>{document.title}</Text>

                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Absender / Korrespondent:</Text>
                        <Text style={styles.metaValue}>🏢 {document.correspondent}</Text>
                    </View>

                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Zugewiesene Tags:</Text>
                        <View style={styles.tagContainer}>
                            {document.tags.length > 0 ? (
                                document.tags.map((tag, index) => (
                                    <Text key={index} style={styles.tag}>#{tag}</Text>
                                ))
                            ) : (
                                <Text style={styles.noTagsText}>Keine Tags vorhanden</Text>
                            )}
                        </View>
                    </View>

                    {/* Button zum Anzeigen/Download des PDFs */}
                    <TouchableOpacity style={styles.pdfButton} onPress={handleOpenPdf}>
                        <Text style={styles.pdfButtonText}>📄 Original-PDF anzeigen / herunterladen</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' },
    scrollContent: { padding: 16 },
    card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeTag: { backgroundColor: '#e7f5ff', color: '#1971c2', fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    dateText: { fontSize: 13, color: '#6c757d' },
    title: { fontSize: 22, fontWeight: '700', color: '#212529', marginBottom: 20 },
    metaBox: { marginBottom: 16, borderTopWidth: 1, borderTopColor: '#f1f3f5', paddingTop: 12 },
    metaLabel: { fontSize: 13, color: '#adb5bd', marginBottom: 4, fontWeight: '500' },
    metaValue: { fontSize: 16, color: '#495057', fontWeight: '500' },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    tag: { backgroundColor: '#f8f9fa', color: '#868e96', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    noTagsText: { fontSize: 14, color: '#adb5bd', fontStyle: 'italic' },
    pdfButton: { backgroundColor: '#228be6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
    pdfButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
    loadingText: { marginTop: 10, color: '#6c757d', fontSize: 14 },
    errorText: { fontSize: 16, color: '#fa5252', fontWeight: '600' },
});