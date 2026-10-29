# Chitose: intakter Winkarm als zusätzlicher Spender

29.10.2026: Nutzer hat die vorgeschlagene Prüfung von Chitose mit
„OK, versuche es“ freigegeben. Weiterhin gilt: fertige Originalbewegung erhalten,
Luna-Grafik daran anpassen; keine selbst konstruierten Ersatzverformungen.

## Ergebnis

Die Original-Winkanimation zeigt eine offene Hand und einen angewinkelten Arm.
Die vollständige rechte B-Arm-Kette wurde unverändert in ein neues Modell
kopiert und als CMO3/MOC3 gesichert. Vier ursprüngliche Rotationsdeformer,
drei Warp-Deformer und fünf ArtMeshes bleiben erhalten, dazu der vom Editor
beim Kopieren angelegte äußere Positionierungsdeformer.

`node tools/live2d/chitose-transfer-audit.mjs` vergleicht die fünf Meshes
`D_ARM_R_B_00` bis `D_ARM_R_B_04` bei 21 Werten von `PARAM_ARM_R_B` (-10 bis 10)
gegen das unveränderte Original. Eine einmalig bestimmte feste Skalierung und
Verschiebung berücksichtigt die andere Canvas-Größe. Maximale Abweichung:
0,003321 Quellpixel, keine Browserfehler. Neutral und beide Endstellungen
wurden außerdem sichtbar geprüft. Keine inneren Gelenke/Keyforms verändert.

**Grenzen:** Auch Chitose schaltet zwischen getrennten A/B-Armzeichnungen um.
Die Handwave-Motion hält B sichtbar und A unsichtbar; sie enthält keinen
kontinuierlichen Weg vom gesenkten zum gehobenen Arm. Die Pose-Gruppierung
überblendet mit SDK-Standard 0,5 s. Die offene Winkhand ist ein Fortschritt;
natürliches Armheben ist weiterhin ungelöst. Einzelne Finger sind hier nicht
als unabhängige Benutzerparameter vorhanden. Nur ein gemeinsamer Armparameter.

## In Luna eingebaut, 29.10.2026

Nach Freigabe „Naja, dann bau mal ein“ wurde die vollständige Chitose-Kette
mit cremefarbenem Luna-Strickmaterial in die bestehende Luna/Mao-Kopie eingesetzt.
Neue Part-ID `PartLunaWaveR`, äußerer Positionierungsdeformer unter Shoulder R.
Nur die gesamte Kette wurde einheitlich skaliert und versetzt. Originale innere
Deformer, UVs und Keyforms blieben erhalten. Der erste Schulterspalt wurde durch
Versetzen der gesamten Kette geschlossen, nicht durch Gelenkreparaturen.

`--integrated` prüft 21 Originalparameterstellungen: maximale Abweichung
0,002940 Quellpixel nach einer festen Skalierung/Verschiebung. Alle 31 bisherigen
V9-Meshes und alle vier übernommenen Mao-Meshes sind neutral exakt unverändert.
Das exportierte Modell enthält 40 Meshes. Mao links bleibt über
`PartLunaRaisedL` separat wählbar; beide gesenkten Arme bleiben erhalten.

Vorschau: https://ha.dreimer.de/local/luna/native-donors-20261029.html

Das neue Runtime-Profil `native-donors-v1` verbindet den bestehenden
`ParamLunaWave` mit der Sichtbarkeit der Armvarianten. Die Winkbewegung steuert
`PARAM_ARM_R_B` im Bereich 0..8 auf den originalen Formen (eigener Zeitverlauf,
keine Wiedergabe der Original-Motiondatei). Keine nachträgliche Vertexverformung.
Die Vorschau blendet die Haltung über 0,5 Sekunden und winkt sechs Sekunden.
Mund, Augen und kleine native Armbewegungen laufen parallel. Normale HA-Karte
und Sprachpipeline wurden nicht umgestellt: andere bisherige virtuelle Posen
wie Hüfte/verschränkt werden vom neuen Profil noch nicht umgesetzt.

`node tools/live2d/native-avatar-check.mjs` prüft den echten Runtime-Pfad:
Winkbewegung, komplementäre Part-Deckkraft, Mund/Blinzeln, laufende Animation
und pixelgenaue Rückkehr zur Ruhehaltung. Auch mit `LUNA_NATIVE_URL` auf die
HA-Vorschau bestanden, keine Lade- oder Browserfehler. Schulteranschluss und
kleine Körper-/Kopfparameterkombination sichtbar geprüft. Kein vollständiger
Extremposentest und kein neuer Ende-zu-Ende-Sprachtest.

Gesicherte editierbare Quelle: `luna-chitose-integration.cmo3` (final 12:35),
`luna-chitose-arm.cmo3`; Runtime `integration-export/`, Befunde
`integration-checks/`, Ärmelatlas `chitose-luna-atlas.png` in der privaten Ablage.
Der finale Export stammt aus `C:\LunaNative\chitose-aligned-export`, nicht dem
älteren Export mit Schulterspalt. `MATERIAL-PROMPT.txt` hält den verwendeten
Bildgenerierungs-Prompt fest; `sleeves-generated.png` bewahrt das Rohbild.
Originalhand und Daumen wurden pixelgleich übernommen, nur Kleidung ersetzt.

## Daten und Vorschau

Private Ablage: `/home/dreimer/shares/music/Luna/chitose-study-20261029/`.
- `original/`: unveränderte CMO3, CAN3, Runtime und Readme aus dem offiziellen ZIP.
- `SOURCE.json`: Download-URL, ZIP-SHA256, Herkunft und Freigabe.
- `chitose-wave-arm-intact.cmo3`, `arm-export/`: unveränderte extrahierte Armkette.
- `checks/`: Bilder und Geometrievergleich.

Wine-Kopien: `C:\LunaNative\chitose-source.cmo3` (GUI entsperrt, Disk original),
`chitose-wave-arm-intact.cmo3`, `chitose-arm-export/`.
Im Editor fehlende japanische Schriftzeichen ändern die IDs nicht.
Wurzel der kopierten Kette: `B_ARM_R_B_01`; Auswahl im Deformerbaum mit Alt-Klick
einschließlich aller Kinder. Nicht nur die sichtbare Hand kopieren.

Lokaler Server: `node tools/live2d/native-arm-server.mjs`.
Vorschau: http://127.0.0.1:8792/tests/chitose-study.html
Original-Winken nutzt die unveränderte Motion über den SDK-Motionmanager.
`?isolated` zeigt die exportierte Kette mit demselben Parameterbereich.
Private Runtime-Kopien liegen unter ignoriertem `dist/Chitose` und `dist/ChitoseArm`.
Keine Modell-/Texturdaten im Git. Normale HA-Karte unverändert; neue separate Vorschau veröffentlicht.

Offizielle Herkunft: https://www.live2d.com/en/learn/sample/chitose/
Download: https://cubism.live2d.com/sample-data/bin/chitose/chitose_ja.zip
© Live2D Inc.; Bedingungen siehe Original-Readme und offizielle Sample-Seite.

## Fortsetzung

Eingebaute rechte Winkhaltung und linke Mao-Haltung sind zusammen verfügbar.
Weiterhin fehlen durchgehendes Armheben, unabhängig bewegliche Winkfinger und
native Hüft-/Verschränkposen. Keine neuen Zwischenformen konstruieren, sondern
bei weiteren Posen ebenfalls intakte Vorlagen und deren belegte Grenzen prüfen.
Die normale HA-Karte erst umstellen, wenn deren übriges Verhalten abgedeckt ist.

## Prüfung mit echter Avatar-Steuerung

`node tools/live2d/native-combination-check.mjs` verwendet `markerExpression`
und `LunaPerformance` statt nur handgesetzter Modellparameter. Neun Fälle:
neutral, Emoji-Winken, beide Armketten, Freude, schüchtern, sauer, traurig,
überrascht sowie reduzierte Bewegung. Alle ohne Browserfehler oder ungültige
Parameter. Beide Armketten, Schulteranschluss und Sprechmund gemeinsam sichtbar
geprüft. Keine Geometrieänderungen bei dieser Prüfung.

Ergebnis ist ausdrücklich keine Freigabe aller Emotionen: 👋 steuert den
nativen Winkarm, Blush ist sichtbar, aber die virtuellen Gesichtskorrekturen
und Hüft-/Verschränkgesten des alten Profils werden im neuen nativen Profil
nicht ausgeführt. Deshalb wirkt insbesondere „sauer“ noch nicht entsprechend.
Die originale Zeichnungsreihenfolge lässt die Winkhand bei starker Einwärts-
bewegung hinter die Haare treten. Keine stillen Formkorrekturen vorgenommen.
Die normale HA-Karte bleibt bis zur Klärung dieser Funktionslücken unverändert.

## Hauptansicht freigegeben und umgestellt

Der Nutzer akzeptiert vorerst fehlende Ausdrücke und hat die Umstellung explizit
freigegeben. Hauptkarte und Vollbild verwenden jetzt den nativen Stand. Lippen,
Blinzeln, Winken, kleine native Armbewegungen und Blush bleiben verfügbar.
Fehlende Formen wurden weder vorgetäuscht noch durch Browser-Verformungen ersetzt.
Mit Integration 0.4.0b8 sind Gemini und Luna Lokal im Avatar auswählbar; beide
wurden über die tatsächliche HA-Karte einschließlich Audiowiedergabe geprüft.
