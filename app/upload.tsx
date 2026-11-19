import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput,
    TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocument } from '../src/services/api';

export default function UploadScreen() {
    const router = useRouter();
    const [fileUri, setFileUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePickFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        setTitle(asset.name.replace(/\.pdf$/i, ''));
        setError(null);
    };

    const handleUpload = async () => {
        if (!fileUri || !fileName) return;
        setUploading(true);
        setError(null);
        try {
            await uploadDocument(fileUri, fileName, title || fileName);
            Alert.alert('Erfolg', 'Dokument wurde hochgeladen.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e) {
            const raw = e instanceof Error ? e.message : String(e);
            const msg = raw.startsWith('HTTP')
                ? `Server-Fehler: ${raw}`
                : `Fehler: ${raw}`;
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                <TouchableOpacity style={styles.pickButton} onPress={handlePickFile} activeOpacity={0.7}>
                    <Text style={styles.pickButtonText}>📎  PDF auswählen</Text>
                </TouchableOpacity>

                {fileUri && (
                    <>
                        <View style={styles.fileCard}>
                            <Text style={styles.fileCardLabel}>Ausgewählte Datei</Text>
                            <Text style={styles.fileCardName} numberOfLines={2}>{fileName}</Text>
                        </View>

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

    fieldLabel: { fontSize: 12, color: '#adb5bd', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 6 },
    input: {
        backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 14,
        paddingVertical: 11, fontSize: 15, color: '#212529',
        borderWidth: 1, borderColor: '#dee2e6',
    },

    errorText: { marginTop: 12, fontSize: 14, color: '#fa5252' },

    uploadButton: {
        marginTop: 24, backgroundColor: '#228be6', borderRadius: 10,
        paddingVertical: 14, alignItems: 'center',
    },
    uploadButtonDisabled: { backgroundColor: '#adb5bd' },
    uploadButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
