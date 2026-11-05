# Paperless Mobile (Expo App)

Eine mobile React Native / Expo Anwendung zur Anbindung an ein bestehendes [Paperless-ngx](https://docs.paperless-ngx.com/) Dokumentenmanagementsystem.

---

## 🎯 Projektziel
Ziel des Projekts ist die Erstellung einer benutzerfreundlichen, performanten mobilen App für iOS und Android, mit der Dokumente aus Paperless-ngx unterwegs durchsucht, angesehen, hochgeladen und verwaltet werden können.

---

## 🛠 Tech-Stack

- **Framework:** React Native mit [Expo](https://expo.dev/)
- **UI & Layout:** React Native Components, Flexbox, React Native Paper (optional)
- **Navigation:** React Navigation (Stack & Tabs) *(geplant)*
- **State Management / Data Fetching:** React Hooks (`useState`, `useEffect`), Fetch API / Axios *(geplant)*
- **Backend API:** Paperless-ngx REST-API

---

## 🚀 Funktionsumfang & Roadmap

### Phase 1: MVP & UI-Grundgerüst (Aktueller Stand)
- [x] Initiales Expo-Projekt aufsetzen
- [ ] Anzeige der Dokumentenliste mit Mock-Daten (`FlatList`)
- [ ] Such- und Filterleiste (Dummy UI)
- [ ] Detailansicht für ein ausgewähltes Dokument (Vorschau von Metadaten)

### Phase 2: Authentifizierung & API-Anbindung
- [ ] Login-Screen zur Eingabe von Server-URL und API-Token
- [ ] Sichere Speicherung der Zugangsdaten (`expo-secure-store`)
- [ ] Live-Datenabruf aus Paperless-ngx (`GET /api/documents/`)
- [ ] Serverbasierte Suche & Pagination der Dokumente

### Phase 3: Dokumentenverwaltung & PDF-Vorschau
- [ ] Anzeige von OCR-Texten und PDF-Dateien (`react-native-pdf` oder WebView)
- [ ] Bearbeiten von Metadaten (Titel, Datum, Tags, Korrespondenten)
- [ ] Stammdatenansicht (Tags, Dokumententypen, Speicherorte)

### Phase 4: Erfassung & Upload (Mobile Features)
- [ ] Integration der Kamera zum Scannen von Dokumenten (`expo-camera` / Document Scanner)
- [ ] Automatische Zuschnitt- und Bildoptimierung
- [ ] Upload-Funktion (`POST /api/documents/post_document/`)
- [ ] Teilen-Funktionsintegration (PDFs aus anderen Apps direkt in Paperless öffnen)

---

## 📂 Projektstruktur (Geplant)

```text
├── assets/             # Bilder, Fonts & Statische Dateien
├── src/
│   ├── api/            # Paperless API Client & Token Management
│   ├── components/     # Wiederverwendbare UI-Komponenten (Card, Tag, Button)
│   ├── screens/        # Hauptseiten (HomeScreen, DetailScreen, UploadScreen, LoginScreen)
│   ├── navigation/     # React Navigation Setup
│   └── mock/           # Testdaten für die Offline-Entwicklung
├── App.js              # Einstiegspunkt der Anwendung
├── README.md           # Projektplanung & Dokumentation
└── package.json
```

---

## 🏃‍♂️ Schnellstart (Entwicklung)

1. **Repository klonen & Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npx expo start
   ```

3. App über die **Expo Go** App scannen oder im Simulator/Emulator ausführen.