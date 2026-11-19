// src/services/api.ts

let _baseUrl = '';
let _token   = '';

export function setApiCredentials(url: string, token: string): void {
    _baseUrl = url;
    _token   = token;
}

export const getBaseUrl  = (): string => _baseUrl;
export const getApiToken = (): string => _token;

export interface Correspondent {
    id: number;
    name: string;
}

export interface Tag {
    id: number;
    name: string;
}

export interface DocumentType {
    id: number;
    name: string;
}

export interface StorageLocation {
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

export interface DocumentNote {
    id: number;
    note: string;
    created: string;
    user?: number | null;
}

export interface DocumentPatch {
    title?: string;
    created?: string;
    correspondent?: number | null;
    tags?: number[];
}

const getHeaders = () => ({
    'Authorization': `Token ${_token}`,
    'Content-Type': 'application/json',
});

async function fetchAll(url: string): Promise<any[]> {
    const results: any[] = [];
    let nextUrl: string | null = url;
    while (nextUrl) {
        const response: Response = await fetch(nextUrl, { method: 'GET', headers: getHeaders() });
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
            fetchAll(`${_baseUrl}/documents/`),
            fetchAll(`${_baseUrl}/correspondents/`),
            fetchAll(`${_baseUrl}/document_types/`),
            fetchAll(`${_baseUrl}/tags/`),
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
            fetch(`${_baseUrl}/documents/${id}/`, { method: 'GET', headers: getHeaders() }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }),
            fetchAll(`${_baseUrl}/correspondents/`),
            fetchAll(`${_baseUrl}/document_types/`),
            fetchAll(`${_baseUrl}/tags/`),
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
    const items = await fetchAll(`${_baseUrl}/correspondents/`);
    return items.map((c: any) => ({ id: c.id, name: c.name }));
}

export async function fetchTagsList(): Promise<Tag[]> {
    const items = await fetchAll(`${_baseUrl}/tags/`);
    return items.map((t: any) => ({ id: t.id, name: t.name }));
}

export async function fetchDocumentTypes(): Promise<DocumentType[]> {
    const items = await fetchAll(`${_baseUrl}/document_types/`);
    return items.map((d: any) => ({ id: d.id, name: d.name }));
}

export async function fetchStorageLocations(): Promise<StorageLocation[]> {
    const items = await fetchAll(`${_baseUrl}/storage_paths/`);
    return items.map((s: any) => ({ id: s.id, name: s.name }));
}

export async function createDocumentType(name: string): Promise<DocumentType> {
    const response = await fetch(`${_baseUrl}/document_types/`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { id: data.id, name: data.name };
}

export async function createStorageLocation(name: string): Promise<StorageLocation> {
    const response = await fetch(`${_baseUrl}/storage_paths/`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, path: name }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { id: data.id, name: data.name };
}

export async function createTag(name: string): Promise<Tag> {
    const response = await fetch(`${_baseUrl}/tags/`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { id: data.id, name: data.name };
}

export async function fetchDocumentNotes(documentId: number): Promise<DocumentNote[]> {
    const response = await fetch(`${_baseUrl}/documents/${documentId}/notes/`, { method: 'GET', headers: getHeaders() });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
}

export async function addDocumentNote(documentId: number, note: string): Promise<void> {
    const response = await fetch(`${_baseUrl}/documents/${documentId}/notes/`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export async function patchDocument(id: string, patch: DocumentPatch): Promise<void> {
    const response = await fetch(`${_baseUrl}/documents/${id}/`, {
        method: 'PATCH',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

export async function uploadDocument(
    uri: string,
    filename: string,
    mimeType: string,
    title?: string,
    correspondentId?: number | null,
    tagIds?: number[],
    storagePathId?: number | null,
): Promise<void> {
    // fetch() cannot handle { uri, name, type } FormData parts in React Native;
    // XMLHttpRequest does.
    return new Promise<void>((resolve, reject) => {
        const form = new FormData();
        form.append('document', { uri, name: filename, type: mimeType } as unknown as Blob);
        if (title?.trim()) form.append('title', title.trim());
        if (correspondentId != null) form.append('correspondent', String(correspondentId));
        if (storagePathId != null) form.append('storage_path', String(storagePathId));
        if (tagIds?.length) tagIds.forEach(id => form.append('tags', String(id)));

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${_baseUrl}/documents/post_document/`);
        xhr.setRequestHeader('Authorization', `Token ${_token}`);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`HTTP ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('network_error'));
        xhr.send(form);
    });
}
