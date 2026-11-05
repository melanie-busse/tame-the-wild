export interface Document {
    id: string;
    title: string;
    created: string;
    correspondent: string;
    document_type: string;
    tags: string[];
}

export const MOCK_DOCUMENTS: Document[] = [
    {
        id: '1',
        title: 'Rechnung Stromanbieter 2026',
        created: '2026-03-01',
        correspondent: 'Stadtwerke',
        document_type: 'Rechnung',
        tags: ['Finanzen', 'Wichtig'],
    },
    {
        id: '2',
        title: 'Kfz-Versicherung Police',
        created: '2026-02-15',
        correspondent: 'HUK Coburg',
        document_type: 'Vertrag',
        tags: ['Auto', 'Versicherung'],
    },
    {
        id: '3',
        title: 'Gehaltsabrechnung Februar',
        created: '2026-02-28',
        correspondent: 'Arbeitgeber GmbH',
        document_type: 'Gehalt',
        tags: ['Arbeit', 'Finanzen'],
    },
];