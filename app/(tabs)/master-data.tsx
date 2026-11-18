import React, { useState, useCallback } from 'react';
import {
    StyleSheet, Text, View, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
    Tag, DocumentType, StorageLocation,
    fetchTagsList, fetchDocumentTypes, fetchStorageLocations,
    createTag, createDocumentType, createStorageLocation,
} from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function MasterDataScreen() {
    const auth = useAuth();
    const [tags, setTags] = useState<Tag[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newTagName, setNewTagName] = useState('');
    const [creatingTag, setCreatingTag] = useState(false);
    const [newDocTypeName, setNewDocTypeName] = useState('');
    const [creatingDocType, setCreatingDocType] = useState(false);
    const [newStorageName, setNewStorageName] = useState('');
    const [creatingStorage, setCreatingStorage] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            setLoading(true);
            setError(null);
            Promise.all([fetchTagsList(), fetchDocumentTypes(), fetchStorageLocations()])
                .then(([t, dt, sl]) => {
                    if (!active) return;
                    setTags(t);
                    setDocumentTypes(dt);
                    setStorageLocations(sl);
                })
                .catch(() => {
                    if (!active) return;
                    setError('Daten konnten nicht geladen werden. Bitte Verbindung prüfen.');
                })
                .finally(() => {
                    if (!active) return;
                    setLoading(false);
                });
            return () => { active = false; };
        }, [])
    );

    const handleCreateTag = async () => {
        const name = newTagName.trim();
        if (!name) return;
        setCreatingTag(true);
        try {
            const newTag = await createTag(name);
            setTags(prev => [...prev, newTag]);
            setNewTagName('');
        } catch {
            Alert.alert('Fehler', `Tag „${name}" konnte nicht angelegt werden.`);
        } finally {
            setCreatingTag(false);
        }
    };

    const handleCreateDocType = async () => {
        const name = newDocTypeName.trim();
        if (!name) return;
        setCreatingDocType(true);
        try {
            const newItem = await createDocumentType(name);
            setDocumentTypes(prev => [...prev, newItem]);
            setNewDocTypeName('');
        } catch {
            Alert.alert('Fehler', `Dokumententyp „${name}" konnte nicht angelegt werden.`);
        } finally {
            setCreatingDocType(false);
        }
    };

    const handleCreateStorage = async () => {
        const name = newStorageName.trim();
        if (!name) return;
        setCreatingStorage(true);
        try {
            const newItem = await createStorageLocation(name);
            setStorageLocations(prev => [...prev, newItem]);
            setNewStorageName('');
        } catch {
            Alert.alert('Fehler', `Speicherort „${name}" konnte nicht angelegt werden.`);
        } finally {
            setCreatingStorage(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#228be6" />
                    <Text style={styles.loadingText}>Lade Stammdaten…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Tags */}
                <Text style={styles.sectionLabel}>Tags</Text>

                {tags.length > 0 ? (
                    <View style={styles.chipRow}>
                        {tags.map(t => (
                            <View key={t.id} style={styles.chip}>
                                <Text style={styles.chipText}>#{t.name}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>Keine Einträge vorhanden</Text>
                )}

                <View style={styles.newTagRow}>
                    <TextInput
                        style={styles.newTagInput}
                        value={newTagName}
                        onChangeText={setNewTagName}
                        placeholder="Neues Tag hinzufügen…"
                        placeholderTextColor="#adb5bd"
                        onSubmitEditing={handleCreateTag}
                        returnKeyType="done"
                        editable={!creatingTag}
                    />
                    <TouchableOpacity
                        style={[styles.newTagButton, (!newTagName.trim() || creatingTag) && styles.newTagButtonDisabled]}
                        onPress={handleCreateTag}
                        disabled={!newTagName.trim() || creatingTag}
                    >
                        {creatingTag
                            ? <ActivityIndicator size="small" color="#ffffff" />
                            : <Text style={styles.newTagButtonText}>+</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Dokumententypen */}
                <Text style={styles.sectionLabel}>Dokumententypen</Text>
                {documentTypes.length > 0 ? (
                    documentTypes.map(dt => (
                        <View key={dt.id} style={styles.row}>
                            <Text style={styles.rowText}>{dt.name}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Keine Einträge vorhanden</Text>
                )}
                <View style={styles.newTagRow}>
                    <TextInput
                        style={styles.newTagInput}
                        value={newDocTypeName}
                        onChangeText={setNewDocTypeName}
                        placeholder="Neuer Dokumententyp hinzufügen…"
                        placeholderTextColor="#adb5bd"
                        onSubmitEditing={handleCreateDocType}
                        returnKeyType="done"
                        editable={!creatingDocType}
                    />
                    <TouchableOpacity
                        style={[styles.newTagButton, (!newDocTypeName.trim() || creatingDocType) && styles.newTagButtonDisabled]}
                        onPress={handleCreateDocType}
                        disabled={!newDocTypeName.trim() || creatingDocType}
                    >
                        {creatingDocType
                            ? <ActivityIndicator size="small" color="#ffffff" />
                            : <Text style={styles.newTagButtonText}>+</Text>
                        }
                    </TouchableOpacity>
                </View>

                {/* Speicherorte */}
                <Text style={styles.sectionLabel}>Speicherorte</Text>
                {storageLocations.length > 0 ? (
                    storageLocations.map(sl => (
                        <View key={sl.id} style={styles.row}>
                            <Text style={styles.rowText}>{sl.name}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Keine Einträge vorhanden</Text>
                )}
                <View style={styles.newTagRow}>
                    <TextInput
                        style={styles.newTagInput}
                        value={newStorageName}
                        onChangeText={setNewStorageName}
                        placeholder="Neuer Speicherort hinzufügen…"
                        placeholderTextColor="#adb5bd"
                        onSubmitEditing={handleCreateStorage}
                        returnKeyType="done"
                        editable={!creatingStorage}
                    />
                    <TouchableOpacity
                        style={[styles.newTagButton, (!newStorageName.trim() || creatingStorage) && styles.newTagButtonDisabled]}
                        onPress={handleCreateStorage}
                        disabled={!newStorageName.trim() || creatingStorage}
                    >
                        {creatingStorage
                            ? <ActivityIndicator size="small" color="#ffffff" />
                            : <Text style={styles.newTagButtonText}>+</Text>
                        }
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={auth.logout} activeOpacity={0.7}>
                    <Text style={styles.logoutText}>Abmelden</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    loadingText: { marginTop: 10, fontSize: 14, color: '#6c757d' },
    errorText: { fontSize: 14, color: '#fa5252', textAlign: 'center' },
    sectionLabel: {
        fontSize: 12, color: '#adb5bd', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginTop: 24, marginBottom: 10,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#f1f3f5', borderWidth: 1, borderColor: '#dee2e6',
    },
    chipText: { fontSize: 13, color: '#495057', fontWeight: '500' },
    emptyText: { fontSize: 14, color: '#adb5bd', fontStyle: 'italic' },
    newTagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    newTagInput: {
        flex: 1, backgroundColor: '#ffffff', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 9, fontSize: 14,
        color: '#212529', borderWidth: 1, borderColor: '#dee2e6',
    },
    newTagButton: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#228be6', justifyContent: 'center', alignItems: 'center',
    },
    newTagButtonDisabled: { backgroundColor: '#adb5bd' },
    newTagButtonText: { color: '#ffffff', fontSize: 22, lineHeight: 26, fontWeight: '400' },
    row: {
        backgroundColor: '#ffffff', borderRadius: 10, paddingHorizontal: 14,
        paddingVertical: 11, marginBottom: 6,
        borderLeftWidth: 3, borderLeftColor: '#e7f5ff',
    },
    rowText: { fontSize: 15, color: '#495057' },
    logoutButton: { marginTop: 32, alignItems: 'center', paddingVertical: 12 },
    logoutText: { color: '#fa5252', fontSize: 15, fontWeight: '600' },
});
