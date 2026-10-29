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

Noch keine Integration in Luna, kein fertiger Ärmel, keine gemeinsame Schulter-
oder Körperprüfung. Der bestehende Mao-B-Arm bleibt unverändert. Nicht behaupten,
zwei fertige Modelle seien damit bereits in Luna zusammengeführt.

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
Keine Modell-/Texturdaten im Git. Produktion in HA unverändert.

Offizielle Herkunft: https://www.live2d.com/en/learn/sample/chitose/
Download: https://cubism.live2d.com/sample-data/bin/chitose/chitose_ja.zip
© Live2D Inc.; Bedingungen siehe Original-Readme und offizielle Sample-Seite.

## Fortsetzung

Intakte rechte Kette ist als Spender vorbereitet. Luna-Ärmel und Schulteranschluss
in separater Kopie daran anpassen und erneut geometrisch gegen diesen Stand prüfen.
Die A/B-Überblendung dabei ausdrücklich sichtbar lassen; keine natürliche
Hebebewegung behaupten oder eigenmächtig neue Zwischenformen konstruieren.
