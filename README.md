# Tabata Timer

Minimalistischer Tabata & HIIT Timer als Progressive Web App (PWA).

## Features

- Vollständig offline nutzbar nach erstem Laden
- Konfigurierbare Exercise-/Pause-/Warm-up-/Cooldown-Zeiten und Sets/Zyklen
- Farbkodierte Phasen mit doppelten SVG-Ringen
- Synthetische Sounds via Web Audio API (keine Audio-Dateien)
- Installierbar auf iPhone und Android

---

## Installation auf dem iPhone

1. Öffne `index.html` in **Safari** (lokal oder via Hosting, s.u.)
2. Tippe auf das **Teilen-Symbol** (⬆ unten in der Mitte)
3. Wähle **„Zum Home-Bildschirm"**
4. Die App erscheint wie eine native App – ohne Browser-UI

> **Hinweis:** Safari ist erforderlich. Chrome/Firefox auf iOS unterstützen kein PWA-Installieren.

---

## Installation auf Android

1. Öffne die URL in **Chrome**
2. Tippe auf das **Dreipunkt-Menü (⋮)** oben rechts
3. Wähle **„Zum Startbildschirm hinzufügen"**
4. Alternativ: Chrome zeigt automatisch ein „App installieren"-Banner

---

## Hosting auf GitHub Pages

Damit du die App auf dem iPhone testen kannst, muss sie über HTTPS erreichbar sein (Voraussetzung für PWA & Service Worker).

1. Neues Repo auf GitHub anlegen
2. Alle Dateien aus diesem Ordner pushen:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/tabata-timer.git
   git push -u origin main
   ```
3. Repo-Settings → **Pages** → Branch: `main` → Ordner: `/ (root)` → Save
4. Nach ~1 Minute erreichbar unter:
   ```
   https://USERNAME.github.io/tabata-timer/
   ```

---

## Icons neu generieren

Falls du das Icon anpassen möchtest, bearbeite `generate-icons.js` und führe aus:

```bash
node generate-icons.js
```

Erzeugt `icon-192.png` und `icon-512.png` ohne externe Abhängigkeiten.

---

## Workout-Ablauf

```
Warm-up
  └─► Zyklus 1: Übung 1 → Pause → Übung 2 → Pause → … → Übung N → Pause
  └─► Zyklus 2: Übung 1 → Pause → … → Übung N → Pause
  └─► …
Cooldown
  └─► Fertig-Screen
```
