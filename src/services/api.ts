// src/services/api.ts

export const BASE_URL = (process.env.EXPO_PUBLIC_PAPERLESS_URL || '').replace(/\/documents\/?$/, '');
export const API_TOKEN = process.env.EXPO_PUBLIC_PAPERLESS_TOKEN || '';

export interface Correspondent {
    id: number;
    name: string;
}

export interface Tag {
    id: number;
    name: string;
}

export interface Document {
    id: string;
    title: string;
    created: string;
    correspondent: string;
    correspondentId?: number | null;
    document_type: string;
    tags: string[];
    tagIds?: number[];
    content?: string;
    mime_type?: string;
}

export interface DocumentPatch {
    title?: string;
    created?: string;
    correspondent?: number | null;
    tags?: number[];
}

const headers = {
    'Authorization': API_TOKEN,
    'Content-Type': 'application/json',
};

async function fetchAll(url: string): Promise<any[]> {
    const results: any[] = [];
    let nextUrl: string | null = url;
    while (nextUrl) {
        const response: Response = await fetch(nextUrl, { method: 'GET', headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: { results: any[]; next: string | null } = await response.json();
        results.push(...data.results);
        nextUrl = data.next ?? null;
    }
    return results;
}

function buildLookup(items: any[]): Record<number, string> {
    const map: Record<number, string> = {};
    for (const item of items) {
        map[item.id] = item.name;
    }
    return map;
}

export async function fetchPaperlessDocuments(): Promise<Document[]> {
    try {
        const [docs, correspondents, documentTypes, tags] = await Promise.all([
            fetchAll(`${BASE_URL}/documents/`),
            fetchAll(`${BASE_URL}/correspondents/`),
            fetchAll(`${BASE_URL}/document_types/`),
            fetchAll(`${BASE_URL}/tags/`),
        ]);

        const correspondentMap = buildLookup(correspondents);
        const documentTypeMap = buildLookup(documentTypes);
        const tagMap = buildLookup(tags);

        return docs.map((doc: any) => ({
            id: doc.id.toString(),
            title: doc.title || 'Untitled',
            created: doc.created ? doc.created.split('T')[0] : 'Unknown',
            correspondent: doc.correspondent ? (correspondentMap[doc.correspondent] ?? doc.correspondent.toString()) : 'No correspondent',
            document_type: doc.document_type ? (documentTypeMap[doc.document_type] ?? doc.document_type.toString()) : 'Default',
            tags: doc.tags ? doc.tags.map((t: number) => tagMap[t] ?? t.toString()) : [],
        }));
    } catch (error) {
        console.error('Error loading Paperless documents:', error);
        return [];
    }
}

export async function fetchDocumentById(id: string): Promise<Document | null> {
    try {
        const [doc, correspondents, documentTypes, tags] = await Promise.all([
            fetch(`${BASE_URL}/documents/${id}/`, { method: 'GET', headers }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }),
            fetchAll(`${BASE_URL}/correspondents/`),
            fetchAll(`${BASE_URL}/document_types/`),
            fetchAll(`${BASE_URL}/tags/`),
        ]);

        const correspondentMap = buildLookup(correspondents);
        const documentTypeMap = buildLookup(documentTypes);
        const tagMap = buildLookup(tags);

        return {
            id: doc.id.toString(),
            title: doc.title || 'Untitled',
            created: doc.created ? doc.created.split('T')[0] : 'Unknown',
            correspondent: doc.correspondent ? (correspondentMap[doc.correspondent] ?? doc.correspondent.toString()) : 'Kein Absender',
            correspondentId: doc.correspondent ?? null,
            document_type: doc.document_type ? (documentTypeMap[doc.document_type] ?? doc.document_type.toString()) : 'Standard',
            tags: doc.tags ? doc.tags.map((t: number) => tagMap[t] ?? t.toString()) : [],
            tagIds: doc.tags ?? [],
            content: doc.content || '',
            mime_type: doc.mime_type ?? '',
        };
    } catch (error) {
        console.error('Error loading document by ID:', error);
        return null;
    }
}

export async function fetchCorrespondentsList(): Promise<Correspondent[]> {
    const items = await fetchAll(`${BASE_URL}/correspondents/`);
    return items.map((c: any) => ({ id: c.id, name: c.name }));
}

export async function fetchTagsList(): Promise<Tag[]> {
    const items = await fetchAll(`${BASE_URL}/tags/`);
    return items.map((t: any) => ({ id: t.id, name: t.name }));
}

export async function createTag(name: string): Promise<Tag> {
    const response = await fetch(`${BASE_URL}/tags/`, {
        method: 'POST',
        headers: { Authorization: API_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { id: data.id, name: data.name };
}

export async function patchDocument(id: string, patch: DocumentPatch): Promise<void> {
    const response = await fetch(`${BASE_URL}/documents/${id}/`, {
        method: 'PATCH',
        headers: { Authorization: API_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}
