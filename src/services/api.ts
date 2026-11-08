// src/services/api.ts
import { Document } from '../data/mockDocuments';

const API_URL = process.env.EXPO_PUBLIC_PAPERLESS_URL || '';
const API_TOKEN = process.env.EXPO_PUBLIC_PAPERLESS_TOKEN || '';
export async function fetchPaperlessDocuments(): Promise<Document[]> {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': API_TOKEN,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Paperless liefert die Dokumente im Array "results" zurück.
        // Wir mappen sie auf unser bestehendes Document-Interface:
        return data.results.map((doc: any) => ({
            id: doc.id.toString(),
            title: doc.title || 'Ohne Titel',
            created: doc.created ? doc.created.split('T')[0] : 'Unbekannt',
            correspondent: doc.correspondent ? doc.correspondent.toString() : 'Kein Absender',
            document_type: doc.document_type ? doc.document_type.toString() : 'Standard',
            tags: doc.tags ? doc.tags.map((t: any) => t.toString()) : [],
        }));
    } catch (error) {
        console.error('Fehler beim Laden der Paperless-Dokumente:', error);
        return [];
    }
}