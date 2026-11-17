import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, ActivityIndicator, ScrollView,
    TouchableOpacity, Alert, Modal, Dimensions, Platform,
    Image as RNImage,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import Pdf from 'react-native-pdf';
import { Document, fetchDocumentById, BASE_URL, API_TOKEN } from '../../src/services/api';

function isImageMime(mimeType?: string): boolean {
    return !!mimeType && mimeType.startsWith('image/');
}
import EditDocumentModal, { SavedFields } from '../../components/EditDocumentModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DocumentDetailScreen() {
    const { id } = useLocalSearchParams();
    const docId = (Array.isArray(id) ? id[0] : id) ?? '';

    const [document, setDocument] = useState<Document | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState<string | null>(null);
    const [pdfUri, setPdfUri] = useState<string | null>(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const doc = await fetchDocumentById(docId);
                setDocument(doc);
            } catch (error) {
                console.error('Fehler beim Laden des Dokuments:', error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [docId]);

    const handleThumbnailPress = async () => {
        const isImage = isImageMime(document?.mime_type);
        const mime = document?.mime_type ?? '';
        const ext = isImage
            ? (mime.includes('png') ? 'png' : mime.includes('gif') ? 'gif' : 'jpg')
            : 'pdf';
        const localPath = `${FileSystem.cacheDirectory ?? ''}doc_${docId}.${ext}`;

        setViewerVisible(true);
        setViewerUri(null);
        setPdfUri(null);
        setPdfDownloading(true);

        try {
            const info = await FileSystem.getInfoAsync(localPath);
            const downloadUrl = isImage
                ? `${BASE_URL}/documents/${docId}/download/?original=true`
                : `${BASE_URL}/documents/${docId}/download/`;
            const uri = info.exists
                ? localPath
                : (await FileSystem.downloadAsync(
                    downloadUrl,
                    localPath,
                    { headers: { Authorization: API_TOKEN } }
                )).uri;

            if (isImage) {
                setViewerUri(uri);
            } else {
                setPdfUri(uri);
            }
        } catch (e) {
            Alert.alert('Fehler', 'Dokument konnte nicht geladen werden.');
            setViewerVisible(false);
        } finally {
            setPdfDownloading(false);
        }
    };

    const handleSaved = (fields: SavedFields) => {
        setDocument(prev => prev ? {
            ...prev,
            title: fields.title,
            created: fields.created,
            correspondent: fields.correspondent,
            correspondentId: fields.correspondentId,
            tags: fields.tags,
            tagIds: fields.tagIds,
        } : prev);
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

    const thumbnailUrl = `${BASE_URL}/documents/${docId}/thumb/`;

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>

                    {/* Header: Typ + Datum + Bearbeiten-Button */}
                    <View style={styles.headerRow}>
                        <Text style={styles.typeTag}>{document.document_type}</Text>
                        <View style={styles.headerRight}>
                            <Text style={styles.dateText}>📅 {document.created}</Text>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => setEditModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.editButtonText}>✏️ Bearbeiten</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Titel */}
                    <Text style={styles.title}>{document.title}</Text>

                    {/* Thumbnail-Vorschau */}
                    <TouchableOpacity
                        style={styles.thumbnailContainer}
                        onPress={handleThumbnailPress}
                        activeOpacity={0.85}
                    >
                        <Image
                            source={{ uri: thumbnailUrl, headers: { Authorization: API_TOKEN } }}
                            style={styles.thumbnail}
                            contentFit="contain"
                            transition={200}
                        />
                        <View style={styles.thumbnailOverlay}>
                            <Text style={styles.thumbnailOverlayText}>📄 Tippen für Vollbild-PDF</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Metadaten */}
                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Absender / Korrespondent</Text>
                        <Text style={styles.metaValue}>🏢 {document.correspondent}</Text>
                    </View>

                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Zugewiesene Tags</Text>
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

                    {/* OCR-Text */}
                    {!!document.content && (
                        <View style={styles.ocrSection}>
                            <Text style={styles.metaLabel}>OCR-Text</Text>
                            <ScrollView
                                style={styles.ocrScroll}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator
                            >
                                <Text selectable style={styles.ocrText}>
                                    {document.content}
                                </Text>
                            </ScrollView>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Vollbild-Viewer-Modal (PDF oder Bild) */}
            <Modal
                visible={viewerVisible}
                animationType="slide"
                onRequestClose={() => setViewerVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setViewerVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>✕  Schließen</Text>
                    </TouchableOpacity>

                    {pdfDownloading || (!viewerUri && !pdfUri) ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#228be6" />
                            <Text style={styles.loadingText}>Dokument wird geladen…</Text>
                        </View>
                    ) : isImageMime(document.mime_type) && viewerUri ? (
                        <ScrollView
                            style={styles.imageScrollView}
                            contentContainerStyle={styles.imageScrollContent}
                            maximumZoomScale={5}
                            minimumZoomScale={1}
                            centerContent
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        >
                            <RNImage
                                source={{ uri: viewerUri }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        </ScrollView>
                    ) : pdfUri ? (
                        <Pdf
                            source={{ uri: pdfUri, cache: false }}
                            style={styles.pdf}
                            trustAllCerts={Platform.OS === 'ios'}
                            onError={(error) => {
                                console.error('PDF-Fehler:', error);
                                Alert.alert('Fehler', 'PDF konnte nicht angezeigt werden.');
                                setViewerVisible(false);
                            }}
                        />
                    ) : null}
                </SafeAreaView>
            </Modal>

            {/* Metadaten-Bearbeiten-Modal */}
            <EditDocumentModal
                visible={editModalVisible}
                document={document}
                onClose={() => setEditModalVisible(false)}
                onSaved={handleSaved}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' },
    scrollContent: { padding: 16 },
    card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    headerRight: { alignItems: 'flex-end', gap: 6 },
    typeTag: { backgroundColor: '#e7f5ff', color: '#1971c2', fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    dateText: { fontSize: 13, color: '#6c757d' },
    editButton: { backgroundColor: '#f1f3f5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    editButtonText: { fontSize: 13, color: '#495057', fontWeight: '500' },
    title: { fontSize: 22, fontWeight: '700', color: '#212529', marginBottom: 16 },

    thumbnailContainer: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#f1f3f5', marginBottom: 20 },
    thumbnail: { width: '100%', height: 220 },
    thumbnailOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, alignItems: 'center' },
    thumbnailOverlayText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },

    metaBox: { marginBottom: 16, borderTopWidth: 1, borderTopColor: '#f1f3f5', paddingTop: 12 },
    metaLabel: { fontSize: 12, color: '#adb5bd', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    metaValue: { fontSize: 16, color: '#495057', fontWeight: '500' },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    tag: { backgroundColor: '#f8f9fa', color: '#868e96', fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    noTagsText: { fontSize: 14, color: '#adb5bd', fontStyle: 'italic' },

    ocrSection: { borderTopWidth: 1, borderTopColor: '#f1f3f5', paddingTop: 12, marginTop: 4 },
    ocrScroll: { maxHeight: 220, backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginTop: 6 },
    ocrText: { fontSize: 13, color: '#495057', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

    loadingText: { marginTop: 10, color: '#6c757d', fontSize: 14 },
    errorText: { fontSize: 16, color: '#fa5252', fontWeight: '600' },

    modalContainer: { flex: 1, backgroundColor: '#1a1a1a' },
    closeButton: { paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'flex-start' },
    closeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    pdf: { flex: 1, width: SCREEN_WIDTH, backgroundColor: '#1a1a1a' },
    imageScrollView: { flex: 1 },
    imageScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.4, backgroundColor: '#1a1a1a' },
});
