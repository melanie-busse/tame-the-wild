import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, ListRenderItem, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Document } from '../src/data/mockDocuments';
import { fetchPaperlessDocuments } from '../src/services/api';

export default function HomeScreen() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Echte Dokumente von der Paperless-API beim Start laden
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const docs = await fetchPaperlessDocuments();
            setDocuments(docs);
            setLoading(false);
        }
        loadData();
    }, []);

    // Kategorien / Typen dynamisch aus den echten Dokumenten ermitteln
    const categories = ['Alle', ...Array.from(new Set(documents.map((doc) => doc.document_type)))];

    // Dokumente filtern nach Suchbegriff und gewähltem Typ
    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch =
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.correspondent.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory && selectedCategory !== 'Alle'
            ? doc.document_type === selectedCategory
            : true;

        return matchesSearch && matchesCategory;
    });

    const renderDocumentItem: ListRenderItem<Document> = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/document/${item.id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.typeTag}>{item.document_type}</Text>
            </View>

            <View style={styles.metaContainer}>
                <Text style={styles.subtext}>🏢 {item.correspondent}</Text>
                <Text style={styles.subtext}>📅 {item.created}</Text>
            </View>

            <View style={styles.tagContainer}>
                {item.tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>#{tag}</Text>
                ))}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />

            {/* Header mit Westie-Logo links */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTopRow}>
                    <View style={styles.headerLeftGroup}>
                        <View style={styles.logoBadge}>
                            <Image
                                source={require('../assets/images/westie-logo.png')}
                                style={styles.logoImage}
                            />
                        </View>
                        <Text style={styles.headerTitle}>TameTheWild</Text>
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>
                    {loading ? 'Lade Dokumente vom Server...' : `${documents.length} Dokumente vom Server geladen`}
                </Text>
            </View>

            {/* Suchleiste */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Suche nach Titel, Absender, Tags..."
                    placeholderTextColor="#adb5bd"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={categories}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.chipList}
                    renderItem={({ item }) => {
                        const isSelected = selectedCategory === item || (item === 'Alle' && !selectedCategory);
                        return (
                            <TouchableOpacity
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{item}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Dokumentenliste */}
            <FlatList
                data={filteredDocuments}
                renderItem={renderDocumentItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? 'Verbindung zu Paperless wird aufgebaut...' : 'Keine passenden Dokumente gefunden.'}
                    </Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6f8' },
    headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#ffffff' },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeftGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
    logoBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e7f5ff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    logoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerSubtitle: { fontSize: 14, color: '#6c757d', marginTop: 2, marginLeft: 50 },

    searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#ffffff' },
    searchInput: { backgroundColor: '#f1f3f5', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, fontSize: 15, color: '#212529' },

    filterContainer: { backgroundColor: '#ffffff', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
    chipList: { paddingHorizontal: 16, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f3f5', marginRight: 8 },
    chipSelected: { backgroundColor: '#228be6' },
    chipText: { fontSize: 13, color: '#495057', fontWeight: '500' },
    chipTextSelected: { color: '#ffffff' },

    listContainer: { padding: 16 },
    card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 16, fontWeight: '600', color: '#212529', flex: 1, marginRight: 8 },
    typeTag: { backgroundColor: '#e7f5ff', color: '#1971c2', fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    subtext: { fontSize: 13, color: '#6c757d' },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    tag: { backgroundColor: '#f8f9fa', color: '#868e96', fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    emptyText: { textAlign: 'center', color: '#adb5bd', marginTop: 40, fontSize: 15 },
});