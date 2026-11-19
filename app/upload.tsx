import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
    uploadDocument,
    fetchCorrespondentsList, fetchTagsList, fetchStorageLocations,
    Correspondent, Tag, StorageLocation,
} from '../src/services/api';

export default function UploadScreen() {
    const router = useRouter();

    // file
    const [fileUri, setFileUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [fileMime, setFileMime] = useState('application/pdf');
    const [title, setTitle] = useState('');

    // metadata selections
    const [correspondentId, setCorrespondentId] = useState<number | null>(null);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [storagePathId, setStoragePathId] = useState<number | null>(null);

    // master data
    const [correspondents, setCorrespondents] = useState<Correspondent[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [storagePaths, setStoragePaths] = useState<StorageLocation[]>([]);
    const [masterDataLoading, setMasterDataLoading] = useState(true);
    const [masterDataError, setMasterDataError] = useState<string | null>(null);

    // upload
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetchCorrespondentsList(),
            fetchTagsList(),
            fetchStorageLocations(),
        ])
            .then(([c, t, s]) => {
                setCorrespondents(c);
                setTags(t);
                setStoragePaths(s);
            })
            .catch(() => setMasterDataError('Stammdaten konnten nicht geladen werden.'))
            .finally(() => setMasterDataLoading(false));
    }, []);

    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        const mime = asset.mimeType ?? '';
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowed.includes(mime) && !mime.startsWith('image/')) {
            setError('Nur PDF- und Bilddateien (JPEG, PNG) sind erlaubt.');
            return;
        }
        setFileUri(asset.uri);
        setFileName(asset.name);
        setFileMime(mime || 'application/pdf');
        setTitle(asset.name.replace(/\.(pdf|jpe?g|png)$/i, ''));
        setError(null);
    };

    const toggleTag = (id: number) => {
        setSelectedTagIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleUpload = async () => {
        if (!fileUri || !fileName) return;
        setUploading(true);
        setError(null);
        try {
            await uploadDocument(
                fileUri,
                fileName,
                fileMime,
                title || fileName,
                correspondentId,
                selectedTagIds,
                storagePathId,
            );
            Alert.alert('Erfolg', 'Dokument wurde hochgeladen.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e) {
            const raw = e instanceof Error ? e.message : String(e);
            const msg = raw.startsWith('HTTP')
                ? `Server-Fehler: ${raw}`
                : 'Netzwerkfehler – bitte Verbindung prüfen.';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* File picker */}
                <TouchableOpacity style={styles.pickButton} onPress={handlePickFile} activeOpacity={0.7}>
                    <Text style={styles.pickButtonText}>📎  PDF auswählen</Text>
                </TouchableOpacity>

                {fileUri && (
                    <>
                        <View style={styles.fileCard}>
                            <Text style={styles.fileCardLabel}>Ausgewählte Datei</Text>
                            <Text style={styles.fileCardName} numberOfLines={2}>{fileName}</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.fieldLabel}>Dokumenttitel</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Titel eingeben…"
                            placeholderTextColor="#adb5bd"
                            editable={!uploading}
                            returnKeyType="done"
                        />

                        {/* Master data */}
                        {masterDataLoading ? (
                            <View style={styles.mdLoading}>
                                <ActivityIndicator size="small" color="#228be6" />
                                <Text style={styles.mdLoadingText}>Stammdaten werden geladen…</Text>
                            </View>
                        ) : (
                            <>
                                {masterDataError && (
                                    <Text style={styles.mdErrorText}>{masterDataError} Upload ist trotzdem möglich.</Text>
                                )}

                                {/* Correspondent */}
                                {correspondents.length > 0 && (
                                    <>
                                        <Text style={styles.fieldLabel}>Absender (optional)</Text>
                                        <View style={styles.chipRow}>
                                            <TouchableOpacity
                                                style={[styles.chip, correspondentId === null && styles.chipSelected]}
                                                onPress={() => setCorrespondentId(null)}
                                            >
                                                <Text style={[styles.chipText, correspondentId === null && styles.chipTextSelected]}>Kein Absender</Text>
                                            </TouchableOpacity>
                                            {correspondents.map(c => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={[styles.chip, correspondentId === c.id && styles.chipSelected]}
                                                    onPress={() => setCorrespondentId(correspondentId === c.id ? null : c.id)}
                                                >
                                                    <Text style={[styles.chipText, correspondentId === c.id && styles.chipTextSelected]}>{c.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </>
                                )}

                                {/* Tags */}
                                {tags.length > 0 && (
                                    <>
                                        <Text style={styles.fieldLabel}>Tags (optional, Mehrfachauswahl)</Text>
                                        <View style={styles.chipRow}>
                                            {tags.map(t => {
                                                const selected = selectedTagIds.includes(t.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={t.id}
                                                        style={[styles.chip, selected && styles.chipSelected]}
                                                        onPress={() => toggleTag(t.id)}
                                                    >
                                                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>#{t.name}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </>
                                )}

                                {/* Storage path */}
                                {storagePaths.length > 0 && (
                                    <>
                                        <Text style={styles.fieldLabel}>Speicherort (optional)</Text>
                                        <View style={styles.chipRow}>
                                            <TouchableOpacity
                                                style={[styles.chip, storagePathId === null && styles.chipSelected]}
                                                onPress={() => setStoragePathId(null)}
                                            >
                                                <Text style={[styles.chipText, storagePathId === null && styles.chipTextSelected]}>Standard</Text>
                                            </TouchableOpacity>
                                            {storagePaths.map(s => (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    style={[styles.chip, storagePathId === s.id && styles.chipSelected]}
                                                    onPress={() => setStoragePathId(storagePathId === s.id ? null : s.id)}
                                                >
                                                    <Text style={[styles.chipText, storagePathId === s.id && styles.chipTextSelected]}>{s.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </>
                        )}

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                            onPress={handleUpload}
                            disabled={uploading}
                            activeOpacity={0.7}
                        >
                            {uploading
                                ? <ActivityIndicator size="small" color="#ffffff" />
                                : <Text style={styles.uploadButtonText}>Hochladen</Text>
                            }
                        </TouchableOpacity>
                    </>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    content: { padding: 20 },

    pickButton: {
        backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 48,
        alignItems: 'center', borderWidth: 2, borderColor: '#dee2e6', borderStyle: 'dashed',
    },
    pickButtonText: { fontSize: 16, color: '#228be6', fontWeight: '600' },

    fileCard: {
        marginTop: 20, backgroundColor: '#e7f5ff', borderRadius: 10,
        padding: 14, borderLeftWidth: 4, borderLeftColor: '#228be6',
    },
    fileCardLabel: { fontSize: 11, color: '#1971c2', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
    fileCardName: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },

    fieldLabel: { fontSize: 12, color: '#adb5bd', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
    input: {
        backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 14,
        paddingVertical: 11, fontSize: 15, color: '#212529',
        borderWidth: 1, borderColor: '#dee2e6',
    },

    mdLoading: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
    mdLoadingText: { fontSize: 14, color: '#6c757d' },
    mdErrorText: { marginTop: 12, fontSize: 13, color: '#fd7e14' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#f1f3f5', borderWidth: 1, borderColor: '#dee2e6',
    },
    chipSelected: { backgroundColor: '#228be6', borderColor: '#228be6' },
    chipText: { fontSize: 13, color: '#495057', fontWeight: '500' },
    chipTextSelected: { color: '#ffffff' },

    errorText: { marginTop: 12, fontSize: 14, color: '#fa5252' },

    uploadButton: {
        marginTop: 24, backgroundColor: '#228be6', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center',
    },
    uploadButtonDisabled: { backgroundColor: '#adb5bd' },
    uploadButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
