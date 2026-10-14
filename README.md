# Frage anpinnen · 0.1.9

Version 0.1.5 ersetzt den Pin-Button rechts am Stichpunkt durch das Fragezeichen-Symbol der Lernansicht. Ein Klick öffnet weiterhin die gespeicherte Frage.

Version 0.1.4 überarbeitet die Queue-Darstellung: kompakter Fragenbereich mit begrenzter Breite, dezenter Umrandung, Fragezeichen-Symbol und mehr Abstand. Der Text erhält eine angenehmere Zeilenhöhe. Abstände liegen innerhalb der Widget-Höhenmessung, damit der untere Rand nicht abgeschnitten wird. Die Frage berücksichtigt RemNotes eigene Hell-/Dunkel-Einstellung.

Version 0.1.3 behebt das Speichern aus dem Eingabefenster. Speichern und Entfernen verwenden direkte Rem-Aufrufe, da der Desktop-Host Transaktions-Callbacks ausschließlich im Index-Widget ausführt. Nach dem Schreiben wird die gespeicherte Frage erneut gelesen; bei fehlender Bestätigung bleibt das Fenster mit einer Fehlermeldung geöffnet. Die direkte Abfolge ist keine atomare Transaktion; die Prüfung auf zwischenzeitliche Änderungen schützt nicht vor exakt gleichzeitigen Änderungen auf mehreren Geräten.

Version 0.1.2 korrigiert den Fallback-Aufruf: Die Menü-Schnittstelle heißt auf Transportebene `registerRemMenuItem`, ohne `app.`. Der Regressionstest verwendet nun die tatsächliche SDK-Klasse für die Erstregistrierung und bildet den Fehler der installierten RemNote-Version nach.

Version 0.1.1 behebt die Menüregistrierung in der installierten RemNote-Desktop-Version vom Oktober 2026: Deren Schnittstelle verlangt `html`, verwendet intern aber weiterhin `name`. Ein gezielter Fallback übermittelt beide Felder. Zusätzlich werden Startfehler sichtbar gemeldet. Nach dem Update das Plugin in RemNote aus- und wieder einschalten oder RemNote vollständig neu starten.

Ein persönliches RemNote-Plugin: Eine individuelle Frage am Stichpunkt hinterlegen und beim Lernen **zusätzlich zur bestehenden Karte** anzeigen.

## Bedienung

1. Das 6-Punkte-Menü am gewünschten Stichpunkt öffnen und **❔ Frage bearbeiten** auswählen.
2. Frage eingeben und **Fertig** anklicken.
3. Rechts am Stichpunkt erscheint ein **Fragezeichen im Kreis**. Ein Klick darauf öffnet die Frage wieder.
4. **Speichern** übernimmt Änderungen, **Abbrechen** verwirft die Eingabe, **Entfernen** löscht die Frage und entfernt das Symbol.
5. Beim Lernen erscheint die Frage in einem zusätzlichen Bereich unter der bisherigen Karte, vor und nach dem Aufdecken. Die bestehende Kartenfrage, Antwort und Bewertung werden nicht geändert.

Das Plugin erzeugt keine neuen Lernkarten. Der Stichpunkt muss bereits eine Lernkarte haben. Eine Frage gehört zu einem Stichpunkt und gilt für dessen Karten (auch unterschiedliche Richtungen/Lückenkarten). Es gibt keine automatische Vererbung an Unterpunkte. Bei mehrzeiligen Karten sollte die Frage am Stichpunkt hängen, dem RemNote die Karte zuordnet.

## Lokal in RemNote laden

Diese Version ist für RemNote Desktop/Web vorgesehen.

1. **Plugin starten.command** im Plugin-Ordner doppelt anklicken. Das Terminalfenster geöffnet lassen.
2. In RemNote **Einstellungen → Plugins → Build → Develop from localhost** öffnen.
3. Als Adresse `http://localhost:8080` eintragen und das Plugin laden.
4. Die von RemNote angezeigten Plugin-Berechtigungen prüfen und bestätigen.
5. An einer vorhandenen Lernkarte eine Frage anpinnen, über das Symbol bearbeiten und die Karte üben.

Die Menübezeichnungen können je nach Sprache und RemNote-Version abweichen. Zusätzlich ist **Frage bearbeiten** über RemNotes Befehlssuche erreichbar.

Bei der lokalen Installation muss der Server während der Nutzung laufen. Nach einem Neustart genügt ein erneuter Doppelklick auf die Startdatei. Auf einem anderen Computer zunächst Node.js installieren; die Startdatei installiert dann die benötigten Abhängigkeiten. Die gebaute ZIP-Datei liegt daneben als `PluginZip.zip`; sie enthält das Plugin zur späteren Bereitstellung, nicht den Quellcode. Eine dauerhafte Installation ohne lokalen Server benötigt einen separaten Veröffentlichungs-/Hosting-Schritt.

## Speicherung und Berechtigungen

Die Frage liegt als verborgene Eigenschaft des eigenen Powerups `pinned_question` am Rem in der Wissensdatenbank. Das Plugin sendet keine Notizen an externe Dienste. Die Speicherung erfolgt über RemNotes eigene Schnittstelle; Synchronisierung hängt von RemNote ab. Zum Zuordnen und Entfernen von Fragen an beliebigen Stichpunkten fordert die erste Version Lese-, Erstell-, Änderungs- und Löschrechte an. Der Code schreibt ausschließlich sein eigenes Powerup und dessen Eigenschaft. Er ändert weder Bullet-Text noch Rückseite, Karten oder Lernfortschritt.

Das Entfernen einer Frage löscht dieses Powerup samt Frage-Eigenschaft. Das Deaktivieren des Plugins blendet dessen Anzeige aus, löscht aber die gespeicherten Fragen nicht.

## Entwicklung und Prüfung

```sh
npm ci
npm run check-types
npm test
npm run build
npm run dev
```

Grundlage: offizielles RemNote React-Template (MIT), SDK 0.0.46. Die Menüeinträge verwenden `registerRemMenuItem`, das Symbol `RightSideOfEditor` und der zusätzliche Kartenbereich `FlashcardUnder`.

## Veröffentlichung

Der Quellcode liegt unter https://github.com/FC1404/remnote-frage-anpinnen. Das Plugin ist mit `unlisted: true` für die Installation über einen direkten Link vorbereitet. Nach `npm run build` kann `PluginZip.zip` unter RemNote → Plugins → Build → Upload plugin eingereicht werden. Die Freigabe durch RemNote steht noch aus.

Offizielle Dokumentation:
- https://plugins.remnote.com/getting-started/quick_start_guide
- https://plugins.remnote.com/api/classes/AppNamespace
- https://plugins.remnote.com/api/enums/WidgetLocation

Die automatisierten Tests prüfen Speichern, Bearbeiten, Entfernen, Abbrechen, Fehlerfälle und den Erhalt der bisherigen Karte mit einer simulierten RemNote-Anbindung. Die grundlegende Bedienung wurde vom Nutzer in RemNote Desktop erprobt. Die gehostete Installation muss nach der Freigabe separat geprüft werden.
