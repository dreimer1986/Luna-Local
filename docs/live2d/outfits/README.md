# Luna: Garderobenentwürfe, 29.10.2026

Drei neue Bildentwürfe, erzeugt mit dem eingebauten imagegen-Werkzeug anhand von
`../references/luna-fullbody-study-v1.png`. Originale bleiben unverändert.
Die vollständigen Prompts stehen in `prompts.md`.

- Sommer: hellblaues Shirt mit Mond, weite helle Sommerhose, Canvas-Schuhe.
- Winter: blauer Mantel, heller Kragen und kurzer Schal, dunkle Hose und Stiefel.
- Nach dem Bad: geschlossener Bademantel mit Handtuch auf der Schulter.
  Dies ist eine erste Interpretation des Handtuch-Wunsches, kein reines Wickelhandtuch.

`index.html` zeigt alle Entwürfe mit Ganzkörper-/Hüftansicht und drei Hintergründen.
Über einen lokalen HTTP-Server öffnen, nicht direkt als file:// (JSON wird geladen).
HA-Vorschau: https://ha.dreimer.de/local/luna/outfits-20261029/index.html

## Stand und nächste Modellarbeit

**Nur statische Konzepte, keine umschaltbaren oder animierten Outfits.** Keine
neuen MOC3-/CMO3-Dateien, keine Änderungen am laufenden V10-Avatar. Der Katalog
führt diese Einträge ausdrücklich als `concept` und enthält keine Modell-URLs.
Die Bilder haben einen Alphakanal; saubere Kanten, anatomische Übereinstimmung
und verdeckte Gelenkflächen müssen bei der Materialaufbereitung geprüft werden.

Der nächste Umsetzungsschritt beginnt mit dem Winteroutfit, dessen Ärmelaufbau
dem bestehenden Modell am ähnlichsten ist:

1. Körpermaterial in Torso, Oberarme, Unterarme, Hände, Beine, Schuhe und
   Kragen/Schal aufteilen. Verdeckte Gelenkflächen ergänzen; keine harten
   Schnittkanten als Gelenke verwenden.
2. Vorhandenen V9-Gesicht-Rig samt Augen/Mund übernehmen. Die neu gezeichneten
   Gesichter sind nur Referenz; ein Ganzbild darf den beweglichen Kopf nicht ersetzen.
3. Eigene Cubism-Quelldatei und Modell-Export je Outfit erstellen. Die V10-
   Posengeometrie ist modellabhängig: Gelenke und Mesh-IDs explizit abgleichen.
4. Sommer benötigt nackte Unterarme, Waden und neue Ärmelsäume. Beim Bademantel
   dürfen Gürtel, Schulterhandtuch und langer Saum nicht an den Armen kleben.
5. Erst nach erfolgreicher Prüfung in den auswählbaren Modellkatalog aufnehmen.
   Karte/Vollbild sollen die Auswahl speichern; ein Ladefehler muss das bisherige
   funktionierende Modell erhalten. Wechsel darf Mikrofon/TTS nicht neu starten.
6. Für jedes Outfit: neutral, lächeln, sauer, verlegen, winken, Hüften,
   verschränkt; Lippen/Blinzeln, Ganzkörper/Hüfte, Tablet und transparente Anzeige
   überprüfen. Danach HA-Automationsauswahl ergänzen.

Die Kleiderwahl bleibt getrennt von zeitlich begrenzten Posen. Ein auslaufendes
`avatar_pose`-Kommando darf die gewählte Kleidung nicht zurücksetzen. Bestehende
Karten ohne Kleiderwahl müssen weiterhin dasselbe V10-Modell laden.
