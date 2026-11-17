import React, { useEffect, useState } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Document, Correspondent, Tag,
    fetchCorrespondentsList, fetchTagsList, patchDocument, createTag,
} from '../src/services/api';

export interface SavedFields {
    title: string;
    created: string;
    correspondent: string;
    correspondentId: number | null;
    tags: string[];
    tagIds: number[];
}

interface Props {
    visible: boolean;
    document: Document;
    onClose: () => void;
    onSaved: (fields: SavedFields) => void;
}

export default function EditDocumentModal({ visible, document, onClose, onSaved }: Props) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [correspondentId, setCorrespondentId] = useState<number | null>(null);
    const [tagIds, setTagIds] = useState<number[]>([]);

    const [correspondents, setCorrespondents] = useState<Correspondent[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [creatingTag, setCreatingTag] = useState(false);

    useEffect(() => {
        if (!visible) return;

        setTitle(document.title);
        setDate(document.created);
        setCorrespondentId(document.correspondentId ?? null);
        setTagIds(document.tagIds ?? []);

        setLoading(true);
        Promise.all([fetchCorrespondentsList(), fetchTagsList()])
            .then(([corrs, tgs]) => {
                setCorrespondents(corrs);
                setAvailableTags(tgs);
            })
            .catch(() => Alert.alert('Fehler', 'Optionen konnten nicht geladen werden.'))
            .finally(() => setLoading(false));
    }, [visible]);

    const handleCreateTag = async () => {
        const name = newTagName.trim();
        if (!name) return;
        setCreatingTag(true);
        try {
            const newTag = await createTag(name);
            setAvailableTags(prev => [...prev, newTag]);
            setTagIds(prev => [...prev, newTag.id]);
            setNewTagName('');
        } catch {
            Alert.alert('Fehler', `Tag „${name}" konnte nicht angelegt werden.`);
        } finally {
            setCreatingTag(false);
        }
    };

    const toggleTag = (id: number) => {
        setTagIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await patchDocument(document.id, {
                title,
                created: date,
                correspondent: correspondentId,
                tags: tagIds,
            });
            onSaved({
                title,
                created: date,
                correspondent: correspondents.find(c => c.id === correspondentId)?.name ?? 'Kein Absender',
                correspondentId,
                tags: availableTags.filter(t => tagIds.includes(t.id)).map(t => t.name),
                tagIds,
            });
            onClose();
        } catch {
            Alert.alert('Fehler', 'Speichern fehlgeschlagen. Bitte prüfe die Verbindung.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} disabled={saving}>
                        <Text style={styles.cancelText}>Abbrechen</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Metadaten bearbeiten</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving || loading}>
                        {saving
                            ? <ActivityIndicator size="small" color="#228be6" />
                            : <Text style={[styles.saveText, (loading) && styles.disabledText]}>Speichern</Text>
                        }
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    {/* Titel */}
                    <Text style={styles.label}>Titel</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Dokumenttitel"
                        placeholderTextColor="#adb5bd"
                    />

                    {/* Datum */}
                    <Text style={styles.label}>Datum (JJJJ-MM-TT)</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="2024-01-15"
                        placeholderTextColor="#adb5bd"
                        keyboardType="numbers-and-punctuation"
                    />

                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator color="#228be6" />
                            <Text style={styles.loadingText}>Lade Optionen…</Text>
                        </View>
                    ) : (
                        <>
                            {/* Korrespondent — Einzel-Auswahl */}
                            <Text style={styles.label}>Korrespondent</Text>
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, correspondentId === null && styles.chipSelected]}
                                    onPress={() => setCorrespondentId(null)}
                                >
                                    <Text style={[styles.chipText, correspondentId === null && styles.chipTextSelected]}>
                                        Keiner
                                    </Text>
                                </TouchableOpacity>
                                {correspondents.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.chip, correspondentId === c.id && styles.chipSelected]}
                                        onPress={() => setCorrespondentId(c.id)}
                                    >
                                        <Text style={[styles.chipText, correspondentId === c.id && styles.chipTextSelected]}>
                                            {c.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Tags — Multi-Auswahl */}
                            <Text style={styles.label}>Tags</Text>
                            {availableTags.length > 0 && (
                                <View style={styles.chipRow}>
                                    {availableTags.map(t => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[styles.chip, tagIds.includes(t.id) && styles.chipSelected]}
                                            onPress={() => toggleTag(t.id)}
                                        >
                                            <Text style={[styles.chipText, tagIds.includes(t.id) && styles.chipTextSelected]}>
                                                #{t.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Neues Tag anlegen */}
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
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e9ecef',
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#212529' },
    cancelText: { fontSize: 15, color: '#868e96' },
    saveText: { fontSize: 15, color: '#228be6', fontWeight: '600' },
    disabledText: { color: '#adb5bd' },
    content: { padding: 16, paddingBottom: 40 },
    label: {
        fontSize: 12, color: '#adb5bd', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginTop: 20, marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 12,
        paddingVertical: 11, fontSize: 15, color: '#212529',
        borderWidth: 1, borderColor: '#dee2e6',
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#f1f3f5', borderWidth: 1, borderColor: '#dee2e6',
    },
    chipSelected: { backgroundColor: '#228be6', borderColor: '#228be6' },
    chipText: { fontSize: 13, color: '#495057', fontWeight: '500' },
    chipTextSelected: { color: '#ffffff' },
    loadingBox: { alignItems: 'center', marginTop: 32, gap: 8 },
    loadingText: { fontSize: 14, color: '#6c757d' },
    emptyText: { fontSize: 14, color: '#adb5bd', fontStyle: 'italic' },
    newTagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
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
});
